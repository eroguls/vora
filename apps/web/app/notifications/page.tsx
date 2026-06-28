'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as React from 'react';
import { AppShell } from '../../components/layout/app-shell';
import { api } from '../../lib/api';
import { Button } from '@vora/ui';
import { useAuthStore } from '../../lib/auth-store';
import { getSocket } from '../../lib/socket';

export default function NotificationsPage() {
  const client = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const query = useQuery({ queryKey: ['notifications'], queryFn: () => api.get<{ items: any[]; unreadCount: number }>('/notifications') });
  React.useEffect(() => {
    if (!user?.id) return;
    const socket = getSocket();
    socket.emit('notifications:join', user.id);
    const refresh = () => void client.invalidateQueries({ queryKey: ['notifications'] });
    socket.on('notification:new', refresh);
    return () => {
      socket.off('notification:new', refresh);
    };
  }, [client, user?.id]);
  return (
    <AppShell>
      <div className="flex items-center justify-between border-b border-neutral-200 p-4">
        <h1 className="text-lg font-semibold">Bildirimler</h1>
        <Button variant="secondary" size="sm" onClick={async () => { await api.post('/notifications/read-all'); await client.invalidateQueries({ queryKey: ['notifications'] }); }}>Tümünü okundu işaretle</Button>
      </div>
      {query.isLoading ? <p className="p-6 text-sm">Yükleniyor...</p> : null}
      {(query.data?.items ?? []).map((item) => <a key={item.id} href={item.href ?? '#'} className="block border-b border-neutral-200 p-4 hover:bg-neutral-50"><p className="font-medium">{item.title}</p>{item.body ? <p className="mt-1 text-sm text-neutral-600">{item.body}</p> : null}</a>)}
      {query.data && query.data.items.length === 0 ? <p className="p-6 text-sm text-neutral-600">Bildirim yok.</p> : null}
    </AppShell>
  );
}
