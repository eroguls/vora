'use client';

import * as React from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import type { CursorPage, FeedContent } from '@vora/types';
import { Button } from '@vora/ui';
import { api } from '../../lib/api';
import { FeedSkeleton } from '../skeleton';
import { PostShell } from './post-shell';

export function FeedList({ endpoint = '/feed', empty = 'Henüz içerik yok.' }: { endpoint?: string; empty?: string }) {
  const loadMoreRef = React.useRef<HTMLDivElement | null>(null);
  const query = useInfiniteQuery({
    queryKey: ['feed', endpoint],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) => api.get<CursorPage<FeedContent>>(`${endpoint}${pageParam ? `${endpoint.includes('?') ? '&' : '?'}cursor=${pageParam}` : ''}`),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });

  React.useEffect(() => {
    const target = loadMoreRef.current;
    if (!target || !query.hasNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting) && !query.isFetchingNextPage) void query.fetchNextPage();
      },
      { rootMargin: '640px 0px' },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [query.hasNextPage, query.isFetchingNextPage, query.fetchNextPage]);

  if (query.isLoading) {
    return (
      <div>
        <FeedSkeleton />
        <FeedSkeleton />
      </div>
    );
  }

  if (query.isError) {
    return (
      <div className="border-b border-neutral-200 p-6 text-sm">
        <p className="font-medium">Akış yüklenemedi.</p>
        <Button className="mt-3" variant="secondary" onClick={() => query.refetch()}>
          Tekrar dene
        </Button>
      </div>
    );
  }

  const items = query.data?.pages.flatMap((page) => page.items) ?? [];
  if (!items.length) return <div className="border-b border-neutral-200 p-6 text-sm text-neutral-600">{empty}</div>;

  return (
    <div>
      {items.map((content) => (
        <PostShell key={content.id} content={content} />
      ))}
      <div ref={loadMoreRef} className="p-4">
        {query.hasNextPage ? (
          <p className="text-center text-sm text-neutral-500 dark:text-neutral-400">{query.isFetchingNextPage ? 'Yükleniyor...' : 'Akış otomatik yükleniyor.'}</p>
        ) : (
          <p className="text-center text-sm text-neutral-500 dark:text-neutral-400">Güncel akışın sonuna geldin.</p>
        )}
      </div>
    </div>
  );
}
