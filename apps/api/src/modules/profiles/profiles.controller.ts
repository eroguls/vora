import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../../common/auth/auth.guard';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import { OptionalAuthGuard } from '../../common/auth/optional-auth.guard';
import type { RequestUser } from '../../common/auth/request-user';
import { ProfilesService } from './profiles.service';

@ApiTags('profiles')
@Controller('profiles')
export class ProfilesController {
  constructor(private readonly profiles: ProfilesService) {}

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get('me')
  me(@CurrentUser() user: RequestUser) {
    return this.profiles.me(user.id);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Patch('me')
  update(@CurrentUser() user: RequestUser, @Body() body: unknown) {
    return this.profiles.update(user.id, body);
  }

  @ApiBearerAuth()
  @UseGuards(OptionalAuthGuard)
  @Get(':username/followers')
  followers(@Param('username') username: string, @CurrentUser() user?: RequestUser) {
    return this.profiles.followers(username, user?.id);
  }

  @ApiBearerAuth()
  @UseGuards(OptionalAuthGuard)
  @Get(':username/following')
  following(@Param('username') username: string, @CurrentUser() user?: RequestUser) {
    return this.profiles.following(username, user?.id);
  }

  @ApiBearerAuth()
  @UseGuards(OptionalAuthGuard)
  @Get(':username')
  publicProfile(@Param('username') username: string, @CurrentUser() user?: RequestUser) {
    return this.profiles.publicProfile(username, user?.id);
  }
}
