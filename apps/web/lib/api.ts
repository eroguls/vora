import { ApiClient } from '@vora/api-client';
import type { ApiEnvelope } from '@vora/types';
import { useAuthStore } from './auth-store';

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

interface AuthResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    username: string;
    displayName: string;
    role: string;
    adminRole: string | null;
    avatarUrl: string | null;
  };
}

export const api = new ApiClient({
  baseUrl: API_URL,
  getAccessToken: () => useAuthStore.getState().accessToken,
  refreshAccessToken: async () => {
    const activeAccountId = useAuthStore.getState().activeAccountId;
    const response = await fetch(`${API_URL}/auth/refresh`, { method: 'POST', credentials: 'include' });
    const envelope = (await response.json()) as ApiEnvelope<AuthResponse>;
    if (!response.ok || envelope.error || !envelope.data) {
      useAuthStore.getState().clearAuth();
      return null;
    }
    if (activeAccountId && envelope.data.user.id !== activeAccountId) {
      useAuthStore.getState().clearAuth();
      return null;
    }
    useAuthStore.getState().setAuth(envelope.data.accessToken, envelope.data.user);
    return envelope.data.accessToken;
  },
  onUnauthorized: () => {
    useAuthStore.getState().clearAuth();
    if (typeof window !== 'undefined') window.location.href = '/login';
  },
});

export async function serverApi<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    cache: 'no-store',
  });
  const envelope = (await response.json()) as ApiEnvelope<T>;
  if (!response.ok || envelope.error) throw new Error(envelope.error?.message ?? 'API request failed');
  return envelope.data as T;
}
