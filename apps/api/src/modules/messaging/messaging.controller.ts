import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../../common/auth/auth.guard';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { RequestUser } from '../../common/auth/request-user';
import { MessagingService } from './messaging.service';

@ApiBearerAuth()
@ApiTags('messaging')
@UseGuards(AuthGuard)
@Controller('messages')
export class MessagingController {
  constructor(private readonly messaging: MessagingService) {}

  @Get()
  list(@CurrentUser() user: RequestUser) {
    return this.messaging.list(user.id);
  }

  @Get('unread-count')
  unreadCount(@CurrentUser() user: RequestUser) {
    return this.messaging.unreadCount(user.id);
  }

  @Post('start/:userId')
  start(@CurrentUser() user: RequestUser, @Param('userId') userId: string) {
    return this.messaging.start(user.id, userId);
  }

  @Get(':conversationId')
  messages(@CurrentUser() user: RequestUser, @Param('conversationId') conversationId: string) {
    return this.messaging.messages(user.id, conversationId);
  }

  @Post(':conversationId')
  send(@CurrentUser() user: RequestUser, @Param('conversationId') conversationId: string, @Body() body: { body?: string; mediaUrl?: string }) {
    return this.messaging.send(user.id, conversationId, body);
  }

  @Post(':conversationId/read')
  read(@CurrentUser() user: RequestUser, @Param('conversationId') conversationId: string) {
    return this.messaging.markRead(user.id, conversationId);
  }

  @Post(':conversationId/accept')
  accept(@CurrentUser() user: RequestUser, @Param('conversationId') conversationId: string) {
    return this.messaging.accept(user.id, conversationId);
  }

  @Delete(':conversationId')
  delete(@CurrentUser() user: RequestUser, @Param('conversationId') conversationId: string) {
    return this.messaging.deleteConversation(user.id, conversationId);
  }
}
