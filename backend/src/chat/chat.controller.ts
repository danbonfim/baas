import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
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
    // req.user.sub = User.id of the current user (client)
    // professionalId = Professional.id (profile id) sent from frontend
    return this.service.getOrCreateConversation(req.user.sub, professionalId)
  }

  @Get('conversations/:id/messages')
  @ApiOperation({ summary: 'Get messages in conversation' })
  getMessages(@Param('id') id: string) {
    return this.service.getMessages(id)
  }

  @Post('conversations/:id/messages')
  @ApiOperation({ summary: 'Send message in conversation' })
  sendMessage(@Param('id') id: string, @Body('content') content: string, @Request() req: any) {
    return this.service.sendMessage(id, req.user.sub, content)
  }

  @Post('conversations/:id/read')
  @ApiOperation({ summary: 'Mark messages as read' })
  markRead(@Param('id') id: string, @Request() req: any) {
    return this.service.markRead(id, req.user.sub)
  }
}
