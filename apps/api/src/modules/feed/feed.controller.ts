import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import { OptionalAuthGuard } from '../../common/auth/optional-auth.guard';
import type { RequestUser } from '../../common/auth/request-user';
import { FeedService } from './feed.service';

@ApiTags('feed')
@Controller('feed')
export class FeedController {
  constructor(private readonly feed: FeedService) {}

  @ApiBearerAuth()
  @UseGuards(OptionalAuthGuard)
  @Get()
  global(@Query('cursor') cursor?: string, @CurrentUser() user?: RequestUser) {
    return this.feed.global(cursor, user?.id);
  }
}
