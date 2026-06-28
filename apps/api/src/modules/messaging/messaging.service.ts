import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MessagingGateway } from './messaging.gateway';

@Injectable()
export class MessagingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: MessagingGateway,
  ) {}

  async list(userId: string) {
    const conversations = await this.prisma.conversation.findMany({
      where: { members: { some: { userId } } },
      include: { members: { include: { user: { include: { profile: true } } } }, messages: { orderBy: { createdAt: 'desc' }, take: 1 } },
      orderBy: { updatedAt: 'desc' },
    });
    const followed = await this.prisma.follow.findMany({ where: { followerId: userId }, select: { followingId: true } });
    const followingIds = new Set(followed.map((row) => row.followingId));
    const presented = conversations.map((conversation) => this.presentConversation(conversation, userId, followingIds));
    return {
      inbox: presented.filter((conversation) => !conversation.isRequest),
      requests: presented.filter((conversation) => conversation.isRequest),
    };
  }

  async start(userId: string, targetId: string) {
    if (userId === targetId) throw new BadRequestException('Cannot message yourself.');
    await this.ensureCanMessage(userId, targetId);
    const conversations = await this.prisma.conversation.findMany({ where: { members: { some: { userId } } }, include: { members: true } });
    const existing = conversations.find((conversation) => {
      const ids = conversation.members.map((member) => member.userId).sort();
      return ids.length === 2 && ids[0] === [userId, targetId].sort()[0] && ids[1] === [userId, targetId].sort()[1];
    });
    if (existing) return existing;
    return this.prisma.conversation.create({ data: { members: { create: [{ userId }, { userId: targetId }] } }, include: { members: true } });
  }

  async unreadCount(userId: string) {
    const memberships = await this.prisma.conversationMember.findMany({
      where: { userId },
      include: { conversation: { include: { messages: { orderBy: { createdAt: 'desc' }, take: 1 } } } },
    });
    const count = memberships.filter((member) => {
      const latest = member.conversation.messages[0];
      if (!latest || latest.senderId === userId) return false;
      return !member.lastReadAt || latest.createdAt > member.lastReadAt;
    }).length;
    return { count };
  }

  async messages(userId: string, conversationId: string) {
    await this.ensureMember(userId, conversationId);
    const [conversation, messages] = await Promise.all([
      this.prisma.conversation.findUnique({ where: { id: conversationId }, include: { members: { include: { user: { include: { profile: true } } } }, messages: { orderBy: { createdAt: 'desc' }, take: 1 } } }),
      this.prisma.message.findMany({
      where: { conversationId, deletedAt: null },
      include: { sender: { include: { profile: true } }, reads: true },
      orderBy: { createdAt: 'asc' },
      take: 100,
      }),
    ]);
    if (!conversation) throw new NotFoundException('Conversation not found.');
    const followed = await this.prisma.follow.findMany({ where: { followerId: userId }, select: { followingId: true } });
    return { conversation: this.presentConversation(conversation, userId, new Set(followed.map((row) => row.followingId))), messages };
  }

  async send(userId: string, conversationId: string, body: { body?: string; mediaUrl?: string }) {
    await this.ensureMember(userId, conversationId);
    if (!body.body && !body.mediaUrl) throw new BadRequestException('Message text or media is required.');
    const members = await this.prisma.conversationMember.findMany({ where: { conversationId } });
    const target = members.find((member) => member.userId !== userId);
    if (target) await this.ensureCanMessage(userId, target.userId);
    const message = await this.prisma.message.create({
      data: { conversationId, senderId: userId, body: body.body, mediaUrl: body.mediaUrl, type: body.mediaUrl ? 'PHOTO' : 'TEXT' },
      include: { sender: { include: { profile: true } } },
    });
    await this.prisma.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } });
    this.gateway.emitMessage(conversationId, message);
    return message;
  }

  async markRead(userId: string, conversationId: string) {
    await this.ensureMember(userId, conversationId);
    await this.prisma.conversationMember.update({ where: { conversationId_userId: { conversationId, userId } }, data: { lastReadAt: new Date() } });
    return { ok: true };
  }

  async accept(userId: string, conversationId: string) {
    await this.ensureMember(userId, conversationId);
    await this.prisma.conversationMember.update({ where: { conversationId_userId: { conversationId, userId } }, data: { lastReadAt: new Date() } });
    return { accepted: true };
  }

  async deleteConversation(userId: string, conversationId: string) {
    await this.ensureMember(userId, conversationId);
    await this.prisma.conversation.delete({ where: { id: conversationId } });
    return { deleted: true };
  }

  private async ensureMember(userId: string, conversationId: string) {
    const member = await this.prisma.conversationMember.findUnique({ where: { conversationId_userId: { conversationId, userId } } });
    if (!member) throw new NotFoundException('Conversation not found.');
  }

  private async ensureCanMessage(senderId: string, targetId: string) {
    const block = await this.prisma.block.findFirst({
      where: { OR: [{ blockerId: senderId, blockedId: targetId }, { blockerId: targetId, blockedId: senderId }] },
    });
    if (block) throw new ForbiddenException('Messaging is blocked between these users.');
  }

  private presentConversation(conversation: { id: string; updatedAt: Date; members: Array<{ userId: string; lastReadAt: Date | null; user: { id: string; username: string; displayName: string; isVerified: boolean; profile: { avatarUrl: string | null; bio: string | null } | null } }>; messages: Array<{ id: string; senderId: string; body: string | null; mediaUrl: string | null; createdAt: Date }> }, userId: string, followingIds: Set<string>) {
    const currentMember = conversation.members.find((member) => member.userId === userId);
    const other = conversation.members.find((member) => member.userId !== userId)?.user;
    const latestMessage = conversation.messages[0] ?? null;
    const isRequest = Boolean(latestMessage && latestMessage.senderId !== userId && !followingIds.has(latestMessage.senderId) && !currentMember?.lastReadAt);
    const isUnread = Boolean(latestMessage && latestMessage.senderId !== userId && (!currentMember?.lastReadAt || latestMessage.createdAt > currentMember.lastReadAt));
    return {
      id: conversation.id,
      updatedAt: conversation.updatedAt,
      isRequest,
      isUnread,
      user: other
        ? { id: other.id, username: other.username, displayName: other.displayName, avatarUrl: other.profile?.avatarUrl ?? null, bio: other.profile?.bio ?? null, isVerified: other.isVerified }
        : null,
      latestMessage,
    };
  }
}
