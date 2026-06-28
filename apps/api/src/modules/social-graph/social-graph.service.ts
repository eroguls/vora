import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SocialGraphService {
  constructor(private readonly prisma: PrismaService) {}

  async blocks(userId: string) {
    const rows = await this.prisma.block.findMany({
      where: { blockerId: userId },
      orderBy: { createdAt: 'desc' },
      include: { blocked: { select: { id: true, username: true, displayName: true, profile: { select: { avatarUrl: true, bio: true } } } } },
    });
    return rows.map((row) => ({
      id: row.id,
      createdAt: row.createdAt,
      user: row.blocked,
    }));
  }

  async mutes(userId: string) {
    const rows = await this.prisma.mute.findMany({
      where: { muterId: userId },
      orderBy: { createdAt: 'desc' },
      include: { muted: { select: { id: true, username: true, displayName: true, profile: { select: { avatarUrl: true, bio: true } } } } },
    });
    return rows.map((row) => ({
      id: row.id,
      createdAt: row.createdAt,
      user: row.muted,
    }));
  }

  async follow(userId: string, targetId: string) {
    if (userId === targetId) throw new BadRequestException('You cannot follow yourself.');
    const [target, actor] = await Promise.all([
      this.prisma.user.findFirst({ where: { id: targetId, deletedAt: null, status: 'ACTIVE' } }),
      this.prisma.user.findUnique({ where: { id: userId }, select: { displayName: true, username: true } }),
    ]);
    if (!target) throw new NotFoundException('User not found.');
    const existing = await this.prisma.follow.findUnique({ where: { followerId_followingId: { followerId: userId, followingId: targetId } } });
    if (!existing) {
      await this.prisma.$transaction([
        this.prisma.follow.create({ data: { followerId: userId, followingId: targetId } }),
        this.prisma.profile.update({ where: { userId }, data: { followingCount: { increment: 1 } } }),
        this.prisma.profile.update({ where: { userId: targetId }, data: { followerCount: { increment: 1 } } }),
      ]);
      await this.prisma.notification.create({
        data: { recipientId: targetId, actorId: userId, type: 'NEW_FOLLOWER', title: `${actor?.displayName ?? actor?.username ?? 'Bir kullanıcı'} seni takip etmeye başladı.`, href: `/@${actor?.username ?? target.username}` },
      });
    }
    return { following: true };
  }

  async unfollow(userId: string, targetId: string) {
    const existing = await this.prisma.follow.findUnique({ where: { followerId_followingId: { followerId: userId, followingId: targetId } } });
    if (existing) {
      await this.prisma.$transaction([
        this.prisma.follow.delete({ where: { id: existing.id } }),
        this.prisma.profile.update({ where: { userId }, data: { followingCount: { decrement: 1 } } }),
        this.prisma.profile.update({ where: { userId: targetId }, data: { followerCount: { decrement: 1 } } }),
      ]);
    }
    return { following: false };
  }

  async block(userId: string, targetId: string) {
    if (userId === targetId) throw new BadRequestException('You cannot block yourself.');
    await this.prisma.block.upsert({ where: { blockerId_blockedId: { blockerId: userId, blockedId: targetId } }, update: {}, create: { blockerId: userId, blockedId: targetId } });
    await this.unfollow(userId, targetId).catch(() => null);
    await this.unfollow(targetId, userId).catch(() => null);
    return { blocked: true };
  }

  async unblock(userId: string, targetId: string) {
    await this.prisma.block.deleteMany({ where: { blockerId: userId, blockedId: targetId } });
    return { blocked: false };
  }

  async mute(userId: string, targetId: string) {
    await this.prisma.mute.upsert({ where: { muterId_mutedId: { muterId: userId, mutedId: targetId } }, update: {}, create: { muterId: userId, mutedId: targetId } });
    return { muted: true };
  }

  async unmute(userId: string, targetId: string) {
    await this.prisma.mute.deleteMany({ where: { muterId: userId, mutedId: targetId } });
    return { muted: false };
  }
}
