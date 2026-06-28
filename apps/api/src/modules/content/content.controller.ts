import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../../common/auth/auth.guard';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import { OptionalAuthGuard } from '../../common/auth/optional-auth.guard';
import type { RequestUser } from '../../common/auth/request-user';
import { ContentService } from './content.service';

@ApiTags('content')
@Controller('content')
export class ContentController {
  constructor(private readonly content: ContentService) {}

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Post()
  create(@CurrentUser() user: RequestUser, @Body() body: unknown) {
    return this.content.create(user.id, body);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Patch(':id')
  update(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() body: unknown) {
    return this.content.update(user.id, id, body);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Delete(':id')
  delete(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.content.delete(user.id, id);
  }

  @ApiBearerAuth()
  @UseGuards(OptionalAuthGuard)
  @Get('id/:id')
  byId(@Param('id') id: string, @CurrentUser() user?: RequestUser) {
    return this.content.getById(id, user?.id);
  }

  @ApiBearerAuth()
  @UseGuards(OptionalAuthGuard)
  @Get('handle/:username/:slug')
  byHandle(@Param('username') username: string, @Param('slug') slug: string, @CurrentUser() user?: RequestUser) {
    return this.content.getByHandle(username, slug, user?.id);
  }

  @ApiBearerAuth()
  @UseGuards(OptionalAuthGuard)
  @Get('author/:username')
  byAuthor(@Param('username') username: string, @Query('cursor') cursor?: string, @CurrentUser() user?: RequestUser) {
    return this.content.listByAuthor(username, cursor, user?.id);
  }

  @Get(':id/comments')
  comments(@Param('id') id: string, @Query('cursor') cursor?: string) {
    return this.content.comments(id, cursor);
  }
}
