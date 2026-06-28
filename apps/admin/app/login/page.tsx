import { AdminLogin } from '../../components/admin-login';

export default function LoginPage() {
  return <main className="flex min-h-screen items-center justify-center p-4"><div className="w-full max-w-sm rounded-lg border border-neutral-200 p-6"><h1 className="text-2xl font-semibold">Vora Admin</h1><p className="mt-2 text-sm text-neutral-600">Demo admin: admin@vora.local / Admin123!</p><div className="mt-6"><AdminLogin /></div></div></main>;
}
