import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import { OptionalAuthGuard } from '../../common/auth/optional-auth.guard';
import type { RequestUser } from '../../common/auth/request-user';
import { AnalyticsService } from './analytics.service';

@ApiBearerAuth()
@ApiTags('analytics')
@UseGuards(OptionalAuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Post('track')
  track(@CurrentUser() user: RequestUser | undefined, @Body() body: any) {
    return this.analytics.track(user?.id, body);
  }
}
