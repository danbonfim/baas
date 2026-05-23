import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation, ApiBody } from '@nestjs/swagger'
import { ChatService } from './chat.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'

@ApiTags('Chat')
@Controller('chat')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ChatController {
  constructor(private service: ChatService) {}

  @Get('conversations')
  @ApiOperation({ summary: 'List my conversations' })
  conversations(@Request() req: any) {
    return this.service.getConversations(req.user.sub)
  }

  @Post('conversations')
  @ApiOperation({ summary: 'Get or create conversation with professional' })
  getOrCreate(@Body('professionalId') professionalId: string, @Request() req: any) {
    return this.service.getOrCreateConversation(req.user.sub, professionalId)
  }

  @Get('conversations/:id/messages')
  @ApiOperation({ summary: 'Get messages in conversation (excludes expired/deleted)' })
  getMessages(@Param('id') id: string) {
    return this.service.getMessages(id)
  }

  @Post('conversations/:id/messages')
  @ApiOperation({
    summary: 'Send message. Set ttlSeconds for self-destructing messages (60 = 1min, 3600 = 1h, 86400 = 24h).',
  })
  @ApiBody({
    schema: {
      properties: {
        content: { type: 'string' },
        ttlSeconds: { type: 'number', description: 'Optional: message auto-deletes after N seconds' },
      },
      required: ['content'],
    },
  })
  sendMessage(
    @Param('id') id: string,
    @Body() body: { content: string; ttlSeconds?: number },
    @Request() req: any,
  ) {
    return this.service.sendMessage(id, req.user.sub, body.content, 'text', body.ttlSeconds)
  }

  @Delete('messages/:messageId')
  @ApiOperation({ summary: 'Soft-delete a message (only your own)' })
  deleteMessage(@Param('messageId') messageId: string, @Request() req: any) {
    return this.service.deleteMessage(messageId, req.user.sub)
  }

  @Post('conversations/:id/read')
  @ApiOperation({ summary: 'Mark messages as read' })
  markRead(@Param('id') id: string, @Request() req: any) {
    return this.service.markRead(id, req.user.sub)
  }
}
