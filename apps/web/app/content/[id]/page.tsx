import { notFound } from 'next/navigation';
import type { FeedContent } from '@vora/types';
import { AppShell } from '../../../components/layout/app-shell';
import { ContentDetail } from '../../../components/content/content-detail';
import { serverApi } from '../../../lib/api';

export default async function IdFallbackContentPage({ params }: { params: Promise<{ id: string }> }) {
  try {
    const content = await serverApi<FeedContent>(`/content/id/${(await params).id}`);
    return <AppShell><ContentDetail content={content} /></AppShell>;
  } catch {
    notFound();
  }
}
