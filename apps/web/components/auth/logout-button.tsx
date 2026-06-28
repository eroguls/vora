'use client';

import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuthStore } from '../../lib/auth-store';

export function LogoutButton({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const { accessToken, clearAuth } = useAuthStore();

  if (!accessToken) return null;

  return (
    <button
      type="button"
      className={
        compact
          ? 'focus-ring flex w-full items-center justify-center gap-1 rounded-md px-2 py-2 text-xs text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950'
          : 'focus-ring flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-100 hover:text-neutral-950'
      }
      onClick={async () => {
        try {
          await api.post('/auth/logout');
        } finally {
          clearAuth();
          router.push('/login');
        }
      }}
    >
      <LogOut className="h-4 w-4" />
      Çıkış yap
    </button>
  );
}
