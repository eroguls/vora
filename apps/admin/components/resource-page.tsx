'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button, Input } from '@vora/ui';
import { RefreshCw, Search } from 'lucide-react';
import { api } from '../lib/api';
import { useAdminAuthStore } from '../lib/auth-store';

type Row = Record<string, any>;

interface Column {
  label: string;
  value: (row: Row) => React.ReactNode;
  className?: string;
}

const configs: Record<string, { columns: Column[]; search: (row: Row) => string; empty: string }> = {
  '/admin/users': {
    empty: 'Kullanıcı yok.',
    search: (row) => `${row.displayName ?? ''} ${row.username ?? ''} ${row.email ?? ''} ${row.status ?? ''}`,
    columns: [
      { label: 'Kullanıcı', value: (row) => <Identity avatar={row.profile?.avatarUrl} title={row.displayName} subtitle={`@${row.username}`} /> },
      { label: 'E-posta', value: (row) => row.email },
      { label: 'Rol', value: (row) => <Badge tone={row.role === 'ADMIN' ? 'cyan' : 'neutral'}>{row.role}</Badge> },
      { label: 'Durum', value: (row) => <StatusBadge value={row.status} /> },
      { label: 'Katılım', value: (row) => formatDate(row.createdAt) },
    ],
  },
  '/admin/content': {
    empty: 'İçerik yok.',
    search: (row) => `${row.title ?? ''} ${row.body ?? ''} ${row.author?.username ?? ''} ${row.status ?? ''}`,
    columns: [
      { label: 'İçerik', value: (row) => <TextBlock title={row.title ?? row.excerpt ?? 'Başlıksız'} subtitle={row.slug} /> },
      { label: 'Yazar', value: (row) => <Identity avatar={row.author?.profile?.avatarUrl} title={row.author?.displayName ?? row.author?.username} subtitle={row.author?.username ? `@${row.author.username}` : '-'} /> },
      { label: 'Tür', value: (row) => <Badge tone="neutral">{row.contentType}</Badge> },
      { label: 'Durum', value: (row) => <StatusBadge value={row.status} /> },
      { label: 'Metrikler', value: (row) => `${row.likeCount ?? 0} beğeni · ${row.commentCount ?? 0} yorum` },
    ],
  },
  '/admin/reports': {
    empty: 'Rapor yok.',
    search: (row) => `${row.reason ?? ''} ${row.status ?? ''} ${row.reporter?.username ?? ''}`,
    columns: [
      { label: 'Rapor', value: (row) => <TextBlock title={row.reason} subtitle={row.details ?? 'Detay yok'} /> },
      { label: 'Raporlayan', value: (row) => <Identity title={row.reporter?.displayName ?? row.reporter?.username} subtitle={row.reporter?.username ? `@${row.reporter.username}` : '-'} /> },
      { label: 'Hedef', value: (row) => row.content?.title ?? row.reportedUser?.username ?? '-' },
      { label: 'Durum', value: (row) => <StatusBadge value={row.status} /> },
      { label: 'Tarih', value: (row) => formatDate(row.createdAt) },
    ],
  },
  '/admin/comments': {
    empty: 'Yorum yok.',
    search: (row) => `${row.body ?? ''} ${row.author?.username ?? ''}`,
    columns: [
      { label: 'Yorum', value: (row) => <TextBlock title={row.body} subtitle={row.content?.title ?? row.content?.slug ?? 'İçerik'} /> },
      { label: 'Yazar', value: (row) => <Identity avatar={row.author?.profile?.avatarUrl} title={row.author?.displayName ?? row.author?.username} subtitle={row.author?.username ? `@${row.author.username}` : '-'} /> },
      { label: 'Beğeni', value: (row) => row.likeCount ?? 0 },
      { label: 'Tarih', value: (row) => formatDate(row.createdAt) },
    ],
  },
  '/admin/media': {
    empty: 'Medya yok.',
    search: (row) => `${row.mimeType ?? ''} ${row.mediaType ?? ''} ${row.owner?.username ?? ''} ${row.processingStatus ?? ''}`,
    columns: [
      { label: 'Önizleme', value: (row) => <MediaPreview row={row} /> },
      { label: 'Tip', value: (row) => <Badge tone="neutral">{row.mediaType}</Badge> },
      { label: 'Sahip', value: (row) => <Identity title={row.owner?.displayName ?? row.owner?.username} subtitle={row.owner?.username ? `@${row.owner.username}` : '-'} /> },
      { label: 'Durum', value: (row) => <StatusBadge value={row.processingStatus} /> },
      { label: 'Boyut', value: (row) => row.fileSize ? `${Math.round(row.fileSize / 1024)} KB` : '-' },
    ],
  },
  '/admin/jobs': {
    empty: 'Kuyruk boş.',
    search: (row) => `${row.queueName ?? ''} ${row.status ?? ''} ${row.error ?? ''}`,
    columns: [
      { label: 'Job', value: (row) => <TextBlock title={row.queueName} subtitle={row.id} /> },
      { label: 'Durum', value: (row) => <StatusBadge value={row.status} /> },
      { label: 'Deneme', value: (row) => row.attempts ?? 0 },
      { label: 'Hata', value: (row) => row.error ?? '-' },
      { label: 'Tarih', value: (row) => formatDate(row.createdAt) },
    ],
  },
  '/admin/search': {
    empty: 'Arama kaydı yok.',
    search: (row) => `${row.query ?? ''}`,
    columns: [
      { label: 'Sorgu', value: (row) => <span className="font-medium">{row.query}</span> },
      { label: 'Sonuç', value: (row) => row.resultCount ?? 0 },
      { label: 'Kullanıcı', value: (row) => row.userId ?? 'Anonim' },
      { label: 'Tarih', value: (row) => formatDate(row.createdAt) },
    ],
  },
  '/admin/notifications': {
    empty: 'Bildirim yok.',
    search: (row) => `${row.title ?? ''} ${row.type ?? ''} ${row.recipient?.username ?? ''}`,
    columns: [
      { label: 'Bildirim', value: (row) => <TextBlock title={row.title} subtitle={row.body ?? row.type} /> },
      { label: 'Alıcı', value: (row) => <Identity title={row.recipient?.displayName ?? row.recipient?.username} subtitle={row.recipient?.username ? `@${row.recipient.username}` : '-'} /> },
      { label: 'Okundu', value: (row) => row.readAt ? <Badge tone="green">Okundu</Badge> : <Badge tone="cyan">Yeni</Badge> },
      { label: 'Tarih', value: (row) => formatDate(row.createdAt) },
    ],
  },
  '/admin/audit-logs': {
    empty: 'Audit kaydı yok.',
    search: (row) => `${row.action ?? ''} ${row.entity ?? ''} ${row.actor?.username ?? ''}`,
    columns: [
      { label: 'Aksiyon', value: (row) => <TextBlock title={row.action} subtitle={`${row.entity ?? '-'} ${row.entityId ?? ''}`} /> },
      { label: 'Aktör', value: (row) => row.actor ? <Identity title={row.actor.displayName ?? row.actor.username} subtitle={`@${row.actor.username}`} /> : 'Sistem' },
      { label: 'Tarih', value: (row) => formatDate(row.createdAt) },
    ],
  },
  '/admin/settings': {
    empty: 'Feature flag yok.',
    search: (row) => `${row.key ?? ''} ${row.description ?? ''}`,
    columns: [
      { label: 'Flag', value: (row) => <TextBlock title={row.key} subtitle={row.description ?? 'Açıklama yok'} /> },
      { label: 'Durum', value: (row) => row.enabled ? <Badge tone="green">Aktif</Badge> : <Badge tone="neutral">Kapalı</Badge> },
      { label: 'Güncelleme', value: (row) => formatDate(row.updatedAt) },
    ],
  },
};

export function ResourcePage({ title, endpoint }: { title: string; endpoint: string }) {
  const [search, setSearch] = React.useState('');
  const { accessToken, hasHydrated } = useAdminAuthStore();
  const query = useQuery({
    queryKey: ['admin-resource', endpoint],
    queryFn: () => api.get<any[] | Record<string, unknown>>(endpoint),
    enabled: hasHydrated && Boolean(accessToken),
  });
  const config = configs[endpoint];
  const rows = Array.isArray(query.data) ? query.data : query.data ? [query.data] : [];
  const filteredRows = config && search.trim() ? rows.filter((row) => config.search(row).toLowerCase().includes(search.trim().toLowerCase())) : rows;

  return (
    <section className="p-4 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700">Admin kaynakları</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-1 text-sm text-neutral-500">{rows.length} kayıt · canlı operasyon görünümü</p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => query.refetch()}><RefreshCw className="h-4 w-4" /> Yenile</Button>
      </div>

      {query.isLoading ? <ResourceSkeleton /> : null}
      {query.isError ? <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">Veri alınamadı. Admin tokenını kontrol et.</div> : null}

      {query.data && !Array.isArray(query.data) && !config ? <ObjectSummary data={query.data} /> : null}

      {config ? (
        <>
          <div className="mt-5 flex items-center gap-2 rounded-2xl border border-neutral-200 bg-white px-3 py-2 shadow-sm shadow-neutral-100">
            <Search className="h-4 w-4 text-neutral-500" />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`${title} içinde ara`} className="border-0 shadow-none focus-visible:ring-0" />
          </div>
          <div className="mt-4 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm shadow-neutral-100">
            <div className="hidden grid-cols-[repeat(var(--cols),minmax(0,1fr))] border-b border-neutral-200 bg-neutral-50 text-xs font-semibold uppercase tracking-wide text-neutral-500 md:grid" style={{ ['--cols' as string]: config.columns.length }}>
              {config.columns.map((column) => <div key={column.label} className="px-4 py-3">{column.label}</div>)}
            </div>
            <div className="divide-y divide-neutral-100">
              {filteredRows.map((row) => <ResourceRow key={row.id ?? JSON.stringify(row)} row={row} columns={config.columns} />)}
            </div>
          </div>
          {filteredRows.length === 0 && !query.isLoading ? <div className="mt-4 rounded-2xl border border-neutral-200 bg-white p-6 text-center text-sm text-neutral-600">{search ? 'Aramana uygun kayıt yok.' : config.empty}</div> : null}
        </>
      ) : null}
    </section>
  );
}

function ResourceRow({ row, columns }: { row: Row; columns: Column[] }) {
  return (
    <div className="grid gap-3 p-4 md:grid-cols-[repeat(var(--cols),minmax(0,1fr))] md:items-center" style={{ ['--cols' as string]: columns.length }}>
      {columns.map((column) => <div key={column.label} className={`min-w-0 text-sm ${column.className ?? ''}`}><span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-neutral-400 md:hidden">{column.label}</span>{column.value(row)}</div>)}
    </div>
  );
}

function ObjectSummary({ data }: { data: Record<string, unknown> }) {
  return <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{Object.entries(data).map(([key, value]) => <div key={key} className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm shadow-neutral-100"><p className="text-sm text-neutral-500">{labelize(key)}</p><div className="mt-2 text-lg font-semibold">{renderObjectValue(value)}</div></div>)}</div>;
}

function ResourceSkeleton() {
  return <div className="mt-6 space-y-3">{[0, 1, 2].map((item) => <div key={item} className="h-20 animate-pulse rounded-2xl bg-neutral-100" />)}</div>;
}

function Identity({ avatar, title, subtitle }: { avatar?: string | null; title?: string | null; subtitle?: string | null }) {
  return <div className="flex min-w-0 items-center gap-3">{avatar ? <img src={avatar} alt="" className="h-10 w-10 rounded-full object-cover" /> : <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-sm font-semibold">{title?.[0] ?? '?'}</div>}<span className="min-w-0"><span className="block truncate font-medium">{title ?? '-'}</span><span className="block truncate text-xs text-neutral-500">{subtitle ?? ''}</span></span></div>;
}

function TextBlock({ title, subtitle }: { title?: string | null; subtitle?: string | null }) {
  return <span className="min-w-0"><span className="block truncate font-medium">{title ?? '-'}</span>{subtitle ? <span className="mt-0.5 block line-clamp-2 text-xs text-neutral-500">{subtitle}</span> : null}</span>;
}

function MediaPreview({ row }: { row: Row }) {
  if (row.mediaType === 'IMAGE') return <div className="flex items-center gap-3"><img src={row.thumbnailUrl ?? row.publicUrl} alt="" className="h-12 w-12 rounded-xl object-cover" /><TextBlock title={row.mimeType} subtitle={row.storageKey} /></div>;
  return <TextBlock title={row.mimeType} subtitle={row.storageKey} />;
}

function StatusBadge({ value }: { value?: string }) {
  const tone = value === 'ACTIVE' || value === 'PUBLISHED' || value === 'READY' || value === 'RESOLVED' ? 'green' : value === 'FAILED' || value === 'SUSPENDED' || value === 'DELETED' || value === 'HIDDEN' ? 'red' : value === 'PENDING' || value === 'OPEN' || value === 'REVIEWING' ? 'cyan' : 'neutral';
  return <Badge tone={tone}>{value ?? '-'}</Badge>;
}

function Badge({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: 'neutral' | 'cyan' | 'green' | 'red' }) {
  const tones = { neutral: 'bg-neutral-100 text-neutral-700', cyan: 'bg-cyan-50 text-cyan-700', green: 'bg-emerald-50 text-emerald-700', red: 'bg-red-50 text-red-700' };
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${tones[tone]}`}>{children}</span>;
}

function formatDate(value?: string | Date | null) {
  if (!value) return '-';
  return new Date(value).toLocaleString('tr-TR', { dateStyle: 'medium', timeStyle: 'short' });
}

function labelize(value: string) {
  return value.replace(/([A-Z])/g, ' $1').replace(/^./, (char) => char.toUpperCase());
}

function renderObjectValue(value: unknown) {
  if (Array.isArray(value)) return `${value.length} kayıt`;
  if (typeof value === 'object' && value) return `${Object.keys(value).length} alan`;
  return String(value ?? '-');
}
