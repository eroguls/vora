'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@vora/ui';
import { AppShell } from '../../../components/layout/app-shell';
import { api } from '../../../lib/api';

interface RelationshipRow {
  id: string;
  createdAt: string;
  user: {
    id: string;
    username: string;
    displayName: string;
    profile?: { avatarUrl?: string | null; bio?: string | null } | null;
  };
}

export default function PrivacySettingsPage() {
  const client = useQueryClient();
  const blocks = useQuery({ queryKey: ['social-blocks'], queryFn: () => api.get<RelationshipRow[]>('/social/blocks') });
  const mutes = useQuery({ queryKey: ['social-mutes'], queryFn: () => api.get<RelationshipRow[]>('/social/mutes') });

  return (
    <AppShell rightRail={false}>
      <div className="border-b border-neutral-200 p-4"><h1 className="text-lg font-semibold">Gizlilik</h1></div>
      <div className="space-y-6 p-4">
        <p className="text-sm text-neutral-600">Profil indeksleme profil ayarlarından yönetilir. Engellediğin ve sessize aldığın hesapları buradan geri alabilirsin.</p>
        <RelationshipList
          title="Engellenen hesaplar"
          empty="Engellenen hesap yok."
          rows={blocks.data ?? []}
          loading={blocks.isLoading}
          actionLabel="Engeli kaldır"
          onRemove={async (userId) => {
            await api.delete(`/social/block/${userId}`);
            await client.invalidateQueries({ queryKey: ['social-blocks'] });
          }}
        />
        <RelationshipList
          title="Sessize alınan hesaplar"
          empty="Sessize alınan hesap yok."
          rows={mutes.data ?? []}
          loading={mutes.isLoading}
          actionLabel="Sessizi kaldır"
          onRemove={async (userId) => {
            await api.delete(`/social/mute/${userId}`);
            await client.invalidateQueries({ queryKey: ['social-mutes'] });
          }}
        />
      </div>
    </AppShell>
  );
}

function RelationshipList({ title, empty, rows, loading, actionLabel, onRemove }: { title: string; empty: string; rows: RelationshipRow[]; loading: boolean; actionLabel: string; onRemove: (userId: string) => Promise<void> }) {
  return (
    <section className="rounded-md border border-neutral-200">
      <div className="border-b border-neutral-200 px-4 py-3"><h2 className="font-semibold">{title}</h2></div>
      {loading ? <p className="p-4 text-sm text-neutral-600">Yükleniyor...</p> : null}
      {!loading && rows.length === 0 ? <p className="p-4 text-sm text-neutral-600">{empty}</p> : null}
      {rows.map((row) => (
        <div key={row.id} className="flex items-center justify-between gap-3 border-b border-neutral-100 p-4 last:border-b-0">
          <div className="flex min-w-0 items-center gap-3">
            {row.user.profile?.avatarUrl ? <img className="h-10 w-10 rounded-full object-cover" src={row.user.profile.avatarUrl} alt="" /> : <div className="h-10 w-10 rounded-full bg-neutral-200" />}
            <div className="min-w-0">
              <p className="truncate font-medium">{row.user.displayName}</p>
              <p className="truncate text-sm text-neutral-500">@{row.user.username}</p>
            </div>
          </div>
          <Button size="sm" variant="secondary" onClick={() => void onRemove(row.user.id)}>{actionLabel}</Button>
        </div>
      ))}
    </section>
  );
}
