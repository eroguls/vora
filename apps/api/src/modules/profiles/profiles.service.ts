import { Injectable, NotFoundException } from '@nestjs/common';
import { profileUpdateSchema, type ProfileUpdateInput } from '@vora/validation';
import { PrismaService } from '../../prisma/prisma.service';

function links(value: unknown): Array<{ label: string; url: string }> {
  return Array.isArray(value) ? (value as Array<{ label: string; url: string }>) : [];
}

@Injectable()
export class ProfilesService {
  constructor(private readonly prisma: PrismaService) {}

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, include: { profile: true } });
    if (!user) throw new NotFoundException('Profile not found.');
    return this.present(user);
  }

  async update(userId: string, body: unknown) {
    const input = profileUpdateSchema.parse(body) as ProfileUpdateInput;
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        displayName: input.displayName,
      profile: {
          upsert: {
            create: {
              bio: input.bio,
              about: input.about,
              profession: input.profession,
              country: input.country,
              city: input.city,
              languages: input.languages ?? [],
              avatarUrl: input.avatarUrl,
              coverUrl: input.coverUrl,
              links: input.links ?? [],
              isIndexable: input.isIndexable ?? true,
              contactVisibility: input.contactVisibility ?? 'PUBLIC',
            },
            update: {
              bio: input.bio,
              about: input.about,
              profession: input.profession,
              country: input.country,
              city: input.city,
              languages: input.languages,
              avatarUrl: input.avatarUrl,
              coverUrl: input.coverUrl,
              links: input.links,
              isIndexable: input.isIndexable,
              contactVisibility: input.contactVisibility,
            },
          },
        },
      },
      include: { profile: true },
    });
    return this.present(user);
  }

  async publicProfile(username: string, viewerId?: string) {
    const user = await this.prisma.user.findUnique({
      where: { username: username.replace(/^@/, '').toLowerCase() },
      include: { profile: true },
    });
    if (!user || user.deletedAt || user.status === 'DELETED') throw new NotFoundException('Profile not found.');
    const following = viewerId
      ? Boolean(await this.prisma.follow.findUnique({ where: { followerId_followingId: { followerId: viewerId, followingId: user.id } } }))
      : false;
    return { ...this.present(user), viewerState: { following } };
  }

  async followers(username: string, viewerId?: string) {
    const user = await this.findVisibleSocialProfile(username, viewerId);
    const viewerFollowedBy = viewerId ? await this.followedByViewer(viewerId) : new Set<string>();
    const rows = await this.prisma.follow.findMany({
      where: { followingId: user.id },
      orderBy: { createdAt: 'desc' },
      include: { follower: { include: { profile: true } } },
      take: 100,
    });
    return rows.map((row) => this.presentUserListItem(row.follower, viewerFollowedBy));
  }

  async following(username: string, viewerId?: string) {
    const user = await this.findVisibleSocialProfile(username, viewerId);
    const viewerFollowedBy = viewerId ? await this.followedByViewer(viewerId) : new Set<string>();
    const rows = await this.prisma.follow.findMany({
      where: { followerId: user.id },
      orderBy: { createdAt: 'desc' },
      include: { following: { include: { profile: true } } },
      take: 100,
    });
    return rows.map((row) => this.presentUserListItem(row.following, viewerFollowedBy));
  }

  present(user: {
    id: string;
    username: string;
    displayName: string;
    isVerified: boolean;
    profile: {
      avatarUrl: string | null;
      coverUrl: string | null;
      bio: string | null;
      about: string | null;
      country: string | null;
      city: string | null;
      profession: string | null;
      followerCount: number;
      followingCount: number;
      links: unknown;
      languages: string[];
      isIndexable: boolean;
      contactVisibility: string;
    } | null;
  }) {
    return {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.profile?.avatarUrl ?? null,
      coverUrl: user.profile?.coverUrl ?? null,
      bio: user.profile?.bio ?? null,
      about: user.profile?.about ?? null,
      country: user.profile?.country ?? null,
      city: user.profile?.city ?? null,
      profession: user.profile?.profession ?? null,
      languages: user.profile?.languages ?? [],
      isVerified: user.isVerified,
      followerCount: user.profile?.followerCount ?? 0,
      followingCount: user.profile?.followingCount ?? 0,
      links: links(user.profile?.links),
      isIndexable: user.profile?.isIndexable ?? true,
      contactVisibility: user.profile?.contactVisibility ?? 'PUBLIC',
    };
  }

  private async findVisibleSocialProfile(username: string, viewerId?: string) {
    const user = await this.prisma.user.findUnique({ where: { username: username.replace(/^@/, '').toLowerCase() }, include: { profile: true } });
    if (!user || user.deletedAt || user.status === 'DELETED') throw new NotFoundException('Profile not found.');
    if (user.profile?.contactVisibility === 'PRIVATE' && user.id !== viewerId) throw new NotFoundException('Social graph is hidden.');
    return user;
  }

  private async followedByViewer(viewerId: string) {
    const rows = await this.prisma.follow.findMany({ where: { followingId: viewerId }, select: { followerId: true } });
    return new Set(rows.map((row) => row.followerId));
  }

  private presentUserListItem(user: { id: string; username: string; displayName: string; isVerified: boolean; profile: { avatarUrl: string | null; bio: string | null } | null }, viewerFollowedBy: Set<string>) {
    return {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.profile?.avatarUrl ?? null,
      bio: user.profile?.bio ?? null,
      isVerified: user.isVerified,
      followsViewer: viewerFollowedBy.has(user.id),
    };
  }
}
