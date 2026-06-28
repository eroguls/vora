'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { Bookmark, Flag, Heart, MessageCircle, MoreHorizontal, Pencil, Repeat2, Share2, Trash2, UserMinus, VolumeX } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { FeedContent } from '@vora/types';
import { api } from '../../lib/api';
import { useAuthStore } from '../../lib/auth-store';
import { compactNumber, relativeTime } from '../../lib/format';
import { ContentRenderer } from './renderers';

export function PostShell({ content }: { content: FeedContent }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const token = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [statusMessage, setStatusMessage] = React.useState<string | null>(null);
  const [liked, setLiked] = React.useState(Boolean(content.viewerState?.liked));
  const [bookmarked, setBookmarked] = React.useState(Boolean(content.viewerState?.bookmarked));
  const [likeCount, setLikeCount] = React.useState(content.likeCount);
  const [saveCount, setSaveCount] = React.useState(content.saveCount);
  const href = `/@${content.author.username}/${content.slug}`;
  const interaction = useMutation({
    mutationFn: async (action: 'like' | 'unlike' | 'bookmark' | 'unbookmark' | 'share') => {
      if (!token) throw new Error('login');
      if (action === 'like') return api.post(`/interactions/content/${content.id}/like`);
      if (action === 'unlike') return api.delete(`/interactions/content/${content.id}/like`);
      if (action === 'bookmark') return api.post(`/interactions/content/${content.id}/bookmark`);
      if (action === 'unbookmark') return api.delete(`/interactions/content/${content.id}/bookmark`);
      return api.post(`/interactions/content/${content.id}/share`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['feed'] }),
    onError: (error) => {
      if ((error as Error).message === 'login') router.push('/login');
      setLiked(Boolean(content.viewerState?.liked));
      setBookmarked(Boolean(content.viewerState?.bookmarked));
      setLikeCount(content.likeCount);
      setSaveCount(content.saveCount);
    },
  });

  React.useEffect(() => {
    setLiked(Boolean(content.viewerState?.liked));
    setBookmarked(Boolean(content.viewerState?.bookmarked));
    setLikeCount(content.likeCount);
    setSaveCount(content.saveCount);
  }, [content.id, content.likeCount, content.saveCount, content.viewerState?.bookmarked, content.viewerState?.liked]);

  const copyLink = async () => {
    await navigator.clipboard.writeText(`${window.location.origin}${href}`);
    if (token) interaction.mutate('share');
  };

  const requireLogin = () => {
    if (!token) {
      router.push('/login');
      return false;
    }
    return true;
  };

  const deleteContent = async () => {
    if (!requireLogin()) return;
    const confirmed = window.confirm('Bu içeriği silmek istiyor musun?');
    if (!confirmed) return;
    await api.delete(`/content/${content.id}`);
    setStatusMessage('İçerik silindi.');
    await queryClient.invalidateQueries({ queryKey: ['feed'] });
    if (window.location.pathname === href) router.push('/home');
  };

  const reportContent = async () => {
    if (!requireLogin()) return;
    await api.post('/moderation/reports', { contentId: content.id, reason: 'OTHER', details: 'User reported from content menu' });
    setStatusMessage('Rapor gönderildi.');
  };

  const blockAuthor = async () => {
    if (!requireLogin()) return;
    await api.post(`/social/block/${content.author.id}`);
    setStatusMessage('Kullanıcı engellendi.');
    await queryClient.invalidateQueries({ queryKey: ['feed'] });
  };

  const muteAuthor = async () => {
    if (!requireLogin()) return;
    await api.post(`/social/mute/${content.author.id}`);
    setStatusMessage('Kullanıcı sessize alındı.');
    await queryClient.invalidateQueries({ queryKey: ['feed'] });
  };

  return (
    <article className="mx-3 my-4 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm shadow-neutral-100 transition-shadow hover:shadow-md hover:shadow-neutral-100 sm:mx-4 sm:p-5 dark:border-white/10 dark:bg-[#0c1014] dark:shadow-none dark:hover:shadow-none">
      <div className="flex gap-3">
        <Link href={`/@${content.author.username}`} className="focus-ring h-10 w-10 shrink-0 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
          <img src={content.author.avatarUrl ?? `https://i.pravatar.cc/120?u=${content.author.username}`} alt={`${content.author.displayName} profil fotoğrafı`} className="h-full w-full object-cover" />
        </Link>
        <div className="min-w-0 flex-1">
          <header className="flex items-start justify-between gap-2">
            <Link href={`/@${content.author.username}`} className="focus-ring min-w-0 rounded-sm">
              <span className="flex items-center gap-1 truncate text-sm font-semibold">
                {content.author.displayName}
                {content.author.isVerified ? <span className="rounded-full bg-cyan-600 px-1 text-[10px] font-bold text-white" aria-label="Doğrulanmış">✓</span> : null}
              </span>
              <span className="block truncate text-sm text-neutral-500 dark:text-neutral-400">@{content.author.username} · {relativeTime(content.publishedAt)}</span>
            </Link>
            <div className="relative">
              <button className="focus-ring rounded-md p-1 text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-white/10" aria-label="İçerik menüsü" title="İçerik menüsü" onClick={() => setMenuOpen((value) => !value)}>
                <MoreHorizontal className="h-5 w-5" />
              </button>
              {menuOpen ? (
                <div className="absolute right-0 top-8 z-20 w-52 overflow-hidden rounded-md border border-neutral-200 bg-white text-sm shadow-sm dark:border-white/10 dark:bg-neutral-900 dark:shadow-xl dark:shadow-black/30">
                  {user?.id === content.author.id ? (
                    <>
                      <Link href={`/content/${content.id}/edit`} className="flex items-center gap-2 px-3 py-2 hover:bg-neutral-50 dark:hover:bg-white/10" onClick={() => setMenuOpen(false)}>
                        <Pencil className="h-4 w-4" /> İçeriği düzenle
                      </Link>
                      <button className="flex w-full items-center gap-2 px-3 py-2 text-left text-red-700 hover:bg-red-50" onClick={() => void deleteContent()}>
                        <Trash2 className="h-4 w-4" /> İçeriği sil
                      </button>
                    </>
                  ) : (
                    <>
                      <button className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-neutral-50 dark:hover:bg-white/10" onClick={() => void reportContent()}>
                        <Flag className="h-4 w-4" /> İçeriği raporla
                      </button>
                      <button className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-neutral-50 dark:hover:bg-white/10" onClick={() => void muteAuthor()}>
                        <VolumeX className="h-4 w-4" /> Kullanıcıyı sessize al
                      </button>
                      <button className="flex w-full items-center gap-2 px-3 py-2 text-left text-red-700 hover:bg-red-50" onClick={() => void blockAuthor()}>
                        <UserMinus className="h-4 w-4" /> Kullanıcıyı engelle
                      </button>
                    </>
                  )}
                </div>
              ) : null}
            </div>
          </header>
          {statusMessage ? <p className="mt-2 rounded-md bg-cyan-50 px-3 py-2 text-sm text-cyan-800">{statusMessage}</p> : null}

          <Link href={href} className="focus-ring mt-2 block rounded-sm">
            <ContentRenderer content={content} />
          </Link>

          <footer className="mt-4 flex items-center justify-between rounded-2xl bg-neutral-50 px-2 py-1 text-neutral-600 dark:bg-white/5 dark:text-neutral-300" aria-label="Etkileşimler">
            <button className="focus-ring inline-flex items-center gap-1 rounded-xl p-2 text-sm hover:bg-red-50 hover:text-red-600" onClick={() => { const next = !liked; setLiked(next); setLikeCount((value) => Math.max(0, value + (next ? 1 : -1))); interaction.mutate(next ? 'like' : 'unlike'); }} aria-label={liked ? 'Beğeniyi kaldır' : 'Beğen'}>
              <Heart className={`h-5 w-5 ${liked ? 'fill-red-600 text-red-600' : ''}`} />
              {compactNumber(likeCount)}
            </button>
            <Link href={`${href}#comments`} className="focus-ring inline-flex items-center gap-1 rounded-xl p-2 text-sm hover:bg-white dark:hover:bg-white/10" aria-label="Yorumlar">
              <MessageCircle className="h-5 w-5" />
              {compactNumber(content.commentCount)}
            </Link>
            <button className="focus-ring inline-flex items-center gap-1 rounded-xl p-2 text-sm hover:bg-white dark:hover:bg-white/10" onClick={() => interaction.mutate('share')} aria-label="Paylaş">
              <Repeat2 className="h-5 w-5" />
              {compactNumber(content.shareCount)}
            </button>
            <button className="focus-ring inline-flex items-center gap-1 rounded-xl p-2 text-sm hover:bg-white dark:hover:bg-white/10" onClick={copyLink} aria-label="Bağlantıyı kopyala" title="Bağlantıyı kopyala">
              <Share2 className="h-5 w-5" />
            </button>
            <button className="focus-ring inline-flex items-center gap-1 rounded-xl p-2 text-sm hover:bg-cyan-50 hover:text-cyan-700" onClick={() => { const next = !bookmarked; setBookmarked(next); setSaveCount((value) => Math.max(0, value + (next ? 1 : -1))); interaction.mutate(next ? 'bookmark' : 'unbookmark'); }} aria-label={bookmarked ? 'Kaydı kaldır' : 'Kaydet'}>
              <Bookmark className={`h-5 w-5 ${bookmarked ? 'fill-cyan-700 text-cyan-700' : ''}`} />
              {compactNumber(saveCount)}
            </button>
          </footer>
        </div>
      </div>
    </article>
  );
}
