'use client';

import * as React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Textarea } from '@vora/ui';
import { api } from '../../lib/api';
import { useAuthStore } from '../../lib/auth-store';

export function CommentsThread({ contentId }: { contentId: string }) {
  const queryClient = useQueryClient();
  const token = useAuthStore((state) => state.accessToken);
  const [body, setBody] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const comments = useQuery({ queryKey: ['comments', contentId], queryFn: () => api.get<{ items: any[]; nextCursor: string | null }>(`/content/${contentId}/comments`) });
  return (
    <section id="comments" className="p-4">
      <h2 className="font-semibold">Yorumlar</h2>
      {token ? (
        <form
          className="mt-3 space-y-2"
          onSubmit={async (event) => {
            event.preventDefault();
            setError(null);
            try {
              await api.post(`/content/${contentId}/comments`, { body });
              setBody('');
              await queryClient.invalidateQueries({ queryKey: ['comments', contentId] });
            } catch (err) {
              setError((err as Error).message);
            }
          }}
        >
          <Textarea value={body} onChange={(event) => setBody(event.target.value)} placeholder="Yorum yaz" required />
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <Button type="submit" disabled={!body.trim()}>Yorum yap</Button>
        </form>
      ) : <p className="mt-2 text-sm text-neutral-600">Yorum yapmak için giriş yap.</p>}
      <div className="mt-4 space-y-4">
        {comments.isLoading ? <p className="text-sm text-neutral-600">Yorumlar yükleniyor...</p> : null}
        {(comments.data?.items ?? []).map((comment) => (
          <div key={comment.id} className="flex gap-3">
            <img src={comment.author.avatarUrl ?? `https://i.pravatar.cc/80?u=${comment.author.username}`} alt="" className="h-9 w-9 rounded-full" />
            <div className="min-w-0 text-sm">
              <p className="font-medium">{comment.author.displayName} <span className="font-normal text-neutral-500">@{comment.author.username}</span></p>
              <p className="mt-1 whitespace-pre-wrap leading-6">{comment.body}</p>
              <button
                className="focus-ring mt-1 rounded-md px-2 py-1 text-xs text-neutral-600 hover:bg-neutral-100"
                onClick={async () => {
                  if (!token) return;
                  await api.post(`/content/${contentId}/comments/${comment.id}/like`);
                  await queryClient.invalidateQueries({ queryKey: ['comments', contentId] });
                }}
              >
                Beğen · {comment.likeCount}
              </button>
            </div>
          </div>
        ))}
        {comments.data && comments.data.items.length === 0 ? <p className="text-sm text-neutral-600">İlk yorumu sen yaz.</p> : null}
      </div>
    </section>
  );
}
