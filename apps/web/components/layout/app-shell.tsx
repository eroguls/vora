'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, Bookmark, Home, Mail, PlusCircle, Search, UserRound } from 'lucide-react';
import { Brand } from '../brand';
import { RightRail } from './right-rail';
import { useAuthStore } from '../../lib/auth-store';
import { LogoutButton } from '../auth/logout-button';
import { api } from '../../lib/api';
import { getSocket } from '../../lib/socket';

const nav = [
  { href: '/home', label: 'Ana Sayfa', icon: Home },
  { href: '/search', label: 'Ara', icon: Search },
  { href: '/create', label: 'Paylaş', icon: PlusCircle },
  { href: '/messages', label: 'Mesajlar', icon: Mail },
  { href: '/notifications', label: 'Bildirimler', icon: Bell },
  { href: '/saved', label: 'Kaydedilenler', icon: Bookmark },
];

export function AppShell({ children, rightRail = true }: { children: React.ReactNode; rightRail?: boolean }) {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const client = useQueryClient();
  const unreadMessages = useQuery({
    queryKey: ['messages', 'unread-count'],
    enabled: Boolean(user),
    queryFn: () => api.get<{ count: number }>('/messages/unread-count'),
  });
  const unreadCount = unreadMessages.data?.count ?? 0;
  React.useEffect(() => {
    if (!user?.id) return;
    const socket = getSocket();
    const refresh = () => void client.invalidateQueries({ queryKey: ['messages'] });
    socket.on('message:new', refresh);
    return () => {
      socket.off('message:new', refresh);
    };
  }, [client, user?.id]);
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_0%_0%,rgba(0,229,255,0.14),transparent_28rem),radial-gradient(circle_at_100%_0%,rgba(225,29,72,0.07),transparent_26rem),#fbfffe] text-neutral-950 dark:bg-[radial-gradient(circle_at_0%_0%,rgba(0,229,255,0.12),transparent_28rem),radial-gradient(circle_at_100%_0%,rgba(225,29,72,0.11),transparent_26rem),#0c1014] dark:text-neutral-50">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-neutral-200/80 bg-white/90 px-3 backdrop-blur md:hidden dark:border-white/10 dark:bg-[#0c1014]/90">
        <Brand />
        <Link href="/search" className="focus-ring flex min-w-0 flex-1 items-center gap-2 rounded-md border border-neutral-200 px-3 py-2 text-sm text-neutral-600 dark:border-white/10 dark:bg-white/5 dark:text-neutral-300" aria-label="Dünyada ara">
          <Search className="h-4 w-4" />
          <span className="truncate">Dünyada ara</span>
        </Link>
        <Link href="/messages" className="focus-ring relative rounded-md p-2" aria-label="Mesajlar">
          <Mail className="h-5 w-5" />
          <UnreadBadge count={unreadCount} />
        </Link>
      </header>

      <aside className="group fixed left-0 top-0 z-40 hidden h-screen w-20 overflow-hidden border-r border-neutral-200/80 bg-white/90 px-3 py-5 shadow-sm shadow-neutral-950/5 backdrop-blur-xl transition-[width] duration-300 ease-out hover:w-72 focus-within:w-72 md:flex md:flex-col dark:border-white/10 dark:bg-[#0c1014]/90 dark:shadow-none">
        <Link href="/" className="focus-ring flex h-11 items-center gap-3 rounded-2xl px-2" aria-label="Vora ana sayfa">
          <span className="vora-gradient flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-lg font-bold text-white shadow-sm shadow-cyan-900/20">V</span>
          <span className="min-w-0 whitespace-nowrap bg-gradient-to-r from-neutral-950 via-[#008cff] to-rose-700 bg-clip-text text-xl font-semibold text-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100 dark:from-white dark:via-[#00e5ff] dark:to-rose-400">Vora</span>
        </Link>
        <nav className="mt-8 flex flex-1 flex-col gap-1" aria-label="Ana menü">
          {nav.map((item) => {
            const active = pathname === item.href || (item.href === '/home' && pathname === '/');
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className={`focus-ring flex h-12 items-center gap-4 rounded-2xl px-3 text-sm font-medium transition-colors ${active ? 'vora-nav-gradient text-neutral-950 shadow-sm shadow-cyan-900/5 dark:text-white' : 'text-neutral-800 hover:bg-neutral-100/80 dark:text-neutral-200 dark:hover:bg-white/10'}`} title={item.label}>
                <span className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${active ? 'vora-gradient text-white shadow-sm shadow-cyan-900/20' : 'bg-white text-neutral-800 ring-1 ring-neutral-200 dark:bg-white/5 dark:text-neutral-200 dark:ring-white/10'}`}><Icon className="h-5 w-5" />{item.href === '/messages' ? <UnreadBadge count={unreadCount} /> : null}</span>
                <span className="whitespace-nowrap opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100">{item.label}</span>
              </Link>
            );
          })}
          <Link href={user ? `/@${user.username}` : '/login'} className="focus-ring flex h-12 items-center gap-4 rounded-2xl px-3 text-sm font-medium text-neutral-800 transition-colors hover:bg-neutral-100/80 dark:text-neutral-200 dark:hover:bg-white/10" title="Profil">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white ring-1 ring-neutral-200 dark:bg-white/5 dark:ring-white/10"><UserRound className="h-5 w-5" /></span>
            <span className="whitespace-nowrap opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100">Profil</span>
          </Link>
        </nav>
        <div className="p-2">
          <Link href={user ? `/@${user.username}` : '/login'} className="focus-ring flex items-center gap-3 rounded-xl p-1.5 text-sm hover:bg-neutral-50 dark:hover:bg-white/10">
            <span className="vora-gradient flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white">{user?.displayName?.[0] ?? 'G'}</span>
            <span className="min-w-0 whitespace-nowrap opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100">
              <span className="block truncate font-medium">{user?.displayName ?? 'Giriş yap'}</span>
              <span className="block truncate text-neutral-500 dark:text-neutral-400">{user ? `@${user.username}` : 'Hesabına bağlan'}</span>
            </span>
          </Link>
          <div className="mt-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100"><LogoutButton /></div>
        </div>
      </aside>

      <main className="mx-auto min-h-screen max-w-[1120px] md:pl-20 xl:pr-80">
        <div className="mx-auto w-full max-w-[680px] bg-white/90 pb-20 shadow-sm shadow-neutral-950/5 backdrop-blur md:pb-0 dark:bg-[#0c1014]/80 dark:shadow-none">{children}</div>
      </main>

      {rightRail ? <RightRail /> : null}

      <nav className="fixed bottom-0 left-0 right-0 z-30 grid h-16 grid-cols-5 border-t border-neutral-200 bg-white md:hidden dark:border-white/10 dark:bg-[#0c1014]" aria-label="Alt navigasyon">
        {[
          { href: '/home', label: 'Ana Sayfa', icon: Home },
          { href: '/search', label: 'Ara', icon: Search },
          { href: '/create', label: 'Paylaş', icon: PlusCircle },
          { href: '/notifications', label: 'Bildirim', icon: Bell },
          { href: user ? `/@${user.username}` : '/login', label: 'Profil', icon: UserRound },
        ].map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link key={item.label} href={item.href} className={`flex min-h-12 flex-col items-center justify-center gap-1 text-[11px] ${active ? 'text-[#008cff] dark:text-[#00e5ff]' : 'text-neutral-700 dark:text-neutral-300'}`}>
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

function UnreadBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#00a3ff] px-1 text-[11px] font-semibold leading-none text-white">{count > 99 ? '99+' : count}</span>;
}
