'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button, Input } from '@vora/ui';
import { AppShell } from '../../../components/layout/app-shell';
import { api } from '../../../lib/api';
import { useAuthStore } from '../../../lib/auth-store';

interface SessionItem {
  id: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  expiresAt: string;
}

export default function AccountSettingsPage() {
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const sessions = useQuery({ queryKey: ['auth-sessions'], queryFn: () => api.get<SessionItem[]>('/auth/sessions') });
  const [passwordMessage, setPasswordMessage] = React.useState<string | null>(null);
  const [dangerMessage, setDangerMessage] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  return (
    <AppShell rightRail={false}>
      <div className="border-b border-neutral-200 p-4">
        <h1 className="text-lg font-semibold">Hesap ve güvenlik</h1>
        <p className="mt-1 text-sm text-neutral-500">E-posta, şifre ve aktif oturumlarını buradan yönet.</p>
      </div>
      <div className="space-y-4 p-4">
        <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm shadow-neutral-100">
          <h2 className="font-semibold">Hesap bilgileri</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <ReadOnlyField label="E-posta" value={user?.email ?? '-'} />
            <ReadOnlyField label="Kullanıcı adı" value={user ? `@${user.username}` : '-'} />
            <ReadOnlyField label="Görünen ad" value={user?.displayName ?? '-'} />
            <ReadOnlyField label="Rol" value={user?.role ?? '-'} />
          </div>
        </section>

        <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm shadow-neutral-100">
          <h2 className="font-semibold">Şifre değiştir</h2>
          <form
            className="mt-4 space-y-3"
            onSubmit={async (event) => {
              event.preventDefault();
              setLoading(true);
              setPasswordMessage(null);
              const data = new FormData(event.currentTarget);
              try {
                await api.patch('/auth/password', { currentPassword: data.get('currentPassword'), newPassword: data.get('newPassword') });
                clearAuth();
                window.location.href = '/login';
              } catch (error) {
                setPasswordMessage((error as Error).message || 'Şifre değiştirilemedi.');
              } finally {
                setLoading(false);
              }
            }}
          >
            <Input name="currentPassword" type="password" placeholder="Mevcut şifre" autoComplete="current-password" required />
            <Input name="newPassword" type="password" placeholder="Yeni şifre" autoComplete="new-password" minLength={8} required />
            {passwordMessage ? <p className="text-sm text-red-700">{passwordMessage}</p> : null}
            <Button type="submit" disabled={loading}>Şifreyi güncelle</Button>
          </form>
        </section>

        <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm shadow-neutral-100">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold">Aktif oturumlar</h2>
              <p className="mt-1 text-sm text-neutral-500">Tanımadığın cihazlar varsa diğer oturumları kapat.</p>
            </div>
            <Button variant="secondary" size="sm" onClick={() => sessions.refetch()}>Yenile</Button>
          </div>
          <div className="mt-4 space-y-2">
            {sessions.isLoading ? <p className="text-sm text-neutral-600">Yükleniyor...</p> : null}
            {(sessions.data ?? []).map((session) => (
              <div key={session.id} className="rounded-xl border border-neutral-200 p-3 text-sm">
                <p className="font-medium">{session.userAgent ?? 'Bilinmeyen cihaz'}</p>
                <p className="mt-1 text-neutral-500">IP: {session.ipAddress ?? '-'} · Açılış: {new Date(session.createdAt).toLocaleString('tr-TR')}</p>
              </div>
            ))}
          </div>
          <Button className="mt-4" variant="secondary" onClick={async () => { await api.post('/auth/sessions/revoke-others'); await sessions.refetch(); }}>Diğer oturumları kapat</Button>
        </section>

        <section className="rounded-2xl border border-red-200 bg-red-50 p-4">
          <h2 className="font-semibold text-red-900">Tehlikeli alan</h2>
          <p className="mt-1 text-sm text-red-800">Hesabını deaktive edersen tekrar giriş yapamazsın. Bu işlem geri alma ekranı eklenene kadar destek üzerinden yönetilir.</p>
          <form
            className="mt-4 flex flex-col gap-3 sm:flex-row"
            onSubmit={async (event) => {
              event.preventDefault();
              const data = new FormData(event.currentTarget);
              if (!window.confirm('Hesabını deaktive etmek istediğine emin misin?')) return;
              try {
                await api.post('/auth/deactivate', { password: data.get('password') });
                clearAuth();
                window.location.href = '/login';
              } catch (error) {
                setDangerMessage((error as Error).message || 'Hesap deaktive edilemedi.');
              }
            }}
          >
            <Input name="password" type="password" placeholder="Şifreni yaz" required />
            <Button type="submit" variant="danger">Hesabı deaktive et</Button>
          </form>
          {dangerMessage ? <p className="mt-2 text-sm text-red-800">{dangerMessage}</p> : null}
        </section>
      </div>
    </AppShell>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl bg-neutral-50 p-3"><p className="text-xs font-medium uppercase tracking-wide text-neutral-500">{label}</p><p className="mt-1 truncate text-sm font-medium">{value}</p></div>;
}
