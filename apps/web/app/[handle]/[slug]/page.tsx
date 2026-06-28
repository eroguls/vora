import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { FeedContent } from '@vora/types';
import { AppShell } from '../../../components/layout/app-shell';
import { ContentDetail } from '../../../components/content/content-detail';
import { serverApi } from '../../../lib/api';
import { contentSchema } from '../../../lib/seo';

function usernameFromHandle(handle: string) {
  const decoded = decodeURIComponent(handle);
  return decoded.startsWith('@') ? decoded.slice(1) : null;
}

async function getContent(handle: string, slug: string) {
  const username = usernameFromHandle(handle);
  if (!username) return null;
  try {
    return await serverApi<FeedContent>(`/content/handle/${username}/${slug}`);
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ handle: string; slug: string }> }): Promise<Metadata> {
  const { handle, slug } = await params;
  const content = await getContent(handle, slug);
  if (!content) return { title: 'İçerik bulunamadı' };
  const title = content.title ?? content.excerpt ?? `${content.author.displayName} paylaşımı`;
  const description = content.excerpt ?? content.body?.slice(0, 160) ?? 'Vora içeriği';
  const image = content.media[0]?.thumbnailUrl ?? content.media[0]?.publicUrl;
  return {
    title,
    description,
    alternates: { canonical: `/@${content.author.username}/${content.slug}` },
    openGraph: { title, description, type: 'article', images: image ? [image] : undefined },
    twitter: { card: 'summary_large_image', title, description, images: image ? [image] : undefined },
  };
}

export default async function ContentPage({ params }: { params: Promise<{ handle: string; slug: string }> }) {
  const { handle, slug } = await params;
  const content = await getContent(handle, slug);
  if (!content) notFound();
  return (
    <AppShell rightRail={content.contentType !== 'SHORT_VIDEO'}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(contentSchema(content)) }} />
      <ContentDetail content={content} />
    </AppShell>
  );
}
