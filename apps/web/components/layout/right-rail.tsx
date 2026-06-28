'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useAuthStore } from '../../lib/auth-store';

export function RightRail() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);
  const savedAccounts = useAuthStore((state) => state.savedAccounts);
  const switchAccount = useAuthStore((state) => state.switchAccount);
  const suggestions = useQuery({ queryKey: ['user-suggestions'], queryFn: () => api.get<Array<{ id: string; username: string; displayName: string; avatarUrl: string | null; bio: string | null }>>('/users/suggestions') });
  const users = suggestions.data ?? [];
  return (
    <aside className="fixed right-0 top-0 hidden h-screen w-80 overflow-y-auto bg-white/70 px-5 py-5 backdrop-blur-xl xl:block dark:bg-[#0c1014]/70">
      <section>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold">Profillerin</h2>
          <Link href="/login" className="focus-ring rounded-full px-2 py-1 text-xs font-medium text-[#008cff] hover:bg-neutral-100 dark:text-[#00e5ff] dark:hover:bg-white/10">Profil ekle</Link>
        </div>
        <div className="mt-4 flex gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {savedAccounts.length ? savedAccounts.map((account) => {
            const active = currentUser?.id === account.user.id;
            return (
              <button key={account.user.id} type="button" className="focus-ring group w-16 shrink-0 rounded-2xl text-center" onClick={() => { switchAccount(account.user.id); queryClient.clear(); router.refresh(); }} title={`${account.user.displayName} profiline geç`}>
                <span className={`${active ? 'vora-gradient' : 'bg-neutral-200 dark:bg-white/15'} block rounded-full p-[2px]`}>
                  <img src={account.user.avatarUrl ?? `https://i.pravatar.cc/120?u=${account.user.username}`} alt="" className="h-14 w-14 rounded-full border-2 border-white object-cover dark:border-[#0c1014]" />
                </span>
                <span className={`mt-2 block truncate text-xs ${active ? 'font-semibold text-[#008cff] dark:text-[#00e5ff]' : 'text-neutral-700 group-hover:text-neutral-950 dark:text-neutral-300 dark:group-hover:text-white'}`}>{account.user.username}</span>
              </button>
            );
          }) : (
            <Link href="/login" className="focus-ring group flex items-center gap-3 rounded-2xl py-2 text-sm text-neutral-600 dark:text-neutral-300">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-dashed border-neutral-300 text-lg font-semibold dark:border-white/20">+</span>
              <span>Profil eklemek için giriş yap.</span>
            </Link>
          )}
        </div>
      </section>

      <section className="mt-7">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold">Önerilen kişiler</h2>
          <span className="text-xs text-neutral-500 dark:text-neutral-400">Sana yakın</span>
        </div>
        <div className="mt-3 space-y-3">
          {users.slice(0, 5).map((user) => (
            <Link key={user.id} href={`/@${user.username}`} className="focus-ring flex items-center gap-3 rounded-2xl px-1 py-2 hover:bg-neutral-100/70 dark:hover:bg-white/10">
              <img src={user.avatarUrl ?? `https://i.pravatar.cc/120?u=${user.username}`} alt="" className="h-11 w-11 rounded-full object-cover" />
              <span className="min-w-0 flex-1 text-sm">
                <span className="block truncate font-medium">{user.displayName}</span>
                <span className="block truncate text-neutral-500 dark:text-neutral-400">@{user.username}</span>
              </span>
              <span className="text-xs font-semibold text-[#008cff] dark:text-[#00e5ff]">Git</span>
            </Link>
          ))}
        </div>
      </section>
      <footer className="mt-8 flex flex-wrap gap-x-3 gap-y-2 text-xs text-neutral-500">
        <Link href="/terms">Şartlar</Link>
        <Link href="/privacy">Gizlilik</Link>
        <Link href="/community-guidelines">Topluluk</Link>
      </footer>
    </aside>
  );
}
