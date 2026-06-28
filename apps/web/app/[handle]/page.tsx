import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { PublicProfile } from '@vora/types';
import { AppShell } from '../../components/layout/app-shell';
import { ProfileContent } from '../../components/profile/profile-content';
import { serverApi } from '../../lib/api';
import { personSchema } from '../../lib/seo';

function usernameFromHandle(handle: string) {
  const decoded = decodeURIComponent(handle);
  return decoded.startsWith('@') ? decoded.slice(1) : null;
}

async function getProfile(handle: string) {
  const username = usernameFromHandle(handle);
  if (!username) return null;
  try {
    return await serverApi<PublicProfile & { viewerState?: { following: boolean } }>(`/profiles/${username}`);
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }): Promise<Metadata> {
  const profile = await getProfile((await params).handle);
  if (!profile) return { title: 'Profil bulunamadı' };
  const title = `${profile.displayName} (@${profile.username})`;
  const description = profile.bio ?? `${profile.displayName} Vora profili`;
  return {
    title,
    description,
    alternates: { canonical: `/@${profile.username}` },
    openGraph: { title, description, type: 'profile', images: profile.avatarUrl ? [profile.avatarUrl] : undefined },
    twitter: { card: 'summary_large_image', title, description, images: profile.avatarUrl ? [profile.avatarUrl] : undefined },
    robots: profile.isIndexable ? { index: true, follow: true } : { index: false, follow: false },
  };
}

export default async function ProfilePage({ params }: { params: Promise<{ handle: string }> }) {
  const profile = await getProfile((await params).handle);
  if (!profile) notFound();
  return (
    <AppShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema(profile)) }} />
      <ProfileContent profile={profile} />
    </AppShell>
  );
}
