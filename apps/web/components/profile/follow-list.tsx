'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';

interface FollowListItem {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  isVerified: boolean;
  followsViewer: boolean;
}

export function FollowList({ title, endpoint }: { title: string; endpoint: string }) {
  const query = useQuery({ queryKey: ['follow-list', endpoint], queryFn: () => api.get<FollowListItem[]>(endpoint) });
  const users = query.data ?? [];
  return (
    <div>
      <div className="sticky top-0 z-10 border-b border-neutral-200 bg-white/95 p-4 backdrop-blur"><h1 className="text-lg font-semibold">{title}</h1></div>
      {query.isLoading ? <p className="p-6 text-sm text-neutral-600">Yükleniyor...</p> : null}
      {query.isError ? <p className="p-6 text-sm text-neutral-600">Liste gizli veya yüklenemedi.</p> : null}
      {users.map((user) => (
        <Link key={user.id} href={`/@${user.username}`} className="focus-ring flex gap-3 border-b border-neutral-100 p-4 hover:bg-neutral-50">
          <img src={user.avatarUrl ?? `https://i.pravatar.cc/120?u=${user.username}`} alt="" className="h-12 w-12 rounded-full object-cover" />
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2">
              <span className="truncate font-semibold">{user.displayName}</span>
              {user.isVerified ? <span className="rounded-full bg-cyan-600 px-1 text-[10px] font-bold text-white">✓</span> : null}
            </span>
            <span className="block truncate text-sm text-neutral-500">@{user.username}</span>
            {user.followsViewer ? <span className="mt-1 inline-block rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-700">Seni takip ediyor</span> : null}
            {user.bio ? <span className="mt-1 block line-clamp-2 text-sm text-neutral-700">{user.bio}</span> : null}
          </span>
        </Link>
      ))}
      {!query.isLoading && !query.isError && users.length === 0 ? <p className="p-6 text-sm text-neutral-600">Liste boş.</p> : null}
    </div>
  );
}
