import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { createHmac, randomBytes, timingSafeEqual } from 'crypto';
import { SessionUser } from './auth.types';

type SessionPayload = SessionUser & {
  type: 'session';
  exp: number;
};

type OAuthStatePayload = {
  type: 'oauth-state';
  nonce: string;
  returnTo: string;
  exp: number;
};

type CookieOptions = {
  httpOnly?: boolean;
  maxAgeMs?: number;
};

type GithubTokenResponse = {
  access_token?: string;
  error?: string;
  error_description?: string;
};

type GithubUserResponse = {
  id: number;
  login: string;
  name: string | null;
  avatar_url: string | null;
};

const SESSION_COOKIE_NAME = 'td_admin_session';
const OAUTH_STATE_COOKIE_NAME = 'td_admin_oauth_state';
const SESSION_DURATION_MS = 1000 * 60 * 60 * 12;
const OAUTH_STATE_DURATION_MS = 1000 * 60 * 10;

@Injectable()
export class AuthService {
  getSessionFromCookieHeader(cookieHeader?: string) {
    const cookies = this.parseCookies(cookieHeader);
    const sessionToken = cookies[SESSION_COOKIE_NAME];

    if (!sessionToken) {
      return null;
    }

    try {
      const payload = this.verifyToken<SessionPayload>(sessionToken, 'session');
      return {
        githubId: payload.githubId,
        login: payload.login,
        name: payload.name,
        avatarUrl: payload.avatarUrl,
      } satisfies SessionUser;
    } catch {
      return null;
    }
  }

  buildGithubStart(returnTo?: string) {
    const normalizedReturnTo = this.normalizeReturnTo(returnTo);
    const stateToken = this.signToken<OAuthStatePayload>({
      type: 'oauth-state',
      nonce: randomBytes(16).toString('hex'),
      returnTo: normalizedReturnTo,
      exp: Date.now() + OAUTH_STATE_DURATION_MS,
    });

    const params = new URLSearchParams({
      client_id: this.getRequiredEnv('GITHUB_CLIENT_ID'),
      redirect_uri: this.getGithubCallbackUrl(),
      scope: 'read:user',
      state: stateToken,
    });

    return {
      authorizationUrl: `https://github.com/login/oauth/authorize?${params.toString()}`,
      stateCookie: this.serializeCookie(OAUTH_STATE_COOKIE_NAME, stateToken, {
        httpOnly: true,
        maxAgeMs: OAUTH_STATE_DURATION_MS,
      }),
    };
  }

  async completeGithubLogin(code: string | undefined, state: string | undefined, cookieHeader?: string) {
    if (!code || !state) {
      throw new UnauthorizedException('GitHub no devolvio un codigo valido.');
    }

    const cookies = this.parseCookies(cookieHeader);
    const storedState = cookies[OAUTH_STATE_COOKIE_NAME];

    if (!storedState || storedState !== state) {
      throw new UnauthorizedException('La sesion de login expiro o no coincide.');
    }

    const statePayload = this.verifyToken<OAuthStatePayload>(state, 'oauth-state');
    const accessToken = await this.exchangeCodeForAccessToken(code, state);
    const githubUser = await this.fetchGithubUser(accessToken);

    if (githubUser.login.toLowerCase() !== this.getAuthorizedGithubUsername().toLowerCase()) {
      throw new UnauthorizedException('Tu cuenta de GitHub no esta autorizada para este panel.');
    }

    const sessionToken = this.signToken<SessionPayload>({
      type: 'session',
      exp: Date.now() + SESSION_DURATION_MS,
      githubId: githubUser.id,
      login: githubUser.login,
      name: githubUser.name,
      avatarUrl: githubUser.avatar_url,
    });

    return {
      redirectTo: statePayload.returnTo,
      setCookies: [
        this.serializeCookie(SESSION_COOKIE_NAME, sessionToken, {
          httpOnly: true,
          maxAgeMs: SESSION_DURATION_MS,
        }),
        this.clearCookie(OAUTH_STATE_COOKIE_NAME),
      ],
    };
  }

  buildFailureRedirect(rawState: string | undefined, cookieHeader?: string, message?: string) {
    const cookies = this.parseCookies(cookieHeader);
    const encodedState = rawState ?? cookies[OAUTH_STATE_COOKIE_NAME];
    let redirectTo = this.getDefaultReturnTo();

    if (encodedState) {
      try {
        const statePayload = this.verifyToken<OAuthStatePayload>(encodedState, 'oauth-state');
        redirectTo = statePayload.returnTo;
      } catch {
        redirectTo = this.getDefaultReturnTo();
      }
    }

    const url = new URL(redirectTo);
    if (message) {
      url.searchParams.set('authError', message);
    }

    return {
      redirectTo: url.toString(),
      setCookies: [
        this.clearCookie(OAUTH_STATE_COOKIE_NAME),
        this.clearCookie(SESSION_COOKIE_NAME),
      ],
    };
  }

  buildLogoutResponse() {
    return {
      setCookies: [this.clearCookie(SESSION_COOKIE_NAME)],
    };
  }

  private async exchangeCodeForAccessToken(code: string, state: string) {
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.getRequiredEnv('GITHUB_CLIENT_ID'),
        client_secret: this.getRequiredEnv('GITHUB_CLIENT_SECRET'),
        code,
        redirect_uri: this.getGithubCallbackUrl(),
        state,
      }),
    });

    const payload = (await response.json()) as GithubTokenResponse;

    if (!response.ok || !payload.access_token) {
      throw new UnauthorizedException(
        payload.error_description || 'No fue posible completar el login con GitHub.',
      );
    }

    return payload.access_token;
  }

  private async fetchGithubUser(accessToken: string) {
    const response = await fetch('https://api.github.com/user', {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${accessToken}`,
        'User-Agent': 'tylordev-admin-auth',
      },
    });

    if (!response.ok) {
      throw new UnauthorizedException('No se pudo verificar la cuenta de GitHub.');
    }

    return (await response.json()) as GithubUserResponse;
  }

  private normalizeReturnTo(rawReturnTo?: string) {
    if (!rawReturnTo) {
      return this.getDefaultReturnTo();
    }

    let parsed: URL;
    try {
      parsed = new URL(rawReturnTo);
    } catch {
      return this.getDefaultReturnTo();
    }

    const allowedOrigins = this.getAllowedAdminOrigins();
    if (!allowedOrigins.has(parsed.origin)) {
      return this.getDefaultReturnTo();
    }

    return parsed.toString();
  }

  private getDefaultReturnTo() {
    return this.getAllowedAdminUrls()[0] ?? 'http://localhost:5173/';
  }

  private getAllowedAdminUrls() {
    const configuredOrigins =
      process.env.ADMIN_APP_URLS ??
      'http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173,http://127.0.0.1:4173';

    return configuredOrigins
      .split(',')
      .map((origin) => origin.trim().replace(/\/$/, ''))
      .filter(Boolean);
  }

  private getAllowedAdminOrigins() {
    return new Set(
      this.getAllowedAdminUrls()
        .map((configuredUrl) => {
          try {
            return new URL(configuredUrl).origin;
          } catch {
            return configuredUrl;
          }
        })
        .filter(Boolean),
    );
  }

  private getGithubCallbackUrl() {
    return (
      process.env.GITHUB_CALLBACK_URL ??
      `${process.env.API_PUBLIC_URL ?? 'http://localhost:4000'}/auth/github/callback`
    );
  }

  private getAuthorizedGithubUsername() {
    return process.env.AUTHORIZED_GITHUB_USERNAME ?? 'TylorDev';
  }

  private getRequiredEnv(name: string) {
    const value = process.env[name];
    if (!value) {
      throw new InternalServerErrorException(`Missing required environment variable: ${name}`);
    }
    return value;
  }

  private signToken<T extends { type: string; exp: number }>(payload: T) {
    const encodedPayload = this.base64UrlEncode(JSON.stringify(payload));
    const signature = this.createSignature(encodedPayload);
    return `${encodedPayload}.${signature}`;
  }

  private verifyToken<T extends { type: string; exp: number }>(token: string, expectedType: T['type']) {
    const [encodedPayload, providedSignature] = token.split('.');

    if (!encodedPayload || !providedSignature) {
      throw new UnauthorizedException('Token invalido.');
    }

    const expectedSignature = this.createSignature(encodedPayload);
    const providedBuffer = Buffer.from(providedSignature);
    const expectedBuffer = Buffer.from(expectedSignature);

    if (
      providedBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(providedBuffer, expectedBuffer)
    ) {
      throw new UnauthorizedException('Firma de token invalida.');
    }

    const parsedPayload = JSON.parse(this.base64UrlDecode(encodedPayload)) as T;

    if (parsedPayload.type !== expectedType) {
      throw new UnauthorizedException('Tipo de token invalido.');
    }

    if (parsedPayload.exp <= Date.now()) {
      throw new UnauthorizedException('Token expirado.');
    }

    return parsedPayload;
  }

  private createSignature(value: string) {
    const secret = this.getRequiredEnv('AUTH_SESSION_SECRET');

    return createHmac('sha256', secret).update(value).digest('base64url');
  }

  private parseCookies(cookieHeader?: string) {
    if (!cookieHeader) {
      return {} as Record<string, string>;
    }

    return cookieHeader.split(';').reduce<Record<string, string>>((accumulator, entry) => {
      const [name, ...rest] = entry.trim().split('=');
      if (!name) {
        return accumulator;
      }

      accumulator[name] = decodeURIComponent(rest.join('='));
      return accumulator;
    }, {});
  }

  private clearCookie(name: string) {
    return this.serializeCookie(name, '', { httpOnly: true, maxAgeMs: 0 });
  }

  private serializeCookie(name: string, value: string, options: CookieOptions = {}) {
    const parts = [`${name}=${encodeURIComponent(value)}`, 'Path=/', 'SameSite=Lax'];

    if (options.maxAgeMs !== undefined) {
      const maxAgeSeconds = Math.max(0, Math.floor(options.maxAgeMs / 1000));
      parts.push(`Max-Age=${maxAgeSeconds}`);
    }

    if (options.httpOnly) {
      parts.push('HttpOnly');
    }

    if (this.shouldUseSecureCookies()) {
      parts.push('Secure');
    }

    return parts.join('; ');
  }

  private shouldUseSecureCookies() {
    return process.env.NODE_ENV === 'production' || process.env.SECURE_COOKIES === 'true';
  }

  private base64UrlEncode(value: string) {
    return Buffer.from(value, 'utf8').toString('base64url');
  }

  private base64UrlDecode(value: string) {
    return Buffer.from(value, 'base64url').toString('utf8');
  }
}
