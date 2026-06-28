import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: { origin: ['http://localhost:3000', 'http://localhost:3002'], credentials: true } })
export class NotificationsGateway {
  @WebSocketServer()
  server!: Server;

  @SubscribeMessage('notifications:join')
  join(client: Socket, userId: string) {
    client.join(`user:${userId}`);
    return { ok: true };
  }

  emitToUser(userId: string, payload: unknown) {
    this.server.to(`user:${userId}`).emit('notification:new', payload);
  }
}
