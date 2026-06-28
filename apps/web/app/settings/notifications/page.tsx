'use client';

import * as React from 'react';
import { Button } from '@vora/ui';
import { AppShell } from '../../../components/layout/app-shell';

const defaults = {
  newFollowers: true,
  comments: true,
  messageBadge: true,
  mediaProcessing: true,
  digest: false,
};

type NotificationPrefs = typeof defaults;

export default function NotificationSettingsPage() {
  const [prefs, setPrefs] = React.useState<NotificationPrefs>(defaults);
  const [saved, setSaved] = React.useState(false);

  React.useEffect(() => {
    const stored = window.localStorage.getItem('vora-notification-prefs');
    if (stored) setPrefs({ ...defaults, ...JSON.parse(stored) });
  }, []);

  const update = (key: keyof NotificationPrefs, value: boolean) => setPrefs((current) => ({ ...current, [key]: value }));

  return (
    <AppShell rightRail={false}>
      <div className="border-b border-neutral-200 p-4"><h1 className="text-lg font-semibold">Bildirim ayarları</h1><p className="mt-1 text-sm text-neutral-500">Hangi sinyallerin seni bölmesini istediğini seç.</p></div>
      <form
        className="space-y-4 p-4"
        onSubmit={(event) => {
          event.preventDefault();
          window.localStorage.setItem('vora-notification-prefs', JSON.stringify(prefs));
          setSaved(true);
        }}
      >
        <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm shadow-neutral-100">
          <h2 className="font-semibold">Platform bildirimleri</h2>
          <div className="mt-3 divide-y divide-neutral-100">
            <Toggle label="Yeni takipçiler" description="Biri seni takip ettiğinde bildirim göster." checked={prefs.newFollowers} onChange={(value) => update('newFollowers', value)} />
            <Toggle label="Yorumlar ve etkileşimler" description="Paylaşımlarına yorum veya önemli etkileşim geldiğinde bildir." checked={prefs.comments} onChange={(value) => update('comments', value)} />
            <Toggle label="Mesaj rozeti" description="Okunmamış sohbet sayısını menüde göster." checked={prefs.messageBadge} onChange={(value) => update('messageBadge', value)} />
            <Toggle label="Medya işleme" description="Yüklediğin medya hazır olduğunda veya hata aldığında bildir." checked={prefs.mediaProcessing} onChange={(value) => update('mediaProcessing', value)} />
            <Toggle label="Haftalık özet" description="Haftalık performans ve trend özetini aç." checked={prefs.digest} onChange={(value) => update('digest', value)} />
          </div>
        </section>
        {saved ? <p className="text-sm text-cyan-700">Bildirim tercihleri kaydedildi.</p> : null}
        <Button type="submit">Kaydet</Button>
      </form>
    </AppShell>
  );
}

function Toggle({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-4 py-3">
      <span>
        <span className="block text-sm font-medium">{label}</span>
        <span className="mt-0.5 block text-sm text-neutral-500">{description}</span>
      </span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-5 w-5" />
    </label>
  );
}
