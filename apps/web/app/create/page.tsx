import { AppShell } from '../../components/layout/app-shell';
import { CreateComposer } from '../../components/create/create-composer';

export const metadata = { title: 'Paylaş' };

export default function CreatePage() {
  return (
    <AppShell rightRail={false}>
      <div className="border-b border-neutral-200 bg-neutral-50 p-4">
        <div className="rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm shadow-neutral-100">
          <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700">Yeni paylaşım</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Aklındakini paylaş</h1>
          <p className="mt-2 text-sm leading-6 text-neutral-600">Başlık ya da format düşünme. Yaz, istersen medya ekle; geri kalanını Vora düzenler.</p>
        </div>
      </div>
      <CreateComposer />
    </AppShell>
  );
}
