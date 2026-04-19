import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

interface SyncData {
  bookingId: string;
  [key: string]: any;
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @MessageBody() bookingId: string,
    @ConnectedSocket() client: Socket,
  ) {
    void client.join(bookingId);
    console.log(`Client ${client.id} joined room ${bookingId}`);
  }

  @SubscribeMessage('sendMessage')
  handleMessage(
    @MessageBody() data: { bookingId: string; sender: string; text: string },
    @ConnectedSocket() client: Socket,
  ) {
    console.log(
      `Message from ${data.sender} in room ${data.bookingId}: ${data.text}`,
    );
    // Broadcast message to everyone in the room except the sender
    client.to(data.bookingId).emit('receiveMessage', {
      sender: data.sender,
      text: data.text,
      time: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    });
  }

  @SubscribeMessage('draw')
  handleDraw(@MessageBody() data: SyncData, @ConnectedSocket() client: Socket) {
    void client.to(data.bookingId).emit('draw', data);
  }

  @SubscribeMessage('syncDocument')
  handleSyncDocument(
    @MessageBody() data: SyncData,
    @ConnectedSocket() client: Socket,
  ) {
    void client.to(data.bookingId).emit('syncDocument', data);
  }

  @SubscribeMessage('starRewarded')
  handleStarRewarded(
    @MessageBody() data: { bookingId: string },
    @ConnectedSocket() client: Socket,
  ) {
    void client.to(data.bookingId).emit('starRewarded', data);
  }
}
