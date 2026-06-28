import { Suspense } from 'react';
import { AppShell } from '../../components/layout/app-shell';
import { SearchPage } from '../../components/search/search-page';

export const metadata = { title: 'Ara' };

export default function Page() {
  return (
    <AppShell>
      <Suspense fallback={<p className="p-6 text-sm text-neutral-600">Arama yükleniyor...</p>}>
        <SearchPage />
      </Suspense>
    </AppShell>
  );
}
