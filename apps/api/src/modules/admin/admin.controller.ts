import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AdminGuard } from '../../common/auth/admin.guard';
import { AuthGuard } from '../../common/auth/auth.guard';
import { AdminService } from './admin.service';

@ApiBearerAuth()
@ApiTags('admin')
@UseGuards(AuthGuard, AdminGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('dashboard')
  dashboard() {
    return this.admin.dashboard();
  }

  @Get('users')
  users() {
    return this.admin.users();
  }

  @Get('content')
  content() {
    return this.admin.content();
  }

  @Get('reports')
  reports() {
    return this.admin.reports();
  }

  @Get('comments')
  comments() {
    return this.admin.comments();
  }

  @Get('moderation')
  moderation() {
    return this.admin.moderationCases();
  }

  @Get('media')
  media() {
    return this.admin.media();
  }

  @Get('jobs')
  jobs() {
    return this.admin.jobs();
  }

  @Get('search')
  search() {
    return this.admin.searches();
  }

  @Get('trends')
  trends() {
    return this.admin.trends();
  }

  @Get('notifications')
  notifications() {
    return this.admin.notifications();
  }

  @Get('audit-logs')
  auditLogs() {
    return this.admin.auditLogs();
  }

  @Get('settings')
  settings() {
    return this.admin.flags();
  }
}
