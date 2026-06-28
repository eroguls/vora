'use client';

import type { FeedContent } from '@vora/types';
import { ContentRenderer } from '../feed/renderers';
import { PostShell } from '../feed/post-shell';
import { CommentsThread } from './comments-thread';
import { duration } from '../../lib/format';

export function ContentDetail({ content }: { content: FeedContent }) {
  if (content.contentType === 'LONG_VIDEO') {
    const media = content.media[0];
    return (
      <article>
        <div className="bg-black">
          <video src={media?.publicUrl} poster={media?.thumbnailUrl ?? undefined} className="aspect-video w-full" controls preload="metadata" />
        </div>
        <section className="border-b border-neutral-200 p-4">
          <h1 className="text-2xl font-semibold">{content.title}</h1>
          <p className="mt-2 text-sm text-neutral-500">{duration(media?.duration)} · {content.viewCount} görüntülenme</p>
          {content.body ? <p className="mt-4 whitespace-pre-wrap text-sm leading-6">{content.body}</p> : null}
          <div className="mt-4 rounded-md border border-neutral-200 p-3 text-sm"><h2 className="font-semibold">Transcript</h2><p className="mt-2 text-neutral-600">Transcript alanı hazır. Medya işleme tamamlandığında otomatik dolacak.</p></div>
        </section>
        <CommentsThread contentId={content.id} />
      </article>
    );
  }

  if (content.contentType === 'ARTICLE') {
    return (
      <article>
        <section className="border-b border-neutral-200 p-5">
          <p className="text-sm text-neutral-500">{content.author.displayName} · {String(content.metadata?.readingTime ?? 1)} dk okuma</p>
          <h1 className="mt-2 text-3xl font-semibold leading-tight">{content.title}</h1>
          {content.excerpt ? <p className="mt-3 text-lg leading-7 text-neutral-700">{content.excerpt}</p> : null}
          {content.media[0]?.mediaType === 'IMAGE' ? <img src={content.media[0].publicUrl} alt="Makale kapak görseli" className="mt-5 aspect-video w-full rounded-md object-cover" /> : null}
          <div className="mt-6 rounded-md border border-neutral-200 p-3 text-sm"><h2 className="font-semibold">İçindekiler</h2><p className="mt-1 text-neutral-600">Genel bakış · Günlük yaşam · Bütçe · Sonuç</p></div>
          <div className="prose prose-neutral mt-6 max-w-none whitespace-pre-wrap text-[17px] leading-8">{content.body}</div>
        </section>
        <CommentsThread contentId={content.id} />
      </article>
    );
  }

  if (content.contentType === 'SHORT_VIDEO') {
    const media = content.media[0];
    return (
      <article className="bg-neutral-950 text-white">
        <div className="mx-auto flex min-h-[calc(100vh-56px)] max-w-md items-center justify-center p-3">
          <video src={media?.publicUrl} poster={media?.thumbnailUrl ?? undefined} className="max-h-[82vh] rounded-md" controls autoPlay muted loop playsInline />
        </div>
        <section className="bg-white text-neutral-950"><PostShell content={content} /><CommentsThread contentId={content.id} /></section>
      </article>
    );
  }

  return (
    <article>
      <PostShell content={content} />
      <section className="border-b border-neutral-200 p-4">
        <ContentRenderer content={content} />
      </section>
      <CommentsThread contentId={content.id} />
    </article>
  );
}
