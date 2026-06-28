import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../../common/auth/auth.guard';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { RequestUser } from '../../common/auth/request-user';
import { InteractionService } from './interaction.service';

@ApiBearerAuth()
@ApiTags('interactions')
@UseGuards(AuthGuard)
@Controller('interactions')
export class InteractionController {
  constructor(private readonly interactions: InteractionService) {}

  @Post('content/:id/like')
  like(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.interactions.like(user.id, id);
  }

  @Delete('content/:id/like')
  unlike(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.interactions.unlike(user.id, id);
  }

  @Post('content/:id/bookmark')
  bookmark(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.interactions.bookmark(user.id, id);
  }

  @Delete('content/:id/bookmark')
  unbookmark(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.interactions.unbookmark(user.id, id);
  }

  @Post('content/:id/share')
  share(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() body: { quoteBody?: string }) {
    return this.interactions.share(user.id, id, body?.quoteBody);
  }

  @Get('saved')
  saved(@CurrentUser() user: RequestUser, @Query('cursor') cursor?: string) {
    return this.interactions.saved(user.id, cursor);
  }
}
