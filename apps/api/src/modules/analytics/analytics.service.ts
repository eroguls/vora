import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async track(userId: string | undefined, body: { event: string; contentId?: string; duration?: number; position?: number; score?: number }) {
    if (body.event === 'content_view' && body.contentId) {
      await this.prisma.viewEvent.create({ data: { userId, contentId: body.contentId, duration: body.duration } });
      await this.prisma.content.update({ where: { id: body.contentId }, data: { viewCount: { increment: 1 } } });
    }
    return { ok: true };
  }
}
