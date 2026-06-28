'use client';

import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Trash2 } from 'lucide-react';
import { Button } from '@vora/ui';
import { AppShell } from '../../components/layout/app-shell';
import { api } from '../../lib/api';

interface ConversationPreview {
  id: string;
  isRequest: boolean;
  isUnread: boolean;
  user: { username: string; displayName: string; avatarUrl: string | null; isVerified: boolean } | null;
  latestMessage: { body: string | null; mediaUrl: string | null; createdAt: string; senderId: string } | null;
}

export default function MessagesPage() {
  const client = useQueryClient();
  const query = useQuery({ queryKey: ['messages'], queryFn: () => api.get<{ inbox: ConversationPreview[]; requests: ConversationPreview[] }>('/messages') });
  const refresh = async () => {
    await Promise.all([client.invalidateQueries({ queryKey: ['messages'] }), client.invalidateQueries({ queryKey: ['messages', 'unread-count'] })]);
  };
  return (
    <AppShell>
      <div className="border-b border-neutral-200 p-4"><h1 className="text-lg font-semibold">Mesajlar</h1><p className="mt-1 text-sm text-neutral-500">Sohbetler ve mesaj istekleri</p></div>
      {query.isLoading ? <p className="p-6 text-sm">Yükleniyor...</p> : null}
      <ConversationSection title="Gelen kutusu" conversations={query.data?.inbox ?? []} />
      <ConversationSection title="İstekler" conversations={query.data?.requests ?? []} request onRefresh={refresh} />
      {query.data && query.data.inbox.length === 0 && query.data.requests.length === 0 ? <p className="p-6 text-sm text-neutral-600">Konuşma yok.</p> : null}
    </AppShell>
  );
}

function ConversationSection({ title, conversations, request = false, onRefresh }: { title: string; conversations: ConversationPreview[]; request?: boolean; onRefresh?: () => Promise<void> }) {
  if (!conversations.length) return null;
  return (
    <section>
      <h2 className="px-4 pb-2 pt-5 text-sm font-semibold text-neutral-500">{title}</h2>
      {conversations.map((conversation) => {
        const user = conversation.user;
        return (
          <div key={conversation.id} className="flex items-center gap-3 border-b border-neutral-100 px-4 py-3 hover:bg-neutral-50">
            <Link href={`/messages/${conversation.id}`} className="focus-ring flex min-w-0 flex-1 items-center gap-3 rounded-md">
              <span className="relative shrink-0">
                <img src={user?.avatarUrl ?? `https://i.pravatar.cc/120?u=${user?.username ?? conversation.id}`} alt="" className="h-14 w-14 rounded-full object-cover" />
                {conversation.isUnread ? <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-cyan-600" /> : null}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className={`truncate ${conversation.isUnread ? 'font-bold' : 'font-semibold'}`}>{user?.displayName ?? 'Konuşma'}</span>
                  {user?.isVerified ? <span className="rounded-full bg-cyan-600 px-1 text-[10px] font-bold text-white">✓</span> : null}
                  {request ? <span className="rounded-full bg-cyan-50 px-2 py-0.5 text-xs font-medium text-cyan-700">İstek</span> : null}
                </span>
                <span className="block truncate text-sm text-neutral-500">@{user?.username ?? 'unknown'}</span>
                <span className={`mt-0.5 block truncate text-sm ${conversation.isUnread ? 'font-medium text-neutral-900' : 'text-neutral-600'}`}>{conversation.latestMessage?.body ?? (conversation.latestMessage?.mediaUrl ? 'Fotoğraf gönderildi' : 'Henüz mesaj yok')}</span>
              </span>
            </Link>
            {request ? (
              <div className="flex shrink-0 gap-2">
                <Button size="sm" onClick={async () => { await api.post(`/messages/${conversation.id}/accept`); await onRefresh?.(); }}><Check className="h-4 w-4" /> Kabul</Button>
                <Button size="sm" variant="secondary" onClick={async () => { await api.delete(`/messages/${conversation.id}`); await onRefresh?.(); }}><Trash2 className="h-4 w-4" /></Button>
              </div>
            ) : null}
          </div>
        );
      })}
    </section>
  );
}
