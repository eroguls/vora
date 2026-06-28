import Link from 'next/link';
import { Brand } from '../../components/brand';
import { RegisterForm } from '../../components/auth/auth-forms';

export const metadata = { title: 'Kayıt' };

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-white p-4 dark:bg-[#0c1014]">
      <div className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white/80 p-6 shadow-sm shadow-neutral-950/5 dark:border-white/10 dark:bg-white/5 dark:shadow-none">
        <Brand />
        <h1 className="mt-8 text-2xl font-semibold">Hesap oluştur</h1>
        <div className="mt-6"><RegisterForm /></div>
        <Link href="/" className="mt-6 block text-sm text-neutral-600 hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-white">Ana akışa dön</Link>
      </div>
    </main>
  );
}
