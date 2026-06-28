import { Body, Controller, Delete, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../../common/auth/auth.guard';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { RequestUser } from '../../common/auth/request-user';
import { CommentsService } from './comments.service';

@ApiBearerAuth()
@ApiTags('comments')
@UseGuards(AuthGuard)
@Controller('content/:contentId/comments')
export class CommentsController {
  constructor(private readonly comments: CommentsService) {}

  @Post()
  create(@CurrentUser() user: RequestUser, @Param('contentId') contentId: string, @Body() body: unknown) {
    return this.comments.create(user.id, contentId, body);
  }

  @Post(':commentId/like')
  like(@CurrentUser() user: RequestUser, @Param('commentId') commentId: string) {
    return this.comments.like(user.id, commentId);
  }

  @Delete(':commentId/like')
  unlike(@CurrentUser() user: RequestUser, @Param('commentId') commentId: string) {
    return this.comments.unlike(user.id, commentId);
  }
}
