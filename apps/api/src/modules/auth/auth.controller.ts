import { Body, Controller, Get, Patch, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AuthGuard } from '../../common/auth/auth.guard';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { RequestUser } from '../../common/auth/request-user';
import { AuthService } from './auth.service';
import { ForgotPasswordDto, LoginDto, RegisterDto, ResetPasswordDto } from './dto';
import { loadEnv } from '@vora/config';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  private readonly env = loadEnv();

  constructor(private readonly auth: AuthService) {}

  @Post('register')
  async register(@Body() body: RegisterDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const result = await this.auth.register(body, this.meta(req));
    this.setRefreshCookie(res, result.refreshToken);
    return { accessToken: result.accessToken, user: result.user };
  }

  @Post('login')
  async login(@Body() body: LoginDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const result = await this.auth.login(body, this.meta(req));
    this.setRefreshCookie(res, result.refreshToken);
    return { accessToken: result.accessToken, user: result.user };
  }

  @Post('refresh')
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const result = await this.auth.refresh(req.cookies?.[this.auth.refreshCookieName], this.meta(req));
    this.setRefreshCookie(res, result.refreshToken);
    return { accessToken: result.accessToken, user: result.user };
  }

  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const result = await this.auth.logout(req.cookies?.[this.auth.refreshCookieName]);
    res.clearCookie(this.auth.refreshCookieName, { path: '/auth/refresh' });
    return result;
  }

  @Post('forgot-password')
  forgotPassword(@Body() body: ForgotPasswordDto) {
    return this.auth.forgotPassword(body.email);
  }

  @Post('reset-password')
  resetPassword(@Body() body: ResetPasswordDto) {
    return this.auth.resetPassword(body.token, body.password);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get('me')
  me(@CurrentUser() user: RequestUser) {
    return this.auth.me(user.id);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get('sessions')
  sessions(@CurrentUser() user: RequestUser) {
    return this.auth.sessions(user.id);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Patch('password')
  changePassword(@CurrentUser() user: RequestUser, @Body() body: { currentPassword?: string; newPassword?: string }) {
    return this.auth.changePassword(user.id, body);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Post('sessions/revoke-others')
  revokeOtherSessions(@CurrentUser() user: RequestUser, @Req() req: Request) {
    return this.auth.revokeOtherSessions(user.id, req.cookies?.[this.auth.refreshCookieName]);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Post('deactivate')
  deactivate(@CurrentUser() user: RequestUser, @Body() body: { password?: string }) {
    return this.auth.deactivate(user.id, body);
  }

  private setRefreshCookie(res: Response, token: string) {
    res.cookie(this.auth.refreshCookieName, token, {
      httpOnly: true,
      secure: this.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/auth/refresh',
      maxAge: this.env.REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000,
    });
  }

  private meta(req: Request) {
    return { ipAddress: req.ip, userAgent: req.headers['user-agent'] };
  }
}
