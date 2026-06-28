'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AppShell } from '../../../components/layout/app-shell';
import { api } from '../../../lib/api';
import { Button, Input } from '@vora/ui';
import { getSocket } from '../../../lib/socket';
import { useAuthStore } from '../../../lib/auth-store';

export default function ConversationPage() {
  const params = useParams<{ conversationId: string }>();
  const router = useRouter();
  const client = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);
  const [body, setBody] = React.useState('');
  const query = useQuery({ queryKey: ['messages', params.conversationId], queryFn: () => api.get<any>(`/messages/${params.conversationId}`) });
  React.useEffect(() => {
    const socket = getSocket();
    socket.emit('conversation:join', params.conversationId);
    const refresh = () => void client.invalidateQueries({ queryKey: ['messages', params.conversationId] });
    socket.on('message:new', refresh);
    return () => {
      socket.off('message:new', refresh);
    };
  }, [client, params.conversationId]);
  React.useEffect(() => {
    if (!query.data?.messages?.length) return;
    if (query.data?.conversation?.isRequest) return;
    void api.post(`/messages/${params.conversationId}/read`).then(() => client.invalidateQueries({ queryKey: ['messages'] }));
  }, [client, params.conversationId, query.data?.conversation?.isRequest, query.data?.messages?.length]);
  const acceptRequest = async () => {
    await api.post(`/messages/${params.conversationId}/accept`);
    await Promise.all([query.refetch(), client.invalidateQueries({ queryKey: ['messages'] }), client.invalidateQueries({ queryKey: ['messages', 'unread-count'] })]);
  };
  const deleteConversation = async () => {
    await api.delete(`/messages/${params.conversationId}`);
    await client.invalidateQueries({ queryKey: ['messages'] });
    router.push('/messages');
  };
  const isRequest = Boolean(query.data?.conversation?.isRequest);
  return (
    <AppShell rightRail={false}>
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-neutral-200 bg-white/95 p-4 backdrop-blur">
        <img src={query.data?.conversation?.user?.avatarUrl ?? `https://i.pravatar.cc/120?u=${query.data?.conversation?.user?.username ?? params.conversationId}`} alt="" className="h-11 w-11 rounded-full object-cover" />
        <div className="min-w-0">
          <h1 className="truncate font-semibold">{query.data?.conversation?.user?.displayName ?? 'Konuşma'}</h1>
          <p className="truncate text-sm text-neutral-500">@{query.data?.conversation?.user?.username ?? 'unknown'}</p>
        </div>
      </div>
      {isRequest ? (
        <div className="border-b border-cyan-100 bg-cyan-50 px-4 py-3">
          <p className="text-sm font-medium text-cyan-900">Bu sohbet mesaj isteklerinden geliyor.</p>
          <p className="mt-1 text-sm text-cyan-800">Kabul edene kadar sohbet gelen kutuna taşınmaz ve cevap yazamazsın.</p>
          <div className="mt-3 flex gap-2">
            <Button size="sm" onClick={acceptRequest}>İsteği kabul et</Button>
            <Button size="sm" variant="secondary" onClick={deleteConversation}>Sil</Button>
          </div>
        </div>
      ) : null}
      <div className="min-h-[60vh] space-y-2 bg-neutral-50 p-4">
        {(query.data?.messages ?? []).map((message: any) => {
          const mine = message.senderId === currentUser?.id;
          return <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[78%] rounded-2xl px-4 py-2 text-sm shadow-sm ${mine ? 'bg-cyan-600 text-white' : 'border border-neutral-200 bg-white text-neutral-900'}`}>{message.body}</div></div>;
        })}
      </div>
      <form className="sticky bottom-16 flex gap-2 border-t border-neutral-200 bg-white p-3 md:bottom-0" onSubmit={async (event) => { event.preventDefault(); if (!body.trim() || isRequest) return; await api.post(`/messages/${params.conversationId}`, { body: body.trim() }); setBody(''); await client.invalidateQueries({ queryKey: ['messages', params.conversationId] }); }}>
        <Input value={body} onChange={(event) => setBody(event.target.value)} placeholder={isRequest ? 'Cevaplamak için önce isteği kabul et' : 'Mesaj yaz'} disabled={isRequest} />
        <Button type="submit" disabled={isRequest}>Gönder</Button>
      </form>
    </AppShell>
  );
}
