'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AdminAuthState {
  accessToken: string | null;
  user: { displayName: string; username: string; role: string; adminRole: string | null } | null;
  hasHydrated: boolean;
  setAuth: (accessToken: string, user: AdminAuthState['user']) => void;
  clearAuth: () => void;
  setHasHydrated: (hasHydrated: boolean) => void;
}

export const useAdminAuthStore = create<AdminAuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      hasHydrated: false,
      setAuth: (accessToken, user) => set({ accessToken, user }),
      clearAuth: () => set({ accessToken: null, user: null }),
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
    }),
    {
      name: 'vora-admin-auth',
      onRehydrateStorage: () => (state) => state?.setHasHydrated(true),
    },
  ),
);
