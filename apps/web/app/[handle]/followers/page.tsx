import { notFound } from 'next/navigation';
import { AppShell } from '../../../components/layout/app-shell';
import { FollowList } from '../../../components/profile/follow-list';

function usernameFromHandle(handle: string) {
  const decoded = decodeURIComponent(handle);
  return decoded.startsWith('@') ? decoded.slice(1) : null;
}

export default async function FollowersPage({ params }: { params: Promise<{ handle: string }> }) {
  const username = usernameFromHandle((await params).handle);
  if (!username) notFound();
  return <AppShell><FollowList title="Takipçiler" endpoint={`/profiles/${username}/followers`} /></AppShell>;
}
