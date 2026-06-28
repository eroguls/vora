import { AppShell } from '../../components/layout/app-shell';
import { FeedList } from '../../components/feed/feed-list';

export const metadata = { title: 'Kaydedilenler' };

export default function SavedPage() {
  return (
    <AppShell>
      <div className="border-b border-neutral-200 p-4"><h1 className="text-lg font-semibold">Kaydedilenler</h1></div>
      <FeedList endpoint="/interactions/saved" empty="Kaydedilen içerik yok." />
    </AppShell>
  );
}
