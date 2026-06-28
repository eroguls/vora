import { describe, expect, it } from 'vitest';
import { calculateSearchScore, rankFeedCandidates } from '../src';

describe('feed ranking', () => {
  it('scores followed and fresh content higher while diversifying adjacent items', () => {
    const now = new Date('2026-06-25T12:00:00Z');
    const ranked = rankFeedCandidates(
      [
        { id: 'a', authorId: 'u1', contentType: 'PHOTO', publishedAt: new Date('2026-06-25T11:30:00Z') },
        { id: 'b', authorId: 'u1', contentType: 'PHOTO', publishedAt: new Date('2026-06-25T11:20:00Z') },
        { id: 'c', authorId: 'u2', contentType: 'ARTICLE', publishedAt: new Date('2026-06-25T11:00:00Z') },
      ],
      { now, followedAuthorIds: ['u1'] },
    );

    expect(ranked[0]?.id).toBe('a');
    expect(ranked[1]?.authorId).not.toBe(ranked[0]?.authorId);
    expect(ranked[1]?.contentType).not.toBe(ranked[0]?.contentType);
  });

  it('uses documented search ranking weights', () => {
    const score = calculateSearchScore({
      textRelevance: 1,
      freshness: 0.5,
      authorContext: 0.5,
      engagementQuality: 0.5,
      locationRelevance: 0.5,
      languageRelevance: 0.5,
    });
    expect(score).toBeCloseTo(0.7);
  });
});
