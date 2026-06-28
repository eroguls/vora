import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { AuthenticatedRequest, RequestUser } from './request-user';
import { loadEnv } from '@vora/config';

@Injectable()
export class OptionalAuthGuard implements CanActivate {
  private readonly env = loadEnv();
  private readonly jwt = new JwtService();

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const header = request.headers.authorization;
    if (!header?.startsWith('Bearer ')) return true;
    try {
      request.user = this.jwt.verify<RequestUser>(header.slice(7), { secret: this.env.JWT_ACCESS_SECRET });
    } catch {
      request.user = undefined;
    }
    return true;
  }
}
