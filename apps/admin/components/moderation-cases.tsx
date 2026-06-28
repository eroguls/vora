'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@vora/ui';
import { api } from '../lib/api';
import { useAdminAuthStore } from '../lib/auth-store';

const actions = [
  ['HIDE_CONTENT', 'İçeriği gizle'],
  ['RESTORE_CONTENT', 'İçeriği geri aç'],
  ['WARN_USER', 'Kullanıcıyı uyar'],
  ['TEMP_SUSPEND_USER', 'Geçici askıya al'],
  ['DISMISS_REPORT', 'Raporu reddet'],
] as const;

export function ModerationCases() {
  const client = useQueryClient();
  const { accessToken, hasHydrated } = useAdminAuthStore();
  const query = useQuery({ queryKey: ['admin-moderation'], queryFn: () => api.get<any[]>('/admin/moderation'), enabled: hasHydrated && Boolean(accessToken) });

  return (
    <section className="p-4">
      <h1 className="text-xl font-semibold">Moderasyon vakaları</h1>
      {query.isLoading ? <p className="mt-4 text-sm">Yükleniyor...</p> : null}
      <div className="mt-4 space-y-3">
        {(query.data ?? []).map((item) => (
          <article key={item.id} className="rounded-md border border-neutral-200 p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="font-medium">{item.summary}</p>
                <p className="mt-1 text-sm text-neutral-600">Durum: {item.status}</p>
                {item.report ? <p className="mt-1 text-sm text-neutral-600">Sebep: {item.report.reason}</p> : null}
                {item.content ? <p className="mt-1 text-sm text-neutral-600">İçerik: {item.content.title ?? item.content.excerpt ?? item.content.id}</p> : null}
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {actions.map(([type, label]) => (
                <Button
                  key={type}
                  size="sm"
                  variant={type === 'HIDE_CONTENT' || type === 'TEMP_SUSPEND_USER' ? 'danger' : 'secondary'}
                  onClick={async () => {
                    await api.post(`/moderation/cases/${item.id}/actions`, { type, note: `Admin action: ${label}` });
                    await client.invalidateQueries({ queryKey: ['admin-moderation'] });
                  }}
                >
                  {label}
                </Button>
              ))}
            </div>
            {item.actions?.length ? <pre className="mt-3 whitespace-pre-wrap rounded-md bg-neutral-50 p-3 text-xs">{JSON.stringify(item.actions, null, 2)}</pre> : null}
          </article>
        ))}
      </div>
      {query.data && query.data.length === 0 ? <p className="mt-4 text-sm text-neutral-600">Açık vaka yok.</p> : null}
    </section>
  );
}
