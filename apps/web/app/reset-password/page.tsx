import { Brand } from '../../components/brand';
import { ResetPasswordForm } from '../../components/auth/auth-forms';

export const metadata = { title: 'Şifre Sıfırla' };

export default function ResetPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-lg border border-neutral-200 p-6">
        <Brand />
        <h1 className="mt-8 text-2xl font-semibold">Yeni şifre belirle</h1>
        <div className="mt-6"><ResetPasswordForm /></div>
      </div>
    </main>
  );
}
