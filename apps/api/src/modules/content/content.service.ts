import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import sanitizeHtml from 'sanitize-html';
import { AIContentClassifier } from '@vora/content-engine';
import { createContentSchema, type CreateContentInput } from '@vora/validation';
import { PrismaService } from '../../prisma/prisma.service';
import { excerpt, slugify } from '../../common/utils/slug';
import { loadEnv } from '@vora/config';
import { presentContent } from './content.presenter';

const PAGE_SIZE = 20;

@Injectable()
export class ContentService {
  private readonly env = loadEnv();
  private readonly classifier = new AIContentClassifier({ enabled: this.env.AI_CLASSIFICATION_ENABLED });

  constructor(private readonly prisma: PrismaService) {}

  async create(authorId: string, body: unknown) {
    const input = createContentSchema.parse(body) as CreateContentInput;
    if (!input.title && !input.body && input.media.length === 0) {
      throw new BadRequestException('Text, title or media is required.');
    }

    const cleanBody = input.body ? sanitizeHtml(input.body, { allowedTags: [], allowedAttributes: {} }).trim() : null;
    const cleanTitle = input.title ? sanitizeHtml(input.title, { allowedTags: [], allowedAttributes: {} }).trim() : null;
    const classification = await this.classifier.classify({
      title: cleanTitle,
      body: cleanBody,
      language: input.originalLanguage ?? input.language,
      media: input.media.map((media) => ({
        mediaType: media.mediaType,
        mimeType: media.mimeType,
        duration: media.duration,
        width: media.width,
        height: media.height,
      })),
    });

    const slug = await this.uniqueSlug(authorId, slugify(cleanTitle ?? cleanBody ?? 'icerik'));
    const content = await this.prisma.content.create({
      data: {
        authorId,
        slug,
        contentType: classification.contentType,
        status: input.saveAsDraft ? 'DRAFT' : 'PUBLISHED',
        title: cleanTitle,
        body: cleanBody,
        excerpt: excerpt(cleanBody),
        language: input.language,
        originalLanguage: input.originalLanguage ?? input.language,
        visibility: input.visibility,
        locationId: input.locationId ?? undefined,
        metadata: classification.metadata as Prisma.InputJsonValue,
        publishedAt: input.saveAsDraft ? null : new Date(),
        media: {
          create: input.media.map((media, index) => ({
            owner: { connect: { id: authorId } },
            mediaType: media.mediaType,
            storageKey: media.storageKey,
            publicUrl: media.publicUrl,
            thumbnailUrl: media.thumbnailUrl ?? null,
            mimeType: media.mimeType,
            width: media.width ?? null,
            height: media.height ?? null,
            duration: media.duration ?? null,
            fileSize: media.fileSize ?? null,
            processingStatus: 'PENDING',
            sortOrder: media.sortOrder ?? index,
            metadata: (media.metadata ?? {}) as Prisma.InputJsonValue,
          })),
        },
      },
      include: this.contentInclude(),
    });

    if (content.media.length) {
      await this.prisma.processingJob.createMany({
        data: content.media.map((media) => ({
          contentId: content.id,
          mediaId: media.id,
          queueName: 'media-processing',
          status: 'PENDING',
          payload: { mediaType: media.mediaType, storageKey: media.storageKey, mimeType: media.mimeType } as Prisma.InputJsonValue,
        })),
      });
    }

    await Promise.all([this.updateSearchVector(content.id), this.attachHashtags(content.id, `${cleanTitle ?? ''} ${cleanBody ?? ''}`), this.notifyFollowers(authorId, content)]);
    return presentContent(content, { liked: false, bookmarked: false, followingAuthor: false });
  }

  async getById(id: string, viewerId?: string) {
    const content = await this.prisma.content.findFirst({
      where: { id, deletedAt: null, status: { in: ['PUBLISHED', 'PROCESSING'] } },
      include: this.contentInclude(),
    });
    if (!content) throw new NotFoundException('Content not found.');
    await this.prisma.content.update({ where: { id }, data: { viewCount: { increment: 1 } } });
    return presentContent(content, await this.viewerState(viewerId, content));
  }

  async update(authorId: string, id: string, body: unknown) {
    const input = createContentSchema.partial().parse(body) as Partial<CreateContentInput>;
    const existing = await this.prisma.content.findFirst({ where: { id, deletedAt: null }, include: this.contentInclude() });
    if (!existing) throw new NotFoundException('Content not found.');
    if (existing.authorId !== authorId) throw new ForbiddenException('You can only edit your own content.');

    const cleanBody = input.body !== undefined ? (input.body ? sanitizeHtml(input.body, { allowedTags: [], allowedAttributes: {} }).trim() : null) : existing.body;
    const cleanTitle = input.title !== undefined ? (input.title ? sanitizeHtml(input.title, { allowedTags: [], allowedAttributes: {} }).trim() : null) : existing.title;
    if (!cleanTitle && !cleanBody && existing.media.length === 0) throw new BadRequestException('Text, title or media is required.');

    const classification = await this.classifier.classify({
      title: cleanTitle,
      body: cleanBody,
      language: input.originalLanguage ?? input.language ?? existing.originalLanguage,
      media: existing.media.map((media) => ({
        mediaType: media.mediaType,
        mimeType: media.mimeType,
        duration: media.duration,
        width: media.width,
        height: media.height,
      })),
    });

    const updated = await this.prisma.content.update({
      where: { id },
      data: {
        title: cleanTitle,
        body: cleanBody,
        excerpt: excerpt(cleanBody),
        language: input.language ?? existing.language,
        originalLanguage: input.originalLanguage ?? existing.originalLanguage,
        visibility: input.visibility ?? existing.visibility,
        locationId: input.locationId === undefined ? existing.locationId : input.locationId,
        contentType: classification.contentType,
        metadata: classification.metadata as Prisma.InputJsonValue,
      },
      include: this.contentInclude(),
    });
    await this.updateSearchVector(id);
    return presentContent(updated, await this.viewerState(authorId, updated));
  }

  async delete(authorId: string, id: string) {
    const existing = await this.prisma.content.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new NotFoundException('Content not found.');
    if (existing.authorId !== authorId) throw new ForbiddenException('You can only delete your own content.');
    await this.prisma.content.update({ where: { id }, data: { status: 'DELETED', deletedAt: new Date() } });
    return { ok: true };
  }

  async getByHandle(username: string, slug: string, viewerId?: string) {
    const content = await this.prisma.content.findFirst({
      where: {
        slug,
        deletedAt: null,
        status: { in: ['PUBLISHED', 'PROCESSING'] },
        author: { username: username.replace(/^@/, '').toLowerCase() },
      },
      include: this.contentInclude(),
    });
    if (!content) throw new NotFoundException('Content not found.');
    await this.prisma.content.update({ where: { id: content.id }, data: { viewCount: { increment: 1 } } });
    return presentContent(content, await this.viewerState(viewerId, content));
  }

  async listByAuthor(username: string, cursor?: string, viewerId?: string) {
    const parsed = this.parseCursor(cursor);
    const rows = await this.prisma.content.findMany({
      where: {
        status: 'PUBLISHED',
        deletedAt: null,
        author: { username: username.replace(/^@/, '').toLowerCase() },
        ...(parsed ? { publishedAt: { lt: parsed.date } } : {}),
      },
      include: this.contentInclude(),
      orderBy: [{ publishedAt: 'desc' }, { id: 'desc' }],
      take: PAGE_SIZE + 1,
    });
    const items = rows.slice(0, PAGE_SIZE);
    return {
      items: await this.presentMany(items, viewerId),
      nextCursor: rows.length > PAGE_SIZE ? this.makeCursor(items[items.length - 1]) : null,
    };
  }

  async global(cursor?: string, viewerId?: string) {
    const parsed = this.parseCursor(cursor);
    const rows = await this.prisma.content.findMany({
      where: { status: 'PUBLISHED', visibility: 'PUBLIC', deletedAt: null, ...(parsed ? { publishedAt: { lt: parsed.date } } : {}) },
      include: this.contentInclude(),
      orderBy: [{ publishedAt: 'desc' }, { id: 'desc' }],
      take: PAGE_SIZE + 1,
    });
    const items = rows.slice(0, PAGE_SIZE);
    return {
      items: await this.presentMany(items, viewerId),
      nextCursor: rows.length > PAGE_SIZE ? this.makeCursor(items[items.length - 1]) : null,
    };
  }

  async comments(contentId: string, cursor?: string) {
    const parsed = this.parseCursor(cursor);
    const comments = await this.prisma.comment.findMany({
      where: { contentId, parentId: null, deletedAt: null, ...(parsed ? { createdAt: { lt: parsed.date } } : {}) },
      include: { author: { include: { profile: true } }, replies: { include: { author: { include: { profile: true } } }, orderBy: { createdAt: 'asc' } } },
      orderBy: { createdAt: 'desc' },
      take: PAGE_SIZE + 1,
    });
    const items = comments.slice(0, PAGE_SIZE).map((comment) => this.presentComment(comment));
    return { items, nextCursor: comments.length > PAGE_SIZE ? this.makeCursor(comments[PAGE_SIZE - 1]) : null };
  }

  async presentMany(contents: any[], viewerId?: string) {
    const ids = contents.map((content) => content.id);
    const authorIds = contents.map((content) => content.authorId);
    const [likes, bookmarks, follows] = viewerId
      ? await Promise.all([
          this.prisma.like.findMany({ where: { userId: viewerId, contentId: { in: ids } } }),
          this.prisma.bookmark.findMany({ where: { userId: viewerId, contentId: { in: ids } } }),
          this.prisma.follow.findMany({ where: { followerId: viewerId, followingId: { in: authorIds } } }),
        ])
      : [[], [], []];
    const liked = new Set(likes.map((like) => like.contentId));
    const bookmarked = new Set(bookmarks.map((bookmark) => bookmark.contentId));
    const following = new Set(follows.map((follow) => follow.followingId));
    return contents.map((content) =>
      presentContent(content, {
        liked: liked.has(content.id),
        bookmarked: bookmarked.has(content.id),
        followingAuthor: following.has(content.authorId),
      }),
    );
  }

  contentInclude() {
    return {
      author: { include: { profile: true } },
      media: { orderBy: { sortOrder: 'asc' as const } },
      location: true,
    };
  }

  private async viewerState(viewerId: string | undefined, content: any) {
    if (!viewerId) return { liked: false, bookmarked: false, followingAuthor: false };
    const [like, bookmark, follow] = await Promise.all([
      this.prisma.like.findUnique({ where: { userId_contentId: { userId: viewerId, contentId: content.id } } }),
      this.prisma.bookmark.findUnique({ where: { userId_contentId: { userId: viewerId, contentId: content.id } } }),
      this.prisma.follow.findUnique({ where: { followerId_followingId: { followerId: viewerId, followingId: content.authorId } } }),
    ]);
    return { liked: Boolean(like), bookmarked: Boolean(bookmark), followingAuthor: Boolean(follow) };
  }

  private async uniqueSlug(authorId: string, base: string) {
    let candidate = base;
    let index = 2;
    while (await this.prisma.content.findUnique({ where: { authorId_slug: { authorId, slug: candidate } } })) {
      candidate = `${base}-${index}`;
      index += 1;
    }
    return candidate;
  }

  private async updateSearchVector(contentId: string) {
    await this.prisma.$executeRaw`
      UPDATE "Content"
      SET "searchVector" = to_tsvector('simple', coalesce("title", '') || ' ' || coalesce("body", '') || ' ' || coalesce("excerpt", ''))
      WHERE "id" = ${contentId}
    `;
  }

  private async attachHashtags(contentId: string, text: string) {
    const tags = Array.from(new Set((text.match(/#[\p{L}0-9_]+/gu) ?? []).map((tag) => tag.slice(1).toLowerCase()))).slice(0, 12);
    for (const name of tags) {
      const hashtag = await this.prisma.hashtag.upsert({ where: { name }, update: {}, create: { name } });
      await this.prisma.contentHashtag.upsert({
        where: { contentId_hashtagId: { contentId, hashtagId: hashtag.id } },
        update: {},
        create: { contentId, hashtagId: hashtag.id },
      });
    }
  }

  private async notifyFollowers(authorId: string, content: { id: string; slug: string; title: string | null }) {
    const followers = await this.prisma.follow.findMany({ where: { followingId: authorId }, select: { followerId: true } });
    if (!followers.length) return;
    await this.prisma.notification.createMany({
      data: followers.map((follow) => ({
        recipientId: follow.followerId,
        actorId: authorId,
        contentId: content.id,
        type: 'CONTENT_SHARE',
        title: 'Takip ettiğin kişi yeni bir içerik paylaştı',
        body: content.title,
        href: `/content/${content.id}`,
      })),
      skipDuplicates: true,
    });
  }

  private presentComment(comment: any): any {
    return {
      id: comment.id,
      body: comment.body,
      likeCount: comment.likeCount,
      createdAt: comment.createdAt.toISOString(),
      author: {
        id: comment.author.id,
        username: comment.author.username,
        displayName: comment.author.displayName,
        avatarUrl: comment.author.profile?.avatarUrl ?? null,
        isVerified: comment.author.isVerified,
      },
      replies: (comment.replies ?? []).map((reply: any) => this.presentComment(reply)),
    };
  }

  private parseCursor(cursor?: string): { date: Date; id: string } | null {
    if (!cursor) return null;
    try {
      const [iso, id] = Buffer.from(cursor, 'base64url').toString('utf8').split('|');
      return { date: new Date(iso), id };
    } catch {
      return null;
    }
  }

  private makeCursor(item: { publishedAt?: Date | null; createdAt: Date; id: string }) {
    const date = item.publishedAt ?? item.createdAt;
    return Buffer.from(`${date.toISOString()}|${item.id}`).toString('base64url');
  }
}
