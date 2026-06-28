import type { ApiEnvelope } from '@vora/types';

export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

export interface ApiClientOptions {
  baseUrl: string;
  getAccessToken?: () => string | null | undefined;
  refreshAccessToken?: () => Promise<string | null | undefined>;
  onUnauthorized?: () => void;
}

export class ApiClient {
  constructor(private readonly options: ApiClientOptions) {}

  async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    return this.requestWithAuth<T>(path, init, false);
  }

  private async requestWithAuth<T>(path: string, init: RequestInit = {}, retried: boolean): Promise<T> {
    const headers = new Headers(init.headers);
    if (!headers.has('Content-Type') && init.body) headers.set('Content-Type', 'application/json');
    const token = this.options.getAccessToken?.();
    if (token) headers.set('Authorization', `Bearer ${token}`);

    const response = await fetch(`${this.options.baseUrl}${path}`, {
      ...init,
      headers,
      credentials: 'include',
    });

    const envelope = (await response.json()) as ApiEnvelope<T>;
    if (!response.ok || envelope.error) {
      if (response.status === 401 && !retried && this.options.refreshAccessToken && !path.startsWith('/auth/')) {
        const nextToken = await this.options.refreshAccessToken();
        if (nextToken) return this.requestWithAuth<T>(path, init, true);
      }
      if (response.status === 401) this.options.onUnauthorized?.();
      throw new ApiClientError(
        envelope.error?.message ?? response.statusText,
        envelope.error?.code ?? 'HTTP_ERROR',
        response.status,
      );
    }

    return envelope.data as T;
  }

  get<T>(path: string): Promise<T> {
    return this.request<T>(path);
  }

  post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined });
  }

  patch<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined });
  }

  delete<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'DELETE' });
  }
}
