import { Brand } from '../../components/brand';
import { ForgotPasswordForm } from '../../components/auth/auth-forms';

export const metadata = { title: 'Şifremi Unuttum' };

export default function ForgotPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-lg border border-neutral-200 p-6">
        <Brand />
        <h1 className="mt-8 text-2xl font-semibold">Şifremi unuttum</h1>
        <div className="mt-6"><ForgotPasswordForm /></div>
      </div>
    </main>
  );
}
