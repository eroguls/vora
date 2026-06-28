import Link from 'next/link';
import { AppShell } from '../../components/layout/app-shell';
import { LogoutButton } from '../../components/auth/logout-button';
import { Bell, Languages, Lock, Shield, UserRound } from 'lucide-react';
import { ThemeSettings } from '../../components/theme/theme-settings';

export const metadata = { title: 'Ayarlar' };

export default function SettingsPage() {
  const items = [
    { href: '/settings/profile', title: 'Profil', description: 'Fotoğraf, biyografi, bağlantılar ve görünürlük.', icon: UserRound },
    { href: '/settings/account', title: 'Hesap ve güvenlik', description: 'Şifre, oturumlar ve hesap durumu.', icon: Shield },
    { href: '/settings/privacy', title: 'Gizlilik', description: 'Engellenenler, sessizler ve sosyal görünürlük.', icon: Lock },
    { href: '/settings/notifications', title: 'Bildirimler', description: 'Takip, etkileşim ve mesaj tercihleri.', icon: Bell },
    { href: '/settings/language', title: 'Dil', description: 'Arayüz ve içerik dili tercihleri.', icon: Languages },
  ];
  return (
    <AppShell rightRail={false}>
      <div className="border-b border-neutral-200 p-4 dark:border-white/10"><h1 className="text-lg font-semibold">Ayarlar</h1><p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Hesabını, gizliliğini ve deneyimini yönet.</p></div>
      <div className="grid gap-3 p-4">
        <ThemeSettings />
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className="focus-ring flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm shadow-neutral-100 hover:bg-neutral-50 dark:border-white/10 dark:bg-[#0c1014] dark:shadow-none dark:hover:bg-white/5">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700 dark:bg-[#00e5ff]/10 dark:text-[#00e5ff]"><Icon className="h-5 w-5" /></span>
              <span className="min-w-0"><span className="block font-semibold">{item.title}</span><span className="mt-1 block text-sm text-neutral-500 dark:text-neutral-400">{item.description}</span></span>
            </Link>
          );
        })}
      </div>
      <div className="border-t border-neutral-200 p-4 dark:border-white/10"><LogoutButton /></div>
    </AppShell>
  );
}
