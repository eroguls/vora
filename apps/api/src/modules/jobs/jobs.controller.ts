import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../../common/auth/auth.guard';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { RequestUser } from '../../common/auth/request-user';
import { JobsService } from './jobs.service';

@ApiBearerAuth()
@ApiTags('jobs')
@UseGuards(AuthGuard)
@Controller('jobs')
export class JobsController {
  constructor(private readonly jobs: JobsService) {}

  @Get()
  list(@CurrentUser() user: RequestUser) {
    return this.jobs.list(user.id);
  }

  @Post(':id/retry')
  retry(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.jobs.retry(user.id, id);
  }

  @Post('process-pending')
  processPending() {
    return this.jobs.processPending();
  }
}
