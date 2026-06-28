import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: NotificationsGateway,
  ) {}

  async create(input: Parameters<PrismaService['notification']['create']>[0]['data']) {
    const notification = await this.prisma.notification.create({ data: input });
    this.gateway.emitToUser(notification.recipientId, notification);
    return notification;
  }

  async list(userId: string, cursor?: string) {
    const parsed = cursor ? new Date(Buffer.from(cursor, 'base64url').toString('utf8')) : null;
    const rows = await this.prisma.notification.findMany({
      where: { recipientId: userId, ...(parsed ? { createdAt: { lt: parsed } } : {}) },
      orderBy: { createdAt: 'desc' },
      take: 21,
    });
    const items = rows.slice(0, 20).map((item) => ({ ...item, createdAt: item.createdAt.toISOString(), readAt: item.readAt?.toISOString() ?? null }));
    return { items, unreadCount: await this.prisma.notification.count({ where: { recipientId: userId, readAt: null } }), nextCursor: rows.length > 20 ? Buffer.from(rows[19].createdAt.toISOString()).toString('base64url') : null };
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({ where: { recipientId: userId, readAt: null }, data: { readAt: new Date() } });
    return { ok: true };
  }
}
