import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AdminGuard } from '../../common/auth/admin.guard';
import { AuthGuard } from '../../common/auth/auth.guard';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { RequestUser } from '../../common/auth/request-user';
import { ModerationService } from './moderation.service';

@ApiBearerAuth()
@ApiTags('moderation')
@Controller('moderation')
export class ModerationController {
  constructor(private readonly moderation: ModerationService) {}

  @UseGuards(AuthGuard)
  @Post('reports')
  report(@CurrentUser() user: RequestUser, @Body() body: any) {
    return this.moderation.report(user.id, body);
  }

  @UseGuards(AuthGuard, AdminGuard)
  @Post('cases/:id/actions')
  action(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() body: any) {
    return this.moderation.action(user.id, id, body);
  }
}
