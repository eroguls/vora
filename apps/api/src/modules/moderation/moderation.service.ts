import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { ModerationActionType, ReportReason } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ModerationService {
  constructor(private readonly prisma: PrismaService) {}

  async report(userId: string, body: { contentId?: string; reportedUserId?: string; reason: ReportReason; details?: string }) {
    if (!body.contentId && !body.reportedUserId) throw new BadRequestException('Content or user must be reported.');
    const report = await this.prisma.report.create({
      data: { reporterId: userId, contentId: body.contentId, reportedUserId: body.reportedUserId, reason: body.reason, details: body.details },
    });
    const moderationCase = await this.prisma.moderationCase.create({
      data: {
        reportId: report.id,
        contentId: body.contentId,
        userId: body.reportedUserId,
        summary: `${body.reason} report`,
      },
    });
    return { report, moderationCase };
  }

  async action(adminId: string, caseId: string, body: { type: ModerationActionType; note?: string }) {
    const moderationCase = await this.prisma.moderationCase.findUnique({ where: { id: caseId } });
    if (!moderationCase) throw new NotFoundException('Moderation case not found.');
    const action = await this.prisma.moderationAction.create({ data: { caseId, adminId, type: body.type, note: body.note } });
    if (body.type === 'HIDE_CONTENT' && moderationCase.contentId) {
      await this.prisma.content.update({ where: { id: moderationCase.contentId }, data: { status: 'HIDDEN' } });
    }
    if (body.type === 'RESTORE_CONTENT' && moderationCase.contentId) {
      await this.prisma.content.update({ where: { id: moderationCase.contentId }, data: { status: 'PUBLISHED' } });
    }
    if (body.type === 'TEMP_SUSPEND_USER' && moderationCase.userId) {
      await this.prisma.user.update({ where: { id: moderationCase.userId }, data: { status: 'SUSPENDED' } });
    }
    await this.prisma.moderationCase.update({ where: { id: caseId }, data: { status: body.type === 'DISMISS_REPORT' ? 'DISMISSED' : 'ACTIONED' } });
    await this.prisma.auditLog.create({ data: { actorId: adminId, action: body.type, entity: 'ModerationCase', entityId: caseId, metadata: { note: body.note } } });
    return action;
  }
}
