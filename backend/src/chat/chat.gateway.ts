import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'
import { ChatService } from './chat.service'
import { JwtService } from '@nestjs/jwt'

@WebSocketGateway({ cors: { origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server

  private userSockets = new Map<string, string>()

  constructor(
    private chatService: ChatService,
    private jwtService: JwtService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token as string
      const payload = this.jwtService.verify(token) as { sub: string }
      this.userSockets.set(payload.sub, client.id)
      client.data.userId = payload.sub
    } catch {
      client.disconnect()
    }
  }

  handleDisconnect(client: Socket) {
    if (client.data.userId) {
      this.userSockets.delete(client.data.userId as string)
    }
  }

  @SubscribeMessage('join_conversation')
  async joinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() conversationId: string,
  ) {
    await client.join(`conversation:${conversationId}`)
  }

  @SubscribeMessage('send_message')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; content: string; contentType?: string },
  ) {
    const senderId = client.data.userId as string
    const message = await this.chatService.sendMessage(
      data.conversationId,
      senderId,
      data.content,
      data.contentType,
    )

    this.server.to(`conversation:${data.conversationId}`).emit('new_message', message)
    return message
  }

  @SubscribeMessage('mark_read')
  async markRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() conversationId: string,
  ) {
    const userId = client.data.userId as string
    await this.chatService.markRead(conversationId, userId)
    client.to(`conversation:${conversationId}`).emit('messages_read', { userId, conversationId })
  }

  notifyUser(userId: string, event: string, data: unknown) {
    const socketId = this.userSockets.get(userId)
    if (socketId) {
      this.server.to(socketId).emit(event, data)
    }
  }
}
