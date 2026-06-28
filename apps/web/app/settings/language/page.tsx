'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@vora/ui';
import { AppShell } from '../../../components/layout/app-shell';
import { api } from '../../../lib/api';

const languages = [
  ['tr', 'Türkçe'],
  ['en', 'English'],
  ['de', 'Deutsch'],
  ['fr', 'Français'],
  ['es', 'Español'],
] as const;

export default function LanguageSettingsPage() {
  const profile = useQuery({ queryKey: ['profile-me'], queryFn: () => api.get<any>('/profiles/me') });
  const [uiLanguage, setUiLanguage] = React.useState('tr');
  const [contentLanguages, setContentLanguages] = React.useState<string[]>([]);
  const [message, setMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    const stored = window.localStorage.getItem('vora-ui-language');
    if (stored) setUiLanguage(stored);
  }, []);

  React.useEffect(() => {
    if (profile.data?.languages) setContentLanguages(profile.data.languages);
  }, [profile.data?.languages]);

  return (
    <AppShell rightRail={false}>
      <div className="border-b border-neutral-200 p-4"><h1 className="text-lg font-semibold">Dil tercihleri</h1><p className="mt-1 text-sm text-neutral-500">Arayüz ve içerik dillerini yönet.</p></div>
      <form
        className="space-y-4 p-4"
        onSubmit={async (event) => {
          event.preventDefault();
          window.localStorage.setItem('vora-ui-language', uiLanguage);
          await api.patch('/profiles/me', { languages: contentLanguages.length ? contentLanguages : ['tr'] });
          await profile.refetch();
          setMessage('Dil tercihleri kaydedildi.');
        }}
      >
        <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm shadow-neutral-100">
          <h2 className="font-semibold">Arayüz dili</h2>
          <select value={uiLanguage} onChange={(event) => setUiLanguage(event.target.value)} className="mt-3 h-11 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm">
            {languages.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <p className="mt-2 text-sm text-neutral-500">Tam çeviri sistemi bağlanana kadar bu tercih cihazında saklanır.</p>
        </section>
        <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm shadow-neutral-100">
          <h2 className="font-semibold">İçerik dilleri</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {languages.map(([value, label]) => (
              <label key={value} className="flex items-center gap-2 rounded-xl border border-neutral-200 p-3 text-sm">
                <input type="checkbox" checked={contentLanguages.includes(value)} onChange={(event) => setContentLanguages((current) => event.target.checked ? [...new Set([...current, value])] : current.filter((item) => item !== value))} />
                {label}
              </label>
            ))}
          </div>
        </section>
        {message ? <p className="text-sm text-cyan-700">{message}</p> : null}
        <Button type="submit">Kaydet</Button>
      </form>
    </AppShell>
  );
}
