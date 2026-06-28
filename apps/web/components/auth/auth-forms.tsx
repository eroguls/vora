'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Input } from '@vora/ui';
import { api } from '../../lib/api';
import { useAuthStore } from '../../lib/auth-store';

export function LoginForm() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  return (
    <form
      className="space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        setLoading(true);
        setError(null);
        const data = new FormData(event.currentTarget);
        try {
          const result = await api.post<{ accessToken: string; user: any }>('/auth/login', { emailOrUsername: data.get('emailOrUsername'), password: data.get('password') });
          setAuth(result.accessToken, result.user);
          router.push('/home');
        } catch (err) {
          setError((err as Error).message);
        } finally {
          setLoading(false);
        }
      }}
    >
      <Input name="emailOrUsername" placeholder="E-posta veya kullanıcı adı" autoComplete="username" required />
      <Input name="password" type="password" placeholder="Şifre" autoComplete="current-password" required />
      {error ? <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Giriş yapılıyor' : 'Giriş yap'}</Button>
      <div className="flex justify-between text-sm text-neutral-600">
        <Link href="/forgot-password">Şifremi unuttum</Link>
        <Link href="/register">Hesap oluştur</Link>
      </div>
    </form>
  );
}

export function RegisterForm() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  return (
    <form
      className="space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        setLoading(true);
        setError(null);
        const data = new FormData(event.currentTarget);
        try {
          const result = await api.post<{ accessToken: string; user: any }>('/auth/register', {
            email: data.get('email'),
            username: data.get('username'),
            displayName: data.get('displayName'),
            password: data.get('password'),
          });
          setAuth(result.accessToken, result.user);
          router.push('/settings/profile');
        } catch (err) {
          setError((err as Error).message);
        } finally {
          setLoading(false);
        }
      }}
    >
      <Input name="displayName" placeholder="Görünen ad" autoComplete="name" required />
      <Input name="username" placeholder="Kullanıcı adı" autoComplete="username" required />
      <Input name="email" type="email" placeholder="E-posta" autoComplete="email" required />
      <Input name="password" type="password" placeholder="Şifre" autoComplete="new-password" required minLength={8} />
      {error ? <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Hesap oluşturuluyor' : 'Hesap oluştur'}</Button>
      <p className="text-center text-sm text-neutral-600">
        Zaten hesabın var mı? <Link href="/login" className="font-medium text-cyan-700">Giriş yap</Link>
      </p>
    </form>
  );
}

export function ForgotPasswordForm() {
  const [result, setResult] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  return (
    <form
      className="space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        setError(null);
        try {
          const response = await api.post<{ ok: boolean; resetToken?: string }>('/auth/forgot-password', { email: data.get('email') });
          setResult(response.resetToken ? `Geliştirme reset tokenı: ${response.resetToken}` : 'E-posta gönderildiyse sıfırlama bağlantısı ulaştırıldı.');
        } catch (err) {
          setError((err as Error).message);
        }
      }}
    >
      <Input name="email" type="email" placeholder="E-posta" required />
      {result ? <p className="rounded-md border border-cyan-200 bg-cyan-50 p-3 text-sm text-cyan-800">{result}</p> : null}
      {error ? <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      <Button className="w-full" type="submit">Sıfırlama bağlantısı iste</Button>
    </form>
  );
}

export function ResetPasswordForm() {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  return (
    <form
      className="space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        setError(null);
        try {
          await api.post('/auth/reset-password', { token: data.get('token'), password: data.get('password') });
          router.push('/login');
        } catch (err) {
          setError((err as Error).message);
        }
      }}
    >
      <Input name="token" placeholder="Reset token" required />
      <Input name="password" type="password" placeholder="Yeni şifre" required minLength={8} />
      {error ? <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      <Button className="w-full" type="submit">Şifreyi güncelle</Button>
    </form>
  );
}
