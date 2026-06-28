import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import { OptionalAuthGuard } from '../../common/auth/optional-auth.guard';
import type { RequestUser } from '../../common/auth/request-user';
import { UsersService } from './users.service';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @ApiBearerAuth()
  @UseGuards(OptionalAuthGuard)
  @Get('suggestions')
  suggestions(@CurrentUser() user?: RequestUser) {
    return this.users.suggestions(user?.id);
  }
}
