import { BadRequestException, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { loadEnv } from '@vora/config';
import type { LoginDto, RegisterDto } from './dto';
import type { RequestUser } from '../../common/auth/request-user';

const REFRESH_COOKIE = 'vora_refresh';

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    username: string;
    displayName: string;
    role: string;
    adminRole: string | null;
    avatarUrl: string | null;
  };
}

@Injectable()
export class AuthService {
  private readonly env = loadEnv();

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  get refreshCookieName() {
    return REFRESH_COOKIE;
  }

  async register(input: RegisterDto, meta: { ipAddress?: string; userAgent?: string }): Promise<AuthResult> {
    const passwordHash = await hash(input.password, 12);
    const user = await this.prisma.user.create({
      data: {
        email: input.email.toLowerCase(),
        username: input.username.toLowerCase(),
        displayName: input.displayName,
        passwordHash,
        birthDate: input.birthDate ? new Date(input.birthDate) : undefined,
        accounts: { create: { provider: 'EMAIL', providerAccountId: input.email.toLowerCase() } },
        profile: { create: { bio: null, languages: ['tr', 'en'], links: [] } },
      },
      include: { profile: true },
    });
    return this.createAuthResult(user, meta);
  }

  async login(input: LoginDto, meta: { ipAddress?: string; userAgent?: string }): Promise<AuthResult> {
    const normalized = input.emailOrUsername.toLowerCase();
    const user = await this.prisma.user.findFirst({
      where: { OR: [{ email: normalized }, { username: normalized }], deletedAt: null },
      include: { profile: true },
    });
    if (!user || user.status !== 'ACTIVE') throw new UnauthorizedException('Invalid credentials.');
    const validPassword = await compare(input.password, user.passwordHash);
    if (!validPassword) throw new UnauthorizedException('Invalid credentials.');
    await this.prisma.user.update({ where: { id: user.id }, data: { lastSeenAt: new Date() } });
    return this.createAuthResult(user, meta);
  }

  async refresh(rawToken: string | undefined, meta: { ipAddress?: string; userAgent?: string }): Promise<AuthResult> {
    if (!rawToken) throw new UnauthorizedException('Refresh token is required.');
    const tokenHash = this.hashToken(rawToken);
    const existing = await this.prisma.refreshToken.findUnique({ where: { tokenHash }, include: { user: { include: { profile: true } } } });
    if (!existing || existing.expiresAt < new Date()) throw new UnauthorizedException('Refresh token is invalid.');
    if (existing.revokedAt) {
      await this.prisma.refreshToken.updateMany({ where: { familyId: existing.familyId }, data: { revokedAt: new Date() } });
      throw new UnauthorizedException('Refresh token reuse was detected.');
    }
    if (existing.user.status !== 'ACTIVE') throw new UnauthorizedException('User is not active.');

    const result = await this.createAuthResult(existing.user, meta, existing.familyId);
    await this.prisma.refreshToken.update({
      where: { id: existing.id },
      data: { rotatedAt: new Date(), revokedAt: new Date(), replacedById: this.hashToken(result.refreshToken).slice(0, 32) },
    });
    return result;
  }

  async logout(rawToken: string | undefined) {
    if (!rawToken) return { ok: true };
    await this.prisma.refreshToken.updateMany({ where: { tokenHash: this.hashToken(rawToken) }, data: { revokedAt: new Date() } });
    return { ok: true };
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) return { ok: true };
    const token = randomBytes(32).toString('base64url');
    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: this.hashToken(token),
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      },
    });
    return { ok: true, resetToken: this.env.NODE_ENV === 'development' ? token : undefined };
  }

  async resetPassword(token: string, password: string) {
    const reset = await this.prisma.passwordResetToken.findUnique({ where: { tokenHash: this.hashToken(token) } });
    if (!reset || reset.usedAt || reset.expiresAt < new Date()) throw new UnauthorizedException('Reset token is invalid or expired.');
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: reset.userId }, data: { passwordHash: await hash(password, 12) } }),
      this.prisma.passwordResetToken.update({ where: { id: reset.id }, data: { usedAt: new Date() } }),
      this.prisma.refreshToken.updateMany({ where: { userId: reset.userId, revokedAt: null }, data: { revokedAt: new Date() } }),
    ]);
    return { ok: true };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, include: { profile: true } });
    if (!user) throw new UnauthorizedException('User not found.');
    return this.toUser(user);
  }

  async sessions(userId: string) {
    const sessions = await this.prisma.session.findMany({
      where: { userId, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    return sessions.map((session) => ({
      id: session.id,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
    }));
  }

  async changePassword(userId: string, body: { currentPassword?: string; newPassword?: string }) {
    if (!body.currentPassword || !body.newPassword || body.newPassword.length < 8) throw new BadRequestException('Current password and a new password of at least 8 characters are required.');
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found.');
    const validPassword = await compare(body.currentPassword, user.passwordHash);
    if (!validPassword) throw new ForbiddenException('Current password is incorrect.');
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: userId }, data: { passwordHash: await hash(body.newPassword, 12) } }),
      this.prisma.refreshToken.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } }),
      this.prisma.session.deleteMany({ where: { userId } }),
    ]);
    return { ok: true };
  }

  async revokeOtherSessions(userId: string, currentRawToken: string | undefined) {
    const currentHash = currentRawToken ? this.hashToken(currentRawToken) : null;
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null, ...(currentHash ? { tokenHash: { not: currentHash } } : {}) },
      data: { revokedAt: new Date() },
    });
    await this.prisma.session.deleteMany({ where: { userId } });
    return { ok: true };
  }

  async deactivate(userId: string, body: { password?: string }) {
    if (!body.password) throw new BadRequestException('Password is required.');
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found.');
    const validPassword = await compare(body.password, user.passwordHash);
    if (!validPassword) throw new ForbiddenException('Password is incorrect.');
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: userId }, data: { status: 'SUSPENDED' } }),
      this.prisma.refreshToken.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } }),
      this.prisma.session.deleteMany({ where: { userId } }),
    ]);
    return { ok: true };
  }

  private async createAuthResult(
    user: Parameters<typeof this.toUser>[0],
    meta: { ipAddress?: string; userAgent?: string },
    familyId: string = randomUUID(),
  ): Promise<AuthResult> {
    const payload: RequestUser = { id: user.id, username: user.username, role: user.role as 'USER' | 'ADMIN', adminRole: user.adminRole };
    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.env.JWT_ACCESS_SECRET,
      expiresIn: this.env.ACCESS_TOKEN_TTL as never,
    });
    const refreshToken = randomBytes(48).toString('base64url');
    const expiresAt = new Date(Date.now() + this.env.REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000);
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: this.hashToken(refreshToken),
        familyId,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
        expiresAt,
      },
    });
    await this.prisma.session.create({
      data: { userId: user.id, ipAddress: meta.ipAddress, userAgent: meta.userAgent, expiresAt },
    });
    return { accessToken, refreshToken, user: this.toUser(user) };
  }

  private toUser(user: { id: string; email: string; username: string; displayName: string; role: string; adminRole: string | null; profile?: { avatarUrl: string | null } | null }) {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      role: user.role,
      adminRole: user.adminRole,
      avatarUrl: user.profile?.avatarUrl ?? null,
    };
  }

  private hashToken(raw: string): string {
    if (raw.length < 20) throw new BadRequestException('Invalid token format.');
    return createHash('sha256').update(raw).digest('hex');
  }
}
