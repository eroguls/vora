import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async dashboard() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [totalUsers, activeUsers, newUsers, totalContent, contentTypes, dailyMedia, openReports, failedProcessing, searchCount, topQueries] = await Promise.all([
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.user.count({ where: { status: 'ACTIVE', lastSeenAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } }),
      this.prisma.user.count({ where: { createdAt: { gte: today } } }),
      this.prisma.content.count({ where: { deletedAt: null } }),
      this.prisma.content.groupBy({ by: ['contentType'], _count: true }),
      this.prisma.media.count({ where: { createdAt: { gte: today } } }),
      this.prisma.report.count({ where: { status: { in: ['OPEN', 'REVIEWING'] } } }),
      this.prisma.processingJob.count({ where: { status: 'FAILED' } }),
      this.prisma.searchQuery.count(),
      this.prisma.searchQuery.groupBy({ by: ['query'], _count: true, orderBy: { _count: { query: 'desc' } }, take: 8 }),
    ]);
    return { totalUsers, activeUsers, newUsers, totalContent, contentTypes, dailyMedia, openReports, failedProcessing, searchCount, topQueries };
  }

  users() {
    return this.prisma.user.findMany({ include: { profile: true }, orderBy: { createdAt: 'desc' }, take: 100 });
  }

  content() {
    return this.prisma.content.findMany({ include: { author: true, media: true }, orderBy: { createdAt: 'desc' }, take: 100 });
  }

  reports() {
    return this.prisma.report.findMany({ include: { reporter: true, content: true, reportedUser: true }, orderBy: { createdAt: 'desc' }, take: 100 });
  }

  comments() {
    return this.prisma.comment.findMany({ include: { author: true, content: true }, orderBy: { createdAt: 'desc' }, take: 100 });
  }

  moderationCases() {
    return this.prisma.moderationCase.findMany({ include: { report: true, content: true, user: true, actions: true }, orderBy: { createdAt: 'desc' }, take: 100 });
  }

  media() {
    return this.prisma.media.findMany({ include: { owner: true, content: true }, orderBy: { createdAt: 'desc' }, take: 100 });
  }

  jobs() {
    return this.prisma.processingJob.findMany({ orderBy: { createdAt: 'desc' }, take: 100 });
  }

  searches() {
    return this.prisma.searchQuery.findMany({ orderBy: { createdAt: 'desc' }, take: 100 });
  }

  async trends() {
    const [contentTypes, topQueries, topHashtags, topContent] = await Promise.all([
      this.prisma.content.groupBy({ by: ['contentType'], _count: true, orderBy: { _count: { contentType: 'desc' } } }),
      this.prisma.searchQuery.groupBy({ by: ['query'], _count: true, orderBy: { _count: { query: 'desc' } }, take: 20 }),
      this.prisma.hashtag.findMany({ include: { _count: { select: { contents: true } } }, orderBy: { contents: { _count: 'desc' } }, take: 20 }),
      this.prisma.content.findMany({ include: { author: true }, orderBy: [{ viewCount: 'desc' }, { likeCount: 'desc' }], take: 20 }),
    ]);
    return { contentTypes, topQueries, topHashtags, topContent };
  }

  notifications() {
    return this.prisma.notification.findMany({ include: { recipient: true, actor: true, content: true }, orderBy: { createdAt: 'desc' }, take: 100 });
  }

  auditLogs() {
    return this.prisma.auditLog.findMany({ include: { actor: true }, orderBy: { createdAt: 'desc' }, take: 100 });
  }

  flags() {
    return this.prisma.featureFlag.findMany({ orderBy: { key: 'asc' } });
  }
}
