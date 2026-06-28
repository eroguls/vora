import { Injectable, NotFoundException } from '@nestjs/common';
import { commentSchema } from '@vora/validation';
import sanitizeHtml from 'sanitize-html';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CommentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, contentId: string, body: unknown) {
    const input = commentSchema.parse(body);
    const content = await this.prisma.content.findFirst({ where: { id: contentId, deletedAt: null } });
    if (!content) throw new NotFoundException('Content not found.');
    const cleanBody = sanitizeHtml(input.body, { allowedTags: [], allowedAttributes: {} }).trim();
    const comment = await this.prisma.comment.create({
      data: { contentId, authorId: userId, body: cleanBody, parentId: input.parentId ?? undefined },
      include: { author: { include: { profile: true } } },
    });
    await this.prisma.content.update({ where: { id: contentId }, data: { commentCount: { increment: 1 } } });
    if (content.authorId !== userId) {
      await this.prisma.notification.create({
        data: {
          recipientId: content.authorId,
          actorId: userId,
          contentId,
          commentId: comment.id,
          type: input.parentId ? 'COMMENT_REPLY' : 'COMMENT',
          title: input.parentId ? 'Yorumuna cevap geldi' : 'İçeriğine yorum geldi',
          body: cleanBody,
          href: `/content/${contentId}`,
        },
      });
    }
    return {
      id: comment.id,
      body: comment.body,
      createdAt: comment.createdAt.toISOString(),
      likeCount: comment.likeCount,
      author: {
        id: comment.author.id,
        username: comment.author.username,
        displayName: comment.author.displayName,
        avatarUrl: comment.author.profile?.avatarUrl ?? null,
        isVerified: comment.author.isVerified,
      },
    };
  }

  async like(userId: string, commentId: string) {
    const comment = await this.prisma.comment.findFirst({ where: { id: commentId, deletedAt: null } });
    if (!comment) throw new NotFoundException('Comment not found.');
    const existing = await this.prisma.commentLike.findUnique({ where: { userId_commentId: { userId, commentId } } });
    if (!existing) {
      await this.prisma.$transaction([
        this.prisma.commentLike.create({ data: { userId, commentId } }),
        this.prisma.comment.update({ where: { id: commentId }, data: { likeCount: { increment: 1 } } }),
      ]);
    }
    return { liked: true };
  }

  async unlike(userId: string, commentId: string) {
    const existing = await this.prisma.commentLike.findUnique({ where: { userId_commentId: { userId, commentId } } });
    if (existing) {
      await this.prisma.$transaction([
        this.prisma.commentLike.delete({ where: { id: existing.id } }),
        this.prisma.comment.update({ where: { id: commentId }, data: { likeCount: { decrement: 1 } } }),
      ]);
    }
    return { liked: false };
  }
}
