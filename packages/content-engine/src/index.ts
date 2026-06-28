import type { ContentType, MediaType } from '@vora/types';

export interface ClassificationMediaInput {
  mediaType: MediaType;
  mimeType?: string | null;
  duration?: number | null;
  width?: number | null;
  height?: number | null;
}

export interface ClassificationInput {
  title?: string | null;
  body?: string | null;
  media: ClassificationMediaInput[];
  language?: string | null;
}

export interface ClassificationConfig {
  shortTextMaxCharacters: number;
  articleMinWords: number;
  articleMinParagraphs: number;
  shortVideoMaxSeconds: number;
  longVideoMinSeconds: number;
}

export interface ClassificationResult {
  contentType: ContentType;
  confidence: number;
  reason: string;
  metadata: {
    wordCount: number;
    readingTime: number;
    mediaOrientation?: 'vertical' | 'horizontal' | 'square' | 'unknown';
    duration?: number;
    processingStatus?: 'PENDING' | 'PROCESSING' | 'READY' | 'FAILED';
    detectedLanguage?: string;
  };
}

export interface ContentClassifier {
  classify(input: ClassificationInput): Promise<ClassificationResult> | ClassificationResult;
}

export const DEFAULT_CLASSIFICATION_CONFIG: ClassificationConfig = {
  shortTextMaxCharacters: 500,
  articleMinWords: 220,
  articleMinParagraphs: 3,
  shortVideoMaxSeconds: 180,
  longVideoMinSeconds: 180,
};

function getWordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function getParagraphCount(text: string): number {
  return text.split(/\n\s*\n/).filter((paragraph) => paragraph.trim().length > 0).length;
}

function getOrientation(media?: ClassificationMediaInput): 'vertical' | 'horizontal' | 'square' | 'unknown' {
  if (!media?.width || !media.height) return 'unknown';
  const ratio = media.width / media.height;
  if (ratio > 1.15) return 'horizontal';
  if (ratio < 0.85) return 'vertical';
  return 'square';
}

export class RuleBasedContentClassifier implements ContentClassifier {
  constructor(private readonly config: ClassificationConfig = DEFAULT_CLASSIFICATION_CONFIG) {}

  classify(input: ClassificationInput): ClassificationResult {
    const body = input.body?.trim() ?? '';
    const title = input.title?.trim() ?? '';
    const wordCount = getWordCount(`${title} ${body}`);
    const readingTime = Math.max(1, Math.ceil(wordCount / 220));
    const media = input.media ?? [];
    const images = media.filter((item) => item.mediaType === 'IMAGE');
    const videos = media.filter((item) => item.mediaType === 'VIDEO');
    const audios = media.filter((item) => item.mediaType === 'AUDIO');
    const mediaKinds = new Set(media.map((item) => item.mediaType));
    const metadataBase = {
      wordCount,
      readingTime,
      detectedLanguage: input.language ?? undefined,
      processingStatus: media.length ? 'PENDING' as const : 'READY' as const,
    };

    if (audios.length > 0 && images.length === 0 && videos.length === 0) {
      return {
        contentType: 'AUDIO',
        confidence: 0.95,
        reason: 'Audio media is present without image or video media.',
        metadata: { ...metadataBase, duration: audios[0]?.duration ?? undefined },
      };
    }

    if (mediaKinds.size > 1) {
      return {
        contentType: 'MIXED',
        confidence: 0.78,
        reason: 'Multiple media types are present.',
        metadata: metadataBase,
      };
    }

    if (videos.length > 0) {
      const primaryVideo = videos[0];
      const duration = primaryVideo.duration ?? 0;
      const orientation = getOrientation(primaryVideo);
      const isLongVideo =
        duration >= this.config.longVideoMinSeconds ||
        (Boolean(title) && duration > this.config.shortVideoMaxSeconds * 0.75 && orientation === 'horizontal');

      return {
        contentType: isLongVideo ? 'LONG_VIDEO' : 'SHORT_VIDEO',
        confidence: isLongVideo ? 0.92 : 0.88,
        reason: isLongVideo
          ? 'Video duration or horizontal titled presentation indicates a long video.'
          : 'Short duration video is suitable for inline short video playback.',
        metadata: {
          ...metadataBase,
          duration,
          mediaOrientation: orientation,
        },
      };
    }

    if (images.length > 1) {
      return {
        contentType: 'GALLERY',
        confidence: 0.94,
        reason: 'Multiple images are attached.',
        metadata: metadataBase,
      };
    }

    if (images.length === 1) {
      return {
        contentType: 'PHOTO',
        confidence: 0.93,
        reason: 'A single image is attached without video or audio.',
        metadata: { ...metadataBase, mediaOrientation: getOrientation(images[0]) },
      };
    }

    const paragraphCount = getParagraphCount(body);
    const looksStructured = /^#{1,3}\s+|\n#{1,3}\s+|\n\d+\.\s+/m.test(body);
    const articleByLength = Boolean(title) && wordCount >= this.config.articleMinWords;
    const articleByStructure = Boolean(title) && paragraphCount >= this.config.articleMinParagraphs;

    if (articleByLength || articleByStructure || looksStructured) {
      return {
        contentType: 'ARTICLE',
        confidence: 0.9,
        reason: 'Title, length and paragraph structure indicate a long-form article.',
        metadata: metadataBase,
      };
    }

    if (!title && body.length <= this.config.shortTextMaxCharacters) {
      return {
        contentType: 'SHORT_TEXT',
        confidence: 0.95,
        reason: 'Short text without media or title.',
        metadata: metadataBase,
      };
    }

    return {
      contentType: Boolean(title) ? 'ARTICLE' : 'SHORT_TEXT',
      confidence: 0.72,
      reason: 'Text-only content falls back to readable text presentation.',
      metadata: metadataBase,
    };
  }
}

export class AIContentClassifier implements ContentClassifier {
  private readonly fallback: RuleBasedContentClassifier;

  constructor(
    private readonly options: { enabled: boolean; provider?: ContentClassifier },
    config: ClassificationConfig = DEFAULT_CLASSIFICATION_CONFIG,
  ) {
    this.fallback = new RuleBasedContentClassifier(config);
  }

  async classify(input: ClassificationInput): Promise<ClassificationResult> {
    if (!this.options.enabled || !this.options.provider) {
      return this.fallback.classify(input);
    }

    try {
      return await this.options.provider.classify(input);
    } catch {
      return this.fallback.classify(input);
    }
  }
}

export interface FeedCandidate {
  id: string;
  authorId: string;
  contentType: ContentType;
  publishedAt: Date;
  language?: string | null;
  country?: string | null;
  topics?: string[];
  relationshipScore?: number;
  interestScore?: number;
  qualityScore?: number;
  engagementScore?: number;
}

export interface FeedContext {
  now?: Date;
  languages?: string[];
  interests?: string[];
  followedAuthorIds?: string[];
  preferredCountries?: string[];
}

export interface RankedFeedCandidate extends FeedCandidate {
  feedScore: number;
  scoreBreakdown: Record<string, number>;
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function freshnessScore(publishedAt: Date, now: Date): number {
  const ageHours = Math.max(0, now.getTime() - publishedAt.getTime()) / 36e5;
  if (ageHours <= 2) return 1;
  if (ageHours <= 24) return 0.85;
  if (ageHours <= 24 * 7) return 0.55;
  if (ageHours <= 24 * 30) return 0.28;
  return 0.08;
}

export function rankFeedCandidates(candidates: FeedCandidate[], context: FeedContext = {}): RankedFeedCandidate[] {
  const now = context.now ?? new Date();
  const languages = new Set(context.languages ?? []);
  const followed = new Set(context.followedAuthorIds ?? []);
  const interests = new Set((context.interests ?? []).map((interest) => interest.toLowerCase()));
  const countries = new Set(context.preferredCountries ?? []);

  const ranked = candidates.map((candidate) => {
    const relationshipScore = clampScore(candidate.relationshipScore ?? (followed.has(candidate.authorId) ? 1 : 0.25));
    const interestScore = clampScore(
      candidate.interestScore ??
        ((candidate.topics ?? []).some((topic) => interests.has(topic.toLowerCase())) ? 0.9 : 0.35),
    );
    const fresh = freshnessScore(candidate.publishedAt, now);
    const qualityScore = clampScore(candidate.qualityScore ?? candidate.engagementScore ?? 0.55);
    const globalDiscoveryScore = clampScore(countries.size === 0 || !candidate.country || !countries.has(candidate.country) ? 0.8 : 0.35);
    const languageScore = clampScore(languages.size === 0 || !candidate.language || languages.has(candidate.language) ? 0.85 : 0.35);
    const diversityScore = clampScore((globalDiscoveryScore + languageScore) / 2);

    const breakdown = {
      relationshipScore,
      interestScore,
      freshnessScore: fresh,
      qualityScore,
      globalDiscoveryScore,
      diversityScore,
    };

    const feedScore =
      relationshipScore * 0.25 +
      interestScore * 0.2 +
      fresh * 0.2 +
      qualityScore * 0.15 +
      globalDiscoveryScore * 0.1 +
      diversityScore * 0.1;

    return { ...candidate, feedScore, scoreBreakdown: breakdown };
  });

  const sorted = ranked.sort((a, b) => b.feedScore - a.feedScore);
  const result: RankedFeedCandidate[] = [];
  const deferred: RankedFeedCandidate[] = [];

  for (const candidate of sorted) {
    const previous = result[result.length - 1];
    if (previous && (previous.authorId === candidate.authorId || previous.contentType === candidate.contentType)) {
      deferred.push(candidate);
      continue;
    }
    result.push(candidate);
  }

  for (const candidate of deferred) {
    let inserted = false;
    for (let index = 1; index <= result.length; index += 1) {
      const previous = result[index - 1];
      const next = result[index];
      const isSafeAfterPrevious = !previous || (previous.authorId !== candidate.authorId && previous.contentType !== candidate.contentType);
      const isSafeBeforeNext = !next || (next.authorId !== candidate.authorId && next.contentType !== candidate.contentType);
      if (isSafeAfterPrevious && isSafeBeforeNext) {
        result.splice(index, 0, candidate);
        inserted = true;
        break;
      }
    }
    if (!inserted) result.push(candidate);
  }

  return result;
}

export interface SearchRankInput {
  textRelevance: number;
  freshness: number;
  authorContext: number;
  engagementQuality: number;
  locationRelevance: number;
  languageRelevance: number;
}

export function calculateSearchScore(input: SearchRankInput): number {
  return (
    clampScore(input.textRelevance) * 0.4 +
    clampScore(input.freshness) * 0.15 +
    clampScore(input.authorContext) * 0.15 +
    clampScore(input.engagementQuality) * 0.1 +
    clampScore(input.locationRelevance) * 0.1 +
    clampScore(input.languageRelevance) * 0.1
  );
}
