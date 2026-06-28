import Link from 'next/link';
import { Brand } from '../../components/brand';
import { LoginForm } from '../../components/auth/auth-forms';

export const metadata = { title: 'Giriş' };

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-white p-4 dark:bg-[#0c1014]">
      <div className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white/80 p-6 shadow-sm shadow-neutral-950/5 dark:border-white/10 dark:bg-white/5 dark:shadow-none">
        <Brand />
        <h1 className="mt-8 text-2xl font-semibold">Giriş yap</h1>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">Demo: demo@vora.local / Password123!</p>
        <div className="mt-6"><LoginForm /></div>
        <Link href="/" className="mt-6 block text-sm text-neutral-600 hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-white">Ana akışa dön</Link>
      </div>
    </main>
  );
}
