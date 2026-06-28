import { SearchService } from '../src/modules/search/search.service';

describe('SearchService', () => {
  it('passes timeframe, location and language filters into content and profile queries', async () => {
    const prisma = {
      content: { findMany: jest.fn().mockResolvedValue([]) },
      user: { findMany: jest.fn().mockResolvedValue([]) },
      searchQuery: { create: jest.fn().mockResolvedValue({}) },
    };
    const service = new SearchService(prisma as any);

    await service.search({ q: 'arac', timeframe: 'week', country: 'United', city: 'Austin', language: 'en' }, 'viewer');

    expect(prisma.content.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        publishedAt: { gte: expect.any(Date) },
        language: 'en',
        location: { is: { country: { contains: 'United', mode: 'insensitive' }, city: { contains: 'Austin', mode: 'insensitive' } } },
      }),
    }));
    expect(prisma.user.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        profile: { is: { country: { contains: 'United', mode: 'insensitive' }, city: { contains: 'Austin', mode: 'insensitive' }, languages: { has: 'en' } } },
      }),
    }));
    expect(prisma.searchQuery.create).toHaveBeenCalledWith({ data: expect.objectContaining({ userId: 'viewer', query: 'arac', resultCount: 0 }) });
  });
});
