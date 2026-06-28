'use client';

import * as React from 'react';
import Link from 'next/link';
import { MoreHorizontal } from 'lucide-react';
import { useAuthStore } from '../../lib/auth-store';
import { api } from '../../lib/api';
import { FollowButton } from './follow-button';

export function ProfileActions({ userId, username, initialFollowing }: { userId: string; username: string; initialFollowing?: boolean }) {
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.accessToken);
  const [open, setOpen] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);

  if (user?.username === username) {
    return (
      <Link
        href="/settings/profile"
        className="focus-ring inline-flex h-10 items-center justify-center rounded-md border border-neutral-300 bg-white px-4 text-sm font-medium text-neutral-950 transition-colors hover:bg-neutral-50 dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
      >
        Profili düzenle
      </Link>
    );
  }

  const guarded = async (action: () => Promise<void>) => {
    if (!token) {
      window.location.href = '/login';
      return;
    }
    try {
      await action();
    } catch (error) {
      setMessage((error as Error).message || 'İşlem tamamlanamadı.');
    }
  };

  return (
    <div className="flex items-center gap-2">
      <FollowButton userId={userId} initialFollowing={initialFollowing} />
      <button
        className="focus-ring h-10 rounded-md border border-neutral-300 px-3 text-sm font-medium hover:bg-neutral-50 dark:border-white/15 dark:hover:bg-white/10"
        onClick={() =>
          void guarded(async () => {
            const conversation = await api.post<{ id: string }>(`/messages/start/${userId}`);
            window.location.href = `/messages/${conversation.id}`;
          })
        }
      >
        Mesaj
      </button>
      <div className="relative">
        <button className="focus-ring flex h-10 w-10 items-center justify-center rounded-md border border-neutral-300 hover:bg-neutral-50 dark:border-white/15 dark:hover:bg-white/10" aria-label="Profil menüsü" onClick={() => setOpen((value) => !value)}>
          <MoreHorizontal className="h-5 w-5" />
        </button>
        {open ? (
          <div className="absolute right-0 top-11 z-20 w-52 overflow-hidden rounded-md border border-neutral-200 bg-white text-sm shadow-sm dark:border-white/10 dark:bg-neutral-900 dark:shadow-xl dark:shadow-black/30">
            <button className="block w-full px-3 py-2 text-left hover:bg-neutral-50 dark:hover:bg-white/10" onClick={() => void guarded(async () => { await api.post('/moderation/reports', { reportedUserId: userId, reason: 'OTHER', details: 'User reported from profile' }); setMessage('Rapor gönderildi.'); })}>Profili raporla</button>
            <button className="block w-full px-3 py-2 text-left hover:bg-neutral-50 dark:hover:bg-white/10" onClick={() => void guarded(async () => { await api.post(`/social/mute/${userId}`); setMessage('Kullanıcı sessize alındı.'); })}>Sessize al</button>
            <button className="block w-full px-3 py-2 text-left text-red-700 hover:bg-red-50" onClick={() => void guarded(async () => { await api.post(`/social/block/${userId}`); setMessage('Kullanıcı engellendi.'); })}>Engelle</button>
          </div>
        ) : null}
      </div>
      {message ? <span className="text-sm text-cyan-700">{message}</span> : null}
    </div>
  );
}
