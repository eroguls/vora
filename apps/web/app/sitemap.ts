import type { MetadataRoute } from 'next';
import { API_URL } from '../lib/api';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.APP_URL ?? 'http://localhost:3000';
  const staticPages = ['', '/search', '/login', '/register', '/terms', '/privacy', '/community-guidelines'].map((path) => ({ url: `${base}${path}`, lastModified: new Date() }));
  try {
    const response = await fetch(`${API_URL}/feed`, { cache: 'no-store' });
    const envelope = await response.json();
    const contentPages = (envelope.data?.items ?? []).map((item: any) => ({ url: `${base}/@${item.author.username}/${item.slug}`, lastModified: item.updatedAt ? new Date(item.updatedAt) : new Date() }));
    const profilePages = Array.from(new Map((envelope.data?.items ?? []).map((item: any) => [item.author.username, item.author])).values()).map((author: any) => ({ url: `${base}/@${author.username}`, lastModified: new Date() }));
    return [...staticPages, ...profilePages, ...contentPages];
  } catch {
    return staticPages;
  }
}
