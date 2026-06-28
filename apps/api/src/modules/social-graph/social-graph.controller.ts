import { Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../../common/auth/auth.guard';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { RequestUser } from '../../common/auth/request-user';
import { SocialGraphService } from './social-graph.service';

@ApiBearerAuth()
@ApiTags('social graph')
@UseGuards(AuthGuard)
@Controller('social')
export class SocialGraphController {
  constructor(private readonly social: SocialGraphService) {}

  @Get('blocks')
  blocks(@CurrentUser() user: RequestUser) {
    return this.social.blocks(user.id);
  }

  @Get('mutes')
  mutes(@CurrentUser() user: RequestUser) {
    return this.social.mutes(user.id);
  }

  @Post('follow/:id')
  follow(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.social.follow(user.id, id);
  }

  @Delete('follow/:id')
  unfollow(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.social.unfollow(user.id, id);
  }

  @Post('block/:id')
  block(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.social.block(user.id, id);
  }

  @Delete('block/:id')
  unblock(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.social.unblock(user.id, id);
  }

  @Post('mute/:id')
  mute(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.social.mute(user.id, id);
  }

  @Delete('mute/:id')
  unmute(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.social.unmute(user.id, id);
  }
}
