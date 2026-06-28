import { Injectable } from '@nestjs/common';
import { calculateSearchScore } from '@vora/content-engine';
import { searchSchema } from '@vora/validation';
import { PrismaService } from '../../prisma/prisma.service';
import { presentContent } from '../content/content.presenter';

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async search(params: unknown, userId?: string) {
    const input = searchSchema.parse(params);
    const since = input.timeframe === '24h' ? new Date(Date.now() - 24 * 60 * 60 * 1000) : input.timeframe === 'week' ? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) : input.timeframe === 'month' ? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) : undefined;
    const q = input.q.trim();
    const contents = await this.prisma.content.findMany({
      where: {
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
        deletedAt: null,
        ...(since ? { publishedAt: { gte: since } } : {}),
        ...(input.language ? { language: input.language } : {}),
        ...(input.country || input.city ? { location: { is: { ...(input.country ? { country: { contains: input.country, mode: 'insensitive' as const } } : {}), ...(input.city ? { city: { contains: input.city, mode: 'insensitive' as const } } : {}) } } } : {}),
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { body: { contains: q, mode: 'insensitive' } },
          { excerpt: { contains: q, mode: 'insensitive' } },
          { author: { is: { username: { contains: q, mode: 'insensitive' } } } },
          { author: { is: { displayName: { contains: q, mode: 'insensitive' } } } },
          { location: { is: { country: { contains: q, mode: 'insensitive' } } } },
          { location: { is: { city: { contains: q, mode: 'insensitive' } } } },
        ],
      },
      include: { author: { include: { profile: true } }, media: { orderBy: { sortOrder: 'asc' } }, location: true },
      orderBy: [{ publishedAt: 'desc' }],
      take: 40,
    });
    const users = await this.prisma.user.findMany({
      where: {
        status: 'ACTIVE',
        deletedAt: null,
        ...(input.country || input.city || input.language ? { profile: { is: { ...(input.country ? { country: { contains: input.country, mode: 'insensitive' as const } } : {}), ...(input.city ? { city: { contains: input.city, mode: 'insensitive' as const } } : {}), ...(input.language ? { languages: { has: input.language } } : {}) } } } : {}),
        OR: [
          { username: { contains: q, mode: 'insensitive' } },
          { displayName: { contains: q, mode: 'insensitive' } },
          { profile: { is: { bio: { contains: q, mode: 'insensitive' } } } },
          { profile: { is: { country: { contains: q, mode: 'insensitive' } } } },
          { profile: { is: { city: { contains: q, mode: 'insensitive' } } } },
        ],
      },
      include: { profile: true },
      take: 15,
    });

    const contentResults = contents.map((content) => ({
      kind: 'content' as const,
      score: this.scoreContent(content, q, input.language),
      content: presentContent(content),
    }));
    const profileResults = users.map((user) => ({
      kind: 'profile' as const,
      score: calculateSearchScore({ textRelevance: 0.75, freshness: 0.5, authorContext: user.isVerified ? 0.9 : 0.55, engagementQuality: Math.min(1, (user.profile?.followerCount ?? 0) / 100), locationRelevance: 0.6, languageRelevance: 0.7 }),
      profile: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.profile?.avatarUrl ?? null,
        bio: user.profile?.bio ?? null,
        country: user.profile?.country ?? null,
        city: user.profile?.city ?? null,
        isVerified: user.isVerified,
      },
    }));
    const items = [...contentResults, ...profileResults].sort((a, b) => b.score - a.score).slice(0, 30);
    await this.prisma.searchQuery.create({ data: { userId, query: q, filters: input, resultCount: items.length } });
    return { items, nextCursor: null };
  }

  private scoreContent(content: any, q: string, language?: string) {
    const text = `${content.title ?? ''} ${content.body ?? ''} ${content.excerpt ?? ''}`.toLowerCase();
    const textRelevance = text.includes(q.toLowerCase()) ? 1 : 0.55;
    const ageHours = content.publishedAt ? (Date.now() - content.publishedAt.getTime()) / 36e5 : 999;
    const freshness = ageHours < 24 ? 1 : ageHours < 24 * 7 ? 0.65 : 0.35;
    return calculateSearchScore({
      textRelevance,
      freshness,
      authorContext: content.author?.isVerified ? 0.9 : 0.55,
      engagementQuality: Math.min(1, (content.likeCount + content.commentCount * 2 + content.saveCount * 2) / 80),
      locationRelevance: content.location ? 0.8 : 0.4,
      languageRelevance: !language || content.language === language ? 1 : 0.35,
    });
  }
}
