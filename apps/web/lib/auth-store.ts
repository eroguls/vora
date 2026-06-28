'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  displayName: string;
  role: string;
  adminRole: string | null;
  avatarUrl: string | null;
}

interface AuthState {
  accessToken: string | null;
  user: AuthUser | null;
  activeAccountId: string | null;
  savedAccounts: Array<{ accessToken: string; user: AuthUser }>;
  setAuth: (accessToken: string, user: AuthUser) => void;
  switchAccount: (userId: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      activeAccountId: null,
      savedAccounts: [],
      setAuth: (accessToken, user) => set((state) => ({
        accessToken,
        user,
        activeAccountId: user.id,
        savedAccounts: [{ accessToken, user }, ...state.savedAccounts.filter((account) => account.user.id !== user.id)].slice(0, 5),
      })),
      switchAccount: (userId) => set((state) => {
        const account = state.savedAccounts.find((item) => item.user.id === userId);
        return account ? { accessToken: account.accessToken, user: account.user, activeAccountId: account.user.id } : state;
      }),
      clearAuth: () => set({ accessToken: null, user: null, activeAccountId: null }),
    }),
    { name: 'vora-auth' },
  ),
);
