import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async suggestions(viewerId?: string) {
    const users = await this.prisma.user.findMany({
      where: { status: 'ACTIVE', deletedAt: null, id: viewerId ? { not: viewerId } : undefined },
      include: { profile: true },
      orderBy: [{ isVerified: 'desc' }, { createdAt: 'desc' }],
      take: 6,
    });
    return users.map((user) => ({
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.profile?.avatarUrl ?? null,
      bio: user.profile?.bio ?? null,
      isVerified: user.isVerified,
    }));
  }

  async getByUsername(username: string) {
    return this.prisma.user.findUnique({ where: { username: username.replace(/^@/, '').toLowerCase() }, include: { profile: true } });
  }
}
