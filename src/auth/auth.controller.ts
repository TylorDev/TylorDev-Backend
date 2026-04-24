import {
  Controller,
  Get,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SessionAuthGuard } from './session-auth.guard';
import { AuthRequest } from './auth.types';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('github/start')
  startGithubLogin(@Query('returnTo') returnTo: string | undefined, @Res() response: any) {
    const { authorizationUrl, stateCookie } = this.authService.buildGithubStart(returnTo);
    response.setHeader('Set-Cookie', stateCookie);
    response.redirect(authorizationUrl);
  }

  @Get('github/callback')
  async completeGithubLogin(
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Req() request: AuthRequest,
    @Res() response: any,
  ) {
    try {
      const result = await this.authService.completeGithubLogin(code, state, request.headers.cookie);
      response.setHeader('Set-Cookie', result.setCookies);
      response.redirect(result.redirectTo);
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : 'No fue posible iniciar sesion con GitHub.';
      const result = this.authService.buildFailureRedirect(state, request.headers.cookie, message);
      response.setHeader('Set-Cookie', result.setCookies);
      response.redirect(result.redirectTo);
    }
  }

  @Get('session')
  @UseGuards(SessionAuthGuard)
  getSession(@Req() request: AuthRequest) {
    if (!request.user) {
      throw new UnauthorizedException('No hay una sesion activa.');
    }

    return request.user;
  }

  @Post('logout')
  logout(@Res() response: any) {
    const result = this.authService.buildLogoutResponse();
    response.setHeader('Set-Cookie', result.setCookies);
    response.json({ success: true });
  }
}
