'use client';

import { Check, Monitor, Moon, Sun } from 'lucide-react';
import { useTheme, type ThemePreference } from './theme-provider';

const options: Array<{ value: ThemePreference; title: string; description: string; icon: typeof Monitor }> = [
  { value: 'system', title: 'Sistem', description: 'Cihaz ayarına göre otomatik.', icon: Monitor },
  { value: 'light', title: 'Aydınlık', description: 'Klasik beyaz görünüm.', icon: Sun },
  { value: 'dark', title: 'Karanlık', description: 'Düşük ışık için koyu tema.', icon: Moon },
];

export function ThemeSettings() {
  const { preference, resolvedTheme, setPreference } = useTheme();
  return (
    <section className="rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm shadow-neutral-100 dark:border-white/10 dark:bg-[#0c1014] dark:shadow-none">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold">Tema</h2>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Şu an aktif görünüm: {resolvedTheme === 'dark' ? 'Karanlık' : 'Aydınlık'}.</p>
        </div>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {options.map((option) => {
          const Icon = option.icon;
          const active = preference === option.value;
          return (
            <button key={option.value} type="button" className={`focus-ring flex items-start gap-3 rounded-2xl border p-3 text-left transition-colors ${active ? 'border-[#00a3ff] bg-cyan-50 text-neutral-950 dark:border-[#00e5ff] dark:bg-[#00e5ff]/10 dark:text-white' : 'border-neutral-200 bg-neutral-50 hover:bg-neutral-100 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10'}`} onClick={() => setPreference(option.value)}>
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${active ? 'vora-gradient text-white' : 'bg-white text-neutral-700 dark:bg-neutral-900 dark:text-neutral-200'}`}><Icon className="h-5 w-5" /></span>
              <span className="min-w-0 flex-1"><span className="flex items-center gap-2 font-medium">{option.title}{active ? <Check className="h-4 w-4 text-[#008cff] dark:text-[#00e5ff]" /> : null}</span><span className="mt-1 block text-xs text-neutral-500 dark:text-neutral-400">{option.description}</span></span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
