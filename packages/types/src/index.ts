export const CONTENT_TYPES = [
  'SHORT_TEXT',
  'PHOTO',
  'GALLERY',
  'SHORT_VIDEO',
  'LONG_VIDEO',
  'ARTICLE',
  'AUDIO',
  'MIXED',
] as const;

export type ContentType = (typeof CONTENT_TYPES)[number];

export const MEDIA_TYPES = ['IMAGE', 'VIDEO', 'AUDIO', 'DOCUMENT'] as const;
export type MediaType = (typeof MEDIA_TYPES)[number];

export const VISIBILITIES = ['PUBLIC', 'FOLLOWERS', 'PRIVATE', 'UNLISTED'] as const;
export type Visibility = (typeof VISIBILITIES)[number];

export const CONTENT_STATUSES = [
  'DRAFT',
  'PROCESSING',
  'PUBLISHED',
  'HIDDEN',
  'DELETED',
] as const;
export type ContentStatus = (typeof CONTENT_STATUSES)[number];

export type ProcessingStatus = 'PENDING' | 'PROCESSING' | 'READY' | 'FAILED';

export interface ApiEnvelope<T> {
  data: T | null;
  meta: Record<string, unknown>;
  error: null | {
    code: string;
    message: string;
    fields?: Record<string, string[]>;
  };
}

export interface PublicProfile {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  coverUrl: string | null;
  bio: string | null;
  about: string | null;
  country: string | null;
  city: string | null;
  profession: string | null;
  isVerified: boolean;
  followerCount: number;
  followingCount: number;
  links: Array<{ label: string; url: string }>;
  languages: string[];
  isIndexable: boolean;
  contactVisibility: 'PUBLIC' | 'PRIVATE';
}

export interface MediaItem {
  id: string;
  mediaType: MediaType;
  publicUrl: string;
  thumbnailUrl: string | null;
  mimeType: string;
  width: number | null;
  height: number | null;
  duration: number | null;
  fileSize: number | null;
  processingStatus: ProcessingStatus;
  sortOrder: number;
  metadata?: Record<string, unknown> | null;
}

export interface FeedAuthor {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  isVerified: boolean;
  country?: string | null;
  city?: string | null;
}

export interface FeedContent {
  id: string;
  slug: string;
  contentType: ContentType;
  status: ContentStatus;
  title: string | null;
  body: string | null;
  excerpt: string | null;
  language: string;
  originalLanguage: string;
  visibility: Visibility;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  metadata: Record<string, unknown> | null;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  saveCount: number;
  author: FeedAuthor;
  media: MediaItem[];
  viewerState?: {
    liked: boolean;
    bookmarked: boolean;
    followingAuthor: boolean;
  };
}

export interface CursorPage<T> {
  items: T[];
  nextCursor: string | null;
}

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string | null;
  readAt: string | null;
  createdAt: string;
  href: string | null;
}
