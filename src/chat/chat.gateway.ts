import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

// 🔹 Types
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

  // ✅ JOIN ROOM
  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @MessageBody() bookingId: string,
    @ConnectedSocket() client: Socket,
  ) {
    void client.join(bookingId);
    console.log(`Client ${client.id} joined room ${bookingId}`);
  }

  // ✅ CHAT
  @SubscribeMessage('sendMessage')
  handleMessage(
    @MessageBody() data: { bookingId: string; sender: string; text: string },
    @ConnectedSocket() client: Socket,
  ) {
    console.log(
      `Message from ${data.sender} in room ${data.bookingId}: ${data.text}`,
    );

    client.to(data.bookingId).emit('receiveMessage', {
      sender: data.sender,
      text: data.text,
      time: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    });
  }

  // ✅ WHITEBOARD DRAW
  @SubscribeMessage('draw')
  handleDraw(@MessageBody() data: SyncData, @ConnectedSocket() client: Socket) {
    client.to(data.bookingId).emit('draw', data);
  }

  // ✅ DOCUMENT SYNC (PDF, etc.)
  @SubscribeMessage('syncDocument')
  handleSyncDocument(
    @MessageBody() data: SyncData,
    @ConnectedSocket() client: Socket,
  ) {
    client.to(data.bookingId).emit('syncDocument', data);
  }

  // ✅ STAR REWARD
  @SubscribeMessage('starRewarded')
  handleStarRewarded(
    @MessageBody() data: { bookingId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.to(data.bookingId).emit('starRewarded', data);
  }

  @SubscribeMessage('genially:pageChange')
  handleGeniallyPageChange(
    @MessageBody() data: { bookingId: string; url: string },
    @ConnectedSocket() client: Socket,
  ) {
    // Broadcast à TOUT le room (teacher inclus pour confirmation)
    client.to(data.bookingId).emit('genially:pageChange', data);
  }

  @SubscribeMessage('session:end')
  handleSessionEnd(
    @MessageBody() data: { bookingId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.to(data.bookingId).emit('session:end');
  }
}
