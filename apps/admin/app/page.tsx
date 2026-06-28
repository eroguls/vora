'use client';

import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, FileText, Image, Search, Users } from 'lucide-react';
import { AdminShell } from '../components/admin-shell';
import { api } from '../lib/api';
import { useAdminAuthStore } from '../lib/auth-store';

export default function DashboardPage() {
  const { accessToken, hasHydrated } = useAdminAuthStore();
  const query = useQuery({ queryKey: ['admin-dashboard'], queryFn: () => api.get<any>('/admin/dashboard'), enabled: hasHydrated && Boolean(accessToken) });
  const metrics = query.data;
  const cards = metrics ? [
    { label: 'Toplam kullanıcı', value: metrics.totalUsers, detail: `${metrics.newUsers} bugün yeni`, icon: Users, tone: 'cyan' },
    { label: 'Aktif kullanıcı', value: metrics.activeUsers, detail: 'Son 30 gün aktif', icon: Users, tone: 'green' },
    { label: 'Toplam içerik', value: metrics.totalContent, detail: 'Yayındaki ve taslaklar', icon: FileText, tone: 'neutral' },
    { label: 'Açık rapor', value: metrics.openReports, detail: 'Moderasyon bekliyor', icon: AlertTriangle, tone: 'red' },
    { label: 'Günlük medya', value: metrics.dailyMedia, detail: 'Bugün yüklenen', icon: Image, tone: 'cyan' },
    { label: 'İşleme hatası', value: metrics.failedProcessing, detail: 'Retry gerekebilir', icon: AlertTriangle, tone: 'red' },
    { label: 'Arama sayısı', value: metrics.searchCount, detail: 'Toplam query', icon: Search, tone: 'neutral' },
  ] : [];
  return (
    <AdminShell>
      <section className="p-4 sm:p-6">
        <div className="rounded-3xl bg-neutral-950 p-6 text-white shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-cyan-300">Operasyon özeti</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-300">Kullanıcı, içerik, moderasyon ve medya kuyruğunun güncel durumunu tek bakışta izle.</p>
        </div>
        {query.isLoading ? <p className="mt-6 text-sm">Yükleniyor...</p> : null}
        {query.isError ? <p className="mt-6 text-sm text-red-600">Admin verisi alınamadı.</p> : null}
        {metrics ? <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{cards.map((card) => <MetricCard key={card.label} {...card} />)}</div> : null}
        {metrics?.topQueries?.length ? <div className="mt-5 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm shadow-neutral-100"><h2 className="font-semibold">Popüler aramalar</h2><div className="mt-3 flex flex-wrap gap-2">{metrics.topQueries.map((item: any) => <span key={item.query} className="rounded-full bg-neutral-100 px-3 py-1 text-sm">{item.query} · {item._count?.query ?? 0}</span>)}</div></div> : null}
      </section>
    </AdminShell>
  );
}

function MetricCard({ label, value, detail, icon: Icon, tone }: { label: string; value: number; detail: string; icon: any; tone: string }) {
  const tones: Record<string, string> = { cyan: 'bg-cyan-50 text-cyan-700', green: 'bg-emerald-50 text-emerald-700', red: 'bg-red-50 text-red-700', neutral: 'bg-neutral-100 text-neutral-700' };
  return <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm shadow-neutral-100"><div className="flex items-start justify-between gap-3"><div><p className="text-sm text-neutral-500">{label}</p><p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p></div><span className={`flex h-10 w-10 items-center justify-center rounded-xl ${tones[tone]}`}><Icon className="h-5 w-5" /></span></div><p className="mt-3 text-sm text-neutral-500">{detail}</p></div>;
}
