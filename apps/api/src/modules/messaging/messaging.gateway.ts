import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: { origin: ['http://localhost:3000', 'http://localhost:3002'], credentials: true } })
export class MessagingGateway {
  @WebSocketServer()
  server!: Server;

  @SubscribeMessage('conversation:join')
  join(client: Socket, conversationId: string) {
    client.join(`conversation:${conversationId}`);
    return { ok: true };
  }

  emitMessage(conversationId: string, payload: unknown) {
    this.server.to(`conversation:${conversationId}`).emit('message:new', payload);
  }
}
