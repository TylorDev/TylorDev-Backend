import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthRequest } from './auth.types';

@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthRequest>();
    const user = this.authService.getSessionFromCookieHeader(request.headers.cookie);

    if (!user) {
      throw new UnauthorizedException('Necesitas iniciar sesion para modificar contenido.');
    }

    request.user = user;
    return true;
  }
}
