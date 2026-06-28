'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Activity, BarChart3, Bell, FileText, Flag, HardDrive, ListChecks, MessageCircle, Search, Settings, Shield, TrendingUp, Users } from 'lucide-react';
import { Button } from '@vora/ui';
import { useAdminAuthStore } from '../lib/auth-store';

const nav = [
  { href: '/', label: 'Dashboard', icon: BarChart3 },
  { href: '/users', label: 'Kullanıcılar', icon: Users },
  { href: '/content', label: 'İçerikler', icon: FileText },
  { href: '/reports', label: 'Raporlar', icon: Flag },
  { href: '/moderation', label: 'Moderasyon', icon: Shield },
  { href: '/comments', label: 'Yorumlar', icon: MessageCircle },
  { href: '/media', label: 'Medya', icon: HardDrive },
  { href: '/jobs', label: 'Kuyruk', icon: ListChecks },
  { href: '/search', label: 'Arama', icon: Search },
  { href: '/trends', label: 'Trendler', icon: TrendingUp },
  { href: '/notifications', label: 'Bildirimler', icon: Bell },
  { href: '/settings', label: 'Ayarlar', icon: Settings },
  { href: '/audit-logs', label: 'Audit', icon: Bell },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { accessToken, user, hasHydrated, clearAuth } = useAdminAuthStore();

  React.useEffect(() => {
    if (hasHydrated && !accessToken) router.replace('/login');
  }, [accessToken, hasHydrated, router]);

  if (!hasHydrated) return <div className="flex min-h-screen items-center justify-center bg-neutral-50 text-sm text-neutral-600">Admin oturumu hazırlanıyor...</div>;
  if (!accessToken) return null;

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-950">
      <aside className="fixed left-0 top-0 hidden h-screen w-72 border-r border-neutral-200 bg-white p-4 md:flex md:flex-col">
        <Link href="/" className="flex items-center gap-3 rounded-2xl bg-neutral-950 px-4 py-3 text-white">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500 text-sm font-bold text-neutral-950">V</span>
          <span><span className="block text-sm font-semibold">Vora Admin</span><span className="block text-xs text-neutral-300">Operations console</span></span>
        </Link>
        <nav className="mt-6 flex-1 space-y-1 overflow-y-auto" aria-label="Admin menü">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return <Link key={item.href} href={item.href} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${active ? 'bg-cyan-50 text-cyan-700' : 'text-neutral-700 hover:bg-neutral-100'}`}><Icon className="h-4 w-4" />{item.label}</Link>;
          })}
        </nav>
        <div className="mt-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-3 text-sm">
          <div className="flex items-center gap-2 text-emerald-700"><Activity className="h-4 w-4" /><span className="font-medium">Sistem aktif</span></div>
          <p className="mt-1 text-xs text-neutral-500">API ve operasyon ekranları canlı veriye bağlı.</p>
        </div>
      </aside>
      <main className="md:pl-72">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-neutral-200 bg-white/90 p-4 backdrop-blur">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700">Admin panel</p>
            <span className="font-medium">{user?.displayName ?? 'Admin'}</span>
          </div>
          <Button variant="secondary" size="sm" onClick={() => { clearAuth(); router.push('/login'); }}>Çıkış</Button>
        </header>
        {children}
      </main>
    </div>
  );
}
