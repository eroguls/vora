import { Injectable } from '@nestjs/common';
import { rankFeedCandidates } from '@vora/content-engine';
import { PrismaService } from '../../prisma/prisma.service';
import { ContentService } from '../content/content.service';

@Injectable()
export class FeedService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly content: ContentService,
  ) {}

  async global(cursor?: string, viewerId?: string) {
    const page = await this.content.global(cursor, viewerId);
    const ranked = rankFeedCandidates(
      page.items.map((item) => ({
        id: item.id,
        authorId: item.author.id,
        contentType: item.contentType,
        publishedAt: item.publishedAt ? new Date(item.publishedAt) : new Date(item.createdAt),
        language: item.language,
        country: item.author.country,
        relationshipScore: item.viewerState?.followingAuthor ? 1 : 0.35,
        qualityScore: Math.min(1, (item.likeCount + item.commentCount * 2 + item.saveCount * 2 + 5) / 80),
      })),
      { followedAuthorIds: page.items.filter((item) => item.viewerState?.followingAuthor).map((item) => item.author.id), languages: ['tr', 'en'] },
    );
    const order = new Map(ranked.map((candidate, index) => [candidate.id, index]));
    const items = page.items.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));

    if (viewerId) {
      await this.prisma.feedImpression.createMany({
        data: ranked.slice(0, 10).map((candidate, index) => ({ userId: viewerId, contentId: candidate.id, position: index, score: candidate.feedScore })),
      });
    }

    return { items, nextCursor: page.nextCursor };
  }
}
