import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { presentContent } from '../content/content.presenter';

@Injectable()
export class InteractionService {
  constructor(private readonly prisma: PrismaService) {}

  async like(userId: string, contentId: string) {
    const content = await this.ensureContent(contentId);
    const existing = await this.prisma.like.findUnique({ where: { userId_contentId: { userId, contentId } } });
    if (!existing) {
      await this.prisma.$transaction([
        this.prisma.like.create({ data: { userId, contentId } }),
        this.prisma.content.update({ where: { id: contentId }, data: { likeCount: { increment: 1 } } }),
      ]);
      if (content.authorId !== userId) {
        await this.prisma.notification.create({
          data: { recipientId: content.authorId, actorId: userId, contentId, type: 'LIKE', title: 'İçeriğin beğenildi', href: `/content/${contentId}` },
        });
      }
    }
    return this.state(userId, contentId);
  }

  async unlike(userId: string, contentId: string) {
    const existing = await this.prisma.like.findUnique({ where: { userId_contentId: { userId, contentId } } });
    if (existing) {
      await this.prisma.$transaction([
        this.prisma.like.delete({ where: { id: existing.id } }),
        this.prisma.content.update({ where: { id: contentId }, data: { likeCount: { decrement: 1 } } }),
      ]);
    }
    return this.state(userId, contentId);
  }

  async bookmark(userId: string, contentId: string) {
    await this.ensureContent(contentId);
    const existing = await this.prisma.bookmark.findUnique({ where: { userId_contentId: { userId, contentId } } });
    if (!existing) {
      await this.prisma.$transaction([
        this.prisma.bookmark.create({ data: { userId, contentId } }),
        this.prisma.content.update({ where: { id: contentId }, data: { saveCount: { increment: 1 } } }),
      ]);
    }
    return this.state(userId, contentId);
  }

  async unbookmark(userId: string, contentId: string) {
    const existing = await this.prisma.bookmark.findUnique({ where: { userId_contentId: { userId, contentId } } });
    if (existing) {
      await this.prisma.$transaction([
        this.prisma.bookmark.delete({ where: { id: existing.id } }),
        this.prisma.content.update({ where: { id: contentId }, data: { saveCount: { decrement: 1 } } }),
      ]);
    }
    return this.state(userId, contentId);
  }

  async share(userId: string, contentId: string, quoteBody?: string) {
    const content = await this.ensureContent(contentId);
    await this.prisma.$transaction([
      this.prisma.share.create({ data: { userId, contentId, quoteBody } }),
      this.prisma.content.update({ where: { id: contentId }, data: { shareCount: { increment: 1 } } }),
    ]);
    if (content.authorId !== userId) {
      await this.prisma.notification.create({
        data: {
          recipientId: content.authorId,
          actorId: userId,
          contentId,
          type: quoteBody ? 'QUOTE_SHARE' : 'CONTENT_SHARE',
          title: quoteBody ? 'İçeriğin alıntılandı' : 'İçeriğin paylaşıldı',
          body: quoteBody,
          href: `/content/${contentId}`,
        },
      });
    }
    return this.state(userId, contentId);
  }

  async saved(userId: string, cursor?: string) {
    const parsed = cursor ? new Date(Buffer.from(cursor, 'base64url').toString('utf8')) : null;
    const rows = await this.prisma.bookmark.findMany({
      where: { userId, ...(parsed ? { createdAt: { lt: parsed } } : {}) },
      include: { content: { include: { author: { include: { profile: true } }, media: { orderBy: { sortOrder: 'asc' } } } } },
      orderBy: { createdAt: 'desc' },
      take: 21,
    });
    const items = rows.slice(0, 20).map((row) => presentContent(row.content, { liked: false, bookmarked: true, followingAuthor: false }));
    return { items, nextCursor: rows.length > 20 ? Buffer.from(rows[19].createdAt.toISOString()).toString('base64url') : null };
  }

  async state(userId: string, contentId: string) {
    const [content, like, bookmark] = await Promise.all([
      this.ensureContent(contentId),
      this.prisma.like.findUnique({ where: { userId_contentId: { userId, contentId } } }),
      this.prisma.bookmark.findUnique({ where: { userId_contentId: { userId, contentId } } }),
    ]);
    return {
      contentId,
      liked: Boolean(like),
      bookmarked: Boolean(bookmark),
      likeCount: content.likeCount,
      commentCount: content.commentCount,
      shareCount: content.shareCount,
      saveCount: content.saveCount,
    };
  }

  private async ensureContent(contentId: string) {
    const content = await this.prisma.content.findFirst({ where: { id: contentId, deletedAt: null } });
    if (!content) throw new NotFoundException('Content not found.');
    return content;
  }
}
