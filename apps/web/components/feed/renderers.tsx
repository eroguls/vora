'use client';

import * as React from 'react';
import { Play } from 'lucide-react';
import type { FeedContent, MediaItem } from '@vora/types';
import { duration } from '../../lib/format';

export function ContentRenderer({ content }: { content: FeedContent }) {
  switch (content.contentType) {
    case 'SHORT_TEXT':
      return <ShortTextRenderer content={content} />;
    case 'PHOTO':
      return <PhotoRenderer content={content} />;
    case 'GALLERY':
      return <GalleryRenderer content={content} />;
    case 'SHORT_VIDEO':
      return <ShortVideoRenderer media={content.media[0]} body={content.body} />;
    case 'LONG_VIDEO':
      return <LongVideoRenderer content={content} />;
    case 'ARTICLE':
      return <ArticleRenderer content={content} />;
    case 'AUDIO':
      return <AudioRenderer content={content} />;
    default:
      return <MixedContentRenderer content={content} />;
  }
}

function ShortTextRenderer({ content }: { content: FeedContent }) {
  const body = content.body ?? '';
  return <p className="whitespace-pre-wrap text-[17px] leading-7 text-neutral-950">{body.length > 420 ? `${body.slice(0, 420).trim()}... Devamını oku` : body}</p>;
}

function PhotoRenderer({ content }: { content: FeedContent }) {
  const media = content.media[0];
  return (
    <div className="space-y-2">
      {media ? <img src={media.publicUrl} alt={content.title ?? content.excerpt ?? 'Paylaşılan fotoğraf'} className="max-h-[640px] w-full rounded-md border border-neutral-200 object-cover" loading="lazy" /> : null}
      {content.body ? <p className="whitespace-pre-wrap text-sm leading-6">{content.body}</p> : null}
    </div>
  );
}

function GalleryRenderer({ content }: { content: FeedContent }) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-1 overflow-hidden rounded-md border border-neutral-200 sm:grid-cols-3">
        {content.media.slice(0, 6).map((media) => (
          <img key={media.id} src={media.publicUrl} alt={content.title ?? 'Galeri görseli'} className="aspect-square w-full object-cover" loading="lazy" />
        ))}
      </div>
      {content.body ? <p className="whitespace-pre-wrap text-sm leading-6">{content.body}</p> : null}
    </div>
  );
}

function ShortVideoRenderer({ media, body }: { media?: MediaItem; body: string | null }) {
  const ref = React.useRef<HTMLVideoElement | null>(null);
  React.useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) node.play().catch(() => null);
        else node.pause();
      },
      { threshold: 0.55 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  if (!media) return null;
  return (
    <div className="space-y-2">
      <video ref={ref} src={media.publicUrl} poster={media.thumbnailUrl ?? undefined} className="mx-auto max-h-[620px] w-full rounded-md border border-neutral-200 bg-black object-contain sm:w-auto" muted loop playsInline preload="metadata" />
      {body ? <p className="text-sm leading-6">{body}</p> : null}
    </div>
  );
}

function LongVideoRenderer({ content }: { content: FeedContent }) {
  const media = content.media[0];
  return (
    <div className="space-y-2">
      <div className="relative aspect-video overflow-hidden rounded-md border border-neutral-200 bg-neutral-900">
        {media?.thumbnailUrl || media?.publicUrl ? <img src={media.thumbnailUrl ?? media.publicUrl} alt={content.title ?? 'Video küçük resmi'} className="h-full w-full object-cover opacity-90" loading="lazy" /> : null}
        <span className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-neutral-950">
          <Play className="h-7 w-7 fill-current" />
        </span>
        <span className="absolute bottom-2 right-2 rounded bg-black px-2 py-1 text-xs font-medium text-white">{duration(media?.duration)}</span>
      </div>
      <div>
        <h3 className="text-base font-semibold">{content.title}</h3>
        {content.excerpt ? <p className="mt-1 text-sm leading-6 text-neutral-700">{content.excerpt}</p> : null}
      </div>
    </div>
  );
}

function ArticleRenderer({ content }: { content: FeedContent }) {
  const cover = content.media.find((media) => media.mediaType === 'IMAGE');
  return (
    <div className="space-y-3">
      {cover ? <img src={cover.publicUrl} alt={content.title ?? 'Makale kapak görseli'} className="aspect-[16/9] w-full rounded-md border border-neutral-200 object-cover" loading="lazy" /> : null}
      <div>
        <h3 className="text-xl font-semibold leading-tight">{content.title}</h3>
        {content.excerpt ? <p className="mt-2 text-sm leading-6 text-neutral-700">{content.excerpt}</p> : null}
        <p className="mt-2 text-xs text-neutral-500">{String(content.metadata?.readingTime ?? 1)} dk okuma</p>
      </div>
    </div>
  );
}

function AudioRenderer({ content }: { content: FeedContent }) {
  const media = content.media[0];
  return (
    <div className="rounded-md border border-neutral-200 p-3">
      <div className="flex gap-3">
        {media?.thumbnailUrl ? <img src={media.thumbnailUrl} alt="Ses kapağı" className="h-16 w-16 rounded-md object-cover" /> : <div className="h-16 w-16 rounded-md bg-cyan-50" />}
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold">{content.title ?? 'Ses kaydı'}</h3>
          {content.body ? <p className="truncate text-sm text-neutral-600">{content.body}</p> : null}
          {media ? <audio className="mt-2 w-full" src={media.publicUrl} controls preload="none" /> : null}
        </div>
      </div>
    </div>
  );
}

function MixedContentRenderer({ content }: { content: FeedContent }) {
  return (
    <div className="space-y-3">
      {content.title ? <h3 className="text-lg font-semibold">{content.title}</h3> : null}
      {content.body ? <p className="whitespace-pre-wrap text-sm leading-6">{content.excerpt ?? content.body}</p> : null}
      <div className="grid grid-cols-2 gap-1 overflow-hidden rounded-md border border-neutral-200">
        {content.media.slice(0, 4).map((media) =>
          media.mediaType === 'IMAGE' ? <img key={media.id} src={media.publicUrl} alt="Karma içerik medyası" className="aspect-square w-full object-cover" loading="lazy" /> : <video key={media.id} src={media.publicUrl} poster={media.thumbnailUrl ?? undefined} className="aspect-square w-full bg-black object-cover" muted playsInline preload="metadata" />,
        )}
      </div>
    </div>
  );
}
