import { MessagingService } from '../src/modules/messaging/messaging.service';

describe('MessagingService', () => {
  const gateway = { emitMessage: jest.fn() };

  function service(prisma: any) {
    return new MessagingService(prisma, gateway as any);
  }

  it('separates accepted inbox conversations from message requests', async () => {
    const now = new Date('2026-01-01T12:00:00Z');
    const prisma = {
      conversation: {
        findMany: jest.fn().mockResolvedValue([
          conversation({ id: 'accepted', otherId: 'followed-user', lastReadAt: now, latestAt: now }),
          conversation({ id: 'request', otherId: 'stranger', lastReadAt: null, latestAt: now }),
        ]),
      },
      follow: { findMany: jest.fn().mockResolvedValue([{ followingId: 'followed-user' }]) },
    };

    const result = await service(prisma).list('viewer');

    expect(result.inbox.map((item) => item.id)).toEqual(['accepted']);
    expect(result.requests.map((item) => item.id)).toEqual(['request']);
    expect(result.requests[0].isUnread).toBe(true);
  });

  it('marks a request as accepted by updating lastReadAt', async () => {
    const prisma = {
      conversationMember: {
        findUnique: jest.fn().mockResolvedValue({ conversationId: 'c1', userId: 'viewer' }),
        update: jest.fn().mockResolvedValue({}),
      },
    };

    await service(prisma).accept('viewer', 'c1');

    expect(prisma.conversationMember.update).toHaveBeenCalledWith({
      where: { conversationId_userId: { conversationId: 'c1', userId: 'viewer' } },
      data: { lastReadAt: expect.any(Date) },
    });
  });
});

function conversation({ id, otherId, lastReadAt, latestAt }: { id: string; otherId: string; lastReadAt: Date | null; latestAt: Date }) {
  return {
    id,
    updatedAt: latestAt,
    members: [
      { userId: 'viewer', lastReadAt, user: user('viewer') },
      { userId: otherId, lastReadAt: null, user: user(otherId) },
    ],
    messages: [{ id: `${id}-message`, senderId: otherId, body: 'hello', mediaUrl: null, createdAt: latestAt }],
  };
}

function user(id: string) {
  return { id, username: id, displayName: id, isVerified: false, profile: { avatarUrl: null, bio: null } };
}
