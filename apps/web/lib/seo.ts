import type { FeedContent, PublicProfile } from '@vora/types';

export function personSchema(profile: PublicProfile) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: profile.displayName,
    alternateName: `@${profile.username}`,
    description: profile.bio ?? undefined,
    image: profile.avatarUrl ?? undefined,
    address: [profile.city, profile.country].filter(Boolean).join(', ') || undefined,
    url: `/@${profile.username}`,
  };
}

export function contentSchema(content: FeedContent) {
  const base = {
    '@context': 'https://schema.org',
    headline: content.title ?? content.excerpt ?? content.body?.slice(0, 80),
    description: content.excerpt ?? content.body ?? undefined,
    author: { '@type': 'Person', name: content.author.displayName, url: `/@${content.author.username}` },
    datePublished: content.publishedAt ?? content.createdAt,
    inLanguage: content.originalLanguage,
  };
  if (content.contentType === 'ARTICLE') return { ...base, '@type': 'Article' };
  if (content.contentType === 'LONG_VIDEO' || content.contentType === 'SHORT_VIDEO') return { ...base, '@type': 'VideoObject', thumbnailUrl: content.media[0]?.thumbnailUrl ?? content.media[0]?.publicUrl, contentUrl: content.media[0]?.publicUrl };
  if (content.contentType === 'PHOTO' || content.contentType === 'GALLERY') return { ...base, '@type': 'ImageObject', contentUrl: content.media[0]?.publicUrl };
  if (content.contentType === 'AUDIO') return { ...base, '@type': 'AudioObject', contentUrl: content.media[0]?.publicUrl };
  return { ...base, '@type': 'DiscussionForumPosting' };
}
