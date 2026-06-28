import { AppShell } from '../components/layout/app-shell';
import { FeedList } from '../components/feed/feed-list';

export default function HomePage() {
  return (
    <AppShell>
      <div className="sticky top-0 z-10 hidden border-b border-neutral-200 bg-white p-4 md:block dark:border-white/10 dark:bg-[#0c1014]/95">
        <h1 className="text-lg font-semibold">Global akış</h1>
      </div>
      <FeedList />
    </AppShell>
  );
}
