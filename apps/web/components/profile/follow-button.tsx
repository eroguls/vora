'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@vora/ui';
import { api } from '../../lib/api';
import { useAuthStore } from '../../lib/auth-store';

export function FollowButton({ userId, initialFollowing }: { userId: string; initialFollowing?: boolean }) {
  const router = useRouter();
  const token = useAuthStore((state) => state.accessToken);
  const [following, setFollowing] = React.useState(Boolean(initialFollowing));
  const [loading, setLoading] = React.useState(false);
  return (
    <Button
      variant={following ? 'secondary' : 'primary'}
      disabled={loading}
      onClick={async () => {
        if (!token) return router.push('/login');
        setLoading(true);
        const previous = following;
        setFollowing(!previous);
        try {
          if (previous) await api.delete(`/social/follow/${userId}`);
          else await api.post(`/social/follow/${userId}`);
        } catch {
          setFollowing(previous);
        } finally {
          setLoading(false);
        }
      }}
    >
      {following ? 'Takiptesin' : 'Takip et'}
    </Button>
  );
}
