'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Button } from '@vora/ui';
import { api } from '../../lib/api';
import { PostShell } from '../feed/post-shell';

type SearchTab = 'all' | 'content' | 'profile';
type Timeframe = '' | '24h' | 'week' | 'month';

interface SearchResult {
  kind: 'content' | 'profile';
  content?: any;
  profile?: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
    bio: string | null;
    country: string | null;
    city: string | null;
    isVerified: boolean;
  };
}

export function SearchPage() {
  const router = useRouter();
  const params = useSearchParams();
  const initial = params.get('q') ?? '';
  const [query, setQuery] = React.useState(initial);
  const [tab, setTab] = React.useState<SearchTab>((params.get('tab') as SearchTab) || 'all');
  const [timeframe, setTimeframe] = React.useState<Timeframe>((params.get('timeframe') as Timeframe) || '');
  const [country, setCountry] = React.useState(params.get('country') ?? '');
  const [city, setCity] = React.useState(params.get('city') ?? '');
  const [language, setLanguage] = React.useState(params.get('language') ?? '');
  const [filtersOpen, setFiltersOpen] = React.useState(false);
  const deferredQuery = React.useDeferredValue(query.trim());
  const activeFilterCount = [timeframe, country.trim(), city.trim(), language].filter(Boolean).length;
  const requestPath = React.useMemo(() => {
    const search = new URLSearchParams({ q: deferredQuery });
    if (timeframe) search.set('timeframe', timeframe);
    if (country.trim()) search.set('country', country.trim());
    if (city.trim()) search.set('city', city.trim());
    if (language) search.set('language', language);
    return `/search?${search.toString()}`;
  }, [city, country, deferredQuery, language, timeframe]);
  const results = useQuery({
    queryKey: ['search', deferredQuery, timeframe, country.trim(), city.trim(), language],
    enabled: deferredQuery.length > 0,
    queryFn: ({ signal }) => api.request<{ items: SearchResult[]; nextCursor: string | null }>(requestPath, { signal }),
  });
  const items = results.data?.items ?? [];
  const visibleItems = tab === 'all' ? items : items.filter((item) => item.kind === tab);
  const contentCount = items.filter((item) => item.kind === 'content').length;
  const profileCount = items.filter((item) => item.kind === 'profile').length;
  const syncUrl = (nextTab = tab) => {
    const search = new URLSearchParams();
    if (query.trim()) search.set('q', query.trim());
    if (nextTab !== 'all') search.set('tab', nextTab);
    if (timeframe) search.set('timeframe', timeframe);
    if (country.trim()) search.set('country', country.trim());
    if (city.trim()) search.set('city', city.trim());
    if (language) search.set('language', language);
    router.replace(`/search${search.toString() ? `?${search.toString()}` : ''}`);
  };
  const clearFilters = () => {
    setTimeframe('');
    setCountry('');
    setCity('');
    setLanguage('');
  };
  return (
    <div>
      <div className="sticky top-0 z-10 border-b border-neutral-200 bg-white p-3 md:top-0">
        <form className="relative" onSubmit={(event) => { event.preventDefault(); syncUrl(); }}>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} className="focus-ring h-11 w-full rounded-md border border-neutral-300 pl-9 pr-3" placeholder="Amerika’da ikinci el araç fiyatları" aria-label="Dünyada ara" />
        </form>
        <button className="focus-ring mt-2 inline-flex items-center gap-2 rounded-md px-2 py-1 text-sm text-neutral-600 hover:bg-neutral-100" onClick={() => setFiltersOpen((value) => !value)}>
          <SlidersHorizontal className="h-4 w-4" /> Gelişmiş filtreler {activeFilterCount ? <span className="rounded-full bg-cyan-600 px-2 py-0.5 text-xs text-white">{activeFilterCount}</span> : null}
        </button>
        {filtersOpen ? (
          <div className="mt-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-3">
            <div className="grid gap-2 text-sm sm:grid-cols-4">
              <select value={timeframe} onChange={(event) => setTimeframe(event.target.value as Timeframe)} className="rounded-md border border-neutral-300 bg-white p-2">
                <option value="">Tüm zamanlar</option>
                <option value="24h">Son 24 saat</option>
                <option value="week">Son hafta</option>
                <option value="month">Son ay</option>
              </select>
              <input value={country} onChange={(event) => setCountry(event.target.value)} className="rounded-md border border-neutral-300 bg-white p-2" placeholder="Ülke" />
              <input value={city} onChange={(event) => setCity(event.target.value)} className="rounded-md border border-neutral-300 bg-white p-2" placeholder="Şehir" />
              <select value={language} onChange={(event) => setLanguage(event.target.value)} className="rounded-md border border-neutral-300 bg-white p-2">
                <option value="">Tüm diller</option>
                <option value="tr">Türkçe</option>
                <option value="en">English</option>
                <option value="de">Deutsch</option>
                <option value="fr">Français</option>
                <option value="es">Español</option>
              </select>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" type="button" onClick={() => syncUrl()}>Filtreleri uygula</Button>
              {activeFilterCount ? <Button size="sm" type="button" variant="secondary" onClick={clearFilters}><X className="h-4 w-4" /> Temizle</Button> : null}
            </div>
          </div>
        ) : null}
        {deferredQuery ? (
          <div className="mt-3 grid grid-cols-3 rounded-xl bg-neutral-100 p-1 text-sm font-medium">
            <button className={`rounded-lg px-3 py-2 ${tab === 'all' ? 'bg-white shadow-sm' : 'text-neutral-600'}`} onClick={() => { setTab('all'); syncUrl('all'); }}>Tümü {items.length}</button>
            <button className={`rounded-lg px-3 py-2 ${tab === 'content' ? 'bg-white shadow-sm' : 'text-neutral-600'}`} onClick={() => { setTab('content'); syncUrl('content'); }}>Paylaşımlar {contentCount}</button>
            <button className={`rounded-lg px-3 py-2 ${tab === 'profile' ? 'bg-white shadow-sm' : 'text-neutral-600'}`} onClick={() => { setTab('profile'); syncUrl('profile'); }}>Kişiler {profileCount}</button>
          </div>
        ) : null}
      </div>
      {!deferredQuery ? <SearchIntro /> : null}
      {results.isLoading ? <SearchLoading /> : null}
      {results.isError ? <div className="m-4 rounded-2xl border border-red-200 bg-red-50 p-4"><p className="text-sm font-medium text-red-800">Arama başarısız.</p><Button className="mt-2" variant="secondary" onClick={() => results.refetch()}>Tekrar dene</Button></div> : null}
      {visibleItems.map((item) =>
        item.kind === 'content' ? (
          <PostShell key={`content-${item.content.id}`} content={item.content} />
        ) : (
          item.profile ? <Link key={`profile-${item.profile.id}`} href={`/@${item.profile.username}`} className="focus-ring mx-3 my-3 flex gap-3 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm shadow-neutral-100 hover:bg-neutral-50 sm:mx-4">
            <img src={item.profile.avatarUrl ?? `https://i.pravatar.cc/120?u=${item.profile.username}`} alt="" className="h-14 w-14 rounded-full object-cover" />
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2 font-semibold">{item.profile.displayName}{item.profile.isVerified ? <span className="rounded-full bg-cyan-600 px-1 text-[10px] font-bold text-white">✓</span> : null}</span>
              <span className="block text-sm text-neutral-500">@{item.profile.username}</span>
              {item.profile.bio ? <span className="mt-1 block text-sm text-neutral-700">{item.profile.bio}</span> : null}
              {[item.profile.city, item.profile.country].filter(Boolean).length ? <span className="mt-2 inline-block rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600">{[item.profile.city, item.profile.country].filter(Boolean).join(', ')}</span> : null}
            </span>
          </Link> : null
        ),
      )}
      {deferredQuery && !results.isLoading && !visibleItems.length ? <SearchEmpty query={deferredQuery} hasFilters={activeFilterCount > 0} /> : null}
    </div>
  );
}

function SearchIntro() {
  const examples = ['Amerikada ikinci el araç', 'Tokyo günlük yaşam', 'Kanadada ev kiralamak'];
  return <div className="p-4"><div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm shadow-neutral-100"><h2 className="text-lg font-semibold">Dünyada ara</h2><p className="mt-2 text-sm leading-6 text-neutral-600">Paylaşımları ve kişileri aynı aramada bul. Arama yaptıktan sonra alttaki sekmelerle sonuçları ayırabilirsin.</p><div className="mt-4 flex flex-wrap gap-2">{examples.map((item) => <Link key={item} href={`/search?q=${encodeURIComponent(item)}`} className="rounded-full bg-neutral-100 px-3 py-1.5 text-sm hover:bg-neutral-200">{item}</Link>)}</div></div></div>;
}

function SearchLoading() {
  return <div className="space-y-3 p-4">{[0, 1, 2].map((item) => <div key={item} className="h-24 animate-pulse rounded-2xl bg-neutral-100" />)}</div>;
}

function SearchEmpty({ query, hasFilters }: { query: string; hasFilters: boolean }) {
  return <div className="p-4"><div className="rounded-2xl border border-neutral-200 bg-white p-5 text-center"><h2 className="font-semibold">Sonuç bulunamadı</h2><p className="mt-2 text-sm text-neutral-600">“{query}” için sonuç yok. {hasFilters ? 'Filtreleri temizleyip tekrar deneyebilirsin.' : 'Daha kısa veya farklı bir arama deneyebilirsin.'}</p></div></div>;
}
