'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input } from '@vora/ui';
import { api } from '../lib/api';
import { useAdminAuthStore } from '../lib/auth-store';

export function AdminLogin() {
  const router = useRouter();
  const setAuth = useAdminAuthStore((state) => state.setAuth);
  const [error, setError] = React.useState<string | null>(null);
  return (
    <form className="space-y-3" onSubmit={async (event) => { event.preventDefault(); const data = new FormData(event.currentTarget); try { const result = await api.post<{ accessToken: string; user: any }>('/auth/login', { emailOrUsername: data.get('emailOrUsername'), password: data.get('password') }); if (result.user.role !== 'ADMIN') throw new Error('Admin yetkisi yok.'); setAuth(result.accessToken, result.user); router.push('/'); } catch (err) { setError((err as Error).message); } }}>
      <Input name="emailOrUsername" placeholder="admin@vora.local" defaultValue="admin@vora.local" />
      <Input name="password" type="password" placeholder="Admin123!" defaultValue="Admin123!" />
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <Button className="w-full" type="submit">Admin girişi</Button>
    </form>
  );
}
