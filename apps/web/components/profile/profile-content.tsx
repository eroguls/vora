import type { PublicProfile } from '@vora/types';
import Link from 'next/link';
import { FeedList } from '../feed/feed-list';
import { ProfileActions } from './profile-actions';

export function ProfileContent({ profile }: { profile: PublicProfile & { viewerState?: { following: boolean } } }) {
  return (
    <div className="bg-neutral-50">
      <div className="relative z-0 h-48 overflow-hidden bg-gradient-to-br from-neutral-950 via-neutral-800 to-cyan-900">
        {profile.coverUrl ? <img src={profile.coverUrl} alt="Profil kapak görseli" className="absolute inset-0 z-0 h-full w-full object-cover" /> : <div className="absolute inset-0 z-0 opacity-30 [background-image:radial-gradient(circle_at_20%_20%,white,transparent_26%),radial-gradient(circle_at_80%_0%,#22d3ee,transparent_22%)]" />}
      </div>
      <section className="relative z-10 border-b border-neutral-200 bg-white p-4">
        <div className="relative z-20 -mt-16 flex items-end justify-between gap-3">
          <img src={profile.avatarUrl ?? `https://i.pravatar.cc/180?u=${profile.username}`} alt={`${profile.displayName} profil fotoğrafı`} className="relative z-20 h-32 w-32 rounded-full border-4 border-white bg-neutral-200 object-cover shadow-sm" />
          <div className="relative z-20">
            <ProfileActions userId={profile.id} username={profile.username} initialFollowing={profile.viewerState?.following} />
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="truncate text-3xl font-semibold tracking-tight">{profile.displayName}</h1>
            <p className="mt-1 text-neutral-500">@{profile.username}</p>
            {profile.bio ? <p className="mt-4 max-w-2xl whitespace-pre-wrap text-sm leading-6 text-neutral-800">{profile.bio}</p> : null}
          </div>
          <div className="grid min-w-[220px] grid-cols-2 gap-2">
            <Link className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3 text-center hover:bg-neutral-100" href={`/@${profile.username}/followers`}>
              <span className="block text-xl font-semibold text-neutral-950">{profile.followerCount}</span>
              <span className="text-xs font-medium text-neutral-500">Takipçi</span>
            </Link>
            <Link className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3 text-center hover:bg-neutral-100" href={`/@${profile.username}/following`}>
              <span className="block text-xl font-semibold text-neutral-950">{profile.followingCount}</span>
              <span className="text-xs font-medium text-neutral-500">Takip</span>
            </Link>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 text-sm text-neutral-600">
          {[profile.city, profile.country].filter(Boolean).length ? <span className="rounded-full bg-neutral-100 px-3 py-1">{[profile.city, profile.country].filter(Boolean).join(', ')}</span> : null}
          {profile.profession ? <span className="rounded-full bg-neutral-100 px-3 py-1">{profile.profession}</span> : null}
          {profile.languages?.length ? <span className="rounded-full bg-neutral-100 px-3 py-1">{profile.languages.join(', ')}</span> : null}
        </div>
        {profile.links?.length ? <div className="mt-4 flex flex-wrap gap-2 text-sm">{profile.links.map((link) => <a key={link.url} href={link.url} className="rounded-full bg-cyan-50 px-3 py-1 font-medium text-cyan-700 hover:bg-cyan-100" rel="noreferrer" target="_blank">{link.label}</a>)}</div> : null}
        {profile.about ? <div className="mt-5 rounded-2xl border border-neutral-200 bg-neutral-50 p-4"><h2 className="font-semibold">Hakkında</h2><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-neutral-700">{profile.about}</p></div> : null}
      </section>
      <FeedList endpoint={`/content/author/${profile.username}`} empty="Bu profilde henüz içerik yok." />
    </div>
  );
}
