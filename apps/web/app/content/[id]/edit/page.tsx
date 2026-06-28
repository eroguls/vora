'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import type { FeedContent } from '@vora/types';
import { Button, Input, Textarea } from '@vora/ui';
import { AppShell } from '../../../../components/layout/app-shell';
import { api } from '../../../../lib/api';

export default function EditContentPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [message, setMessage] = React.useState<string | null>(null);
  const content = useQuery({ queryKey: ['content-edit', params.id], queryFn: () => api.get<FeedContent>(`/content/id/${params.id}`) });

  return (
    <AppShell rightRail={false}>
      <div className="border-b border-neutral-200 p-4">
        <h1 className="text-lg font-semibold">İçeriği düzenle</h1>
      </div>
      {content.isLoading ? <p className="p-4 text-sm text-neutral-600">Yükleniyor...</p> : null}
      {content.isError ? <p className="p-4 text-sm text-red-600">İçerik yüklenemedi.</p> : null}
      {content.data ? (
        <form
          className="space-y-4 p-4"
          onSubmit={async (event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            setMessage(null);
            const updated = await api.patch<FeedContent>(`/content/${params.id}`, {
              title: form.get('title') || null,
              body: form.get('body') || null,
              visibility: form.get('visibility') || 'PUBLIC',
              language: form.get('language') || content.data.language,
            });
            setMessage('İçerik güncellendi.');
            router.push(`/@${updated.author.username}/${updated.slug}`);
          }}
        >
          <label className="block text-sm font-medium">
            Başlık
            <Input className="mt-1" name="title" defaultValue={content.data.title ?? ''} />
          </label>
          <label className="block text-sm font-medium">
            İçerik
            <Textarea className="mt-1" name="body" rows={10} defaultValue={content.data.body ?? ''} />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              Görünürlük
              <select name="visibility" defaultValue={content.data.visibility} className="focus-ring mt-1 h-10 w-full rounded-md border border-neutral-300 bg-white px-3">
                <option value="PUBLIC">Herkese açık</option>
                <option value="FOLLOWERS">Takipçiler</option>
                <option value="UNLISTED">Bağlantı ile</option>
                <option value="PRIVATE">Gizli</option>
              </select>
            </label>
            <label className="text-sm">
              Dil
              <select name="language" defaultValue={content.data.language} className="focus-ring mt-1 h-10 w-full rounded-md border border-neutral-300 bg-white px-3">
                <option value="tr">Türkçe</option>
                <option value="en">English</option>
              </select>
            </label>
          </div>
          {message ? <p className="text-sm text-cyan-700">{message}</p> : null}
          <div className="flex gap-2">
            <Button type="submit">Kaydet</Button>
            <Button type="button" variant="secondary" onClick={() => router.back()}>Vazgeç</Button>
          </div>
        </form>
      ) : null}
    </AppShell>
  );
}
