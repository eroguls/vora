'use client';

import { ApiClient } from '@vora/api-client';
import { useAdminAuthStore } from './auth-store';

export const api = new ApiClient({
  baseUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000',
  getAccessToken: () => useAdminAuthStore.getState().accessToken,
  onUnauthorized: () => useAdminAuthStore.getState().clearAuth(),
});
