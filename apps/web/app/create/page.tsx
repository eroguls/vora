import { AppShell } from '../../components/layout/app-shell';
import { CreateComposer } from '../../components/create/create-composer';

export const metadata = { title: 'Paylaş' };

export default function CreatePage() {
  return (
    <AppShell rightRail={false}>
      <div className="border-b border-neutral-200 bg-neutral-50 p-4">
        <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm shadow-neutral-100">
          <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700">Yeni paylaşım</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Dünyaya bir şey anlat</h1>
          <p className="mt-2 text-sm leading-6 text-neutral-600">İçerik türünü seçme. Metin, görsel, video veya ses ekle; Vora deneyimi otomatik oluşturur.</p>
        </div>
      </div>
      <CreateComposer />
    </AppShell>
  );
}
