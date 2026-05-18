import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma.service'

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  // clientUserId  = User.id of the client
  // professionalProfileId = Professional.id (profile id sent from frontend)
  async getOrCreateConversation(clientUserId: string, professionalProfileId: string) {
    // Look up the professional's User ID from their profile ID
    const pro = await this.prisma.professional.findUnique({
      where: { id: professionalProfileId },
      select: { userId: true },
    })
    if (!pro) throw new NotFoundException('Profissional não encontrada')

    const professionalUserId = pro.userId

    const conv = await this.prisma.conversation.upsert({
      where: { clientId_professionalId: { clientId: clientUserId, professionalId: professionalUserId } },
      create: { clientId: clientUserId, professionalId: professionalUserId },
      update: {},
      include: {
        messages: { orderBy: { createdAt: 'asc' }, take: 50 },
      },
    })
    return conv
  }

  async getConversations(userId: string) {
    const convs = await this.prisma.conversation.findMany({
      where: { OR: [{ clientId: userId }, { professionalId: userId }] },
      include: {
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { lastMessageAt: 'desc' },
    })

    // Enrich with partner names and avatars
    const enriched = await Promise.all(
      convs.map(async (conv) => {
        const partnerId = conv.clientId === userId ? conv.professionalId : conv.clientId
        const partner = await this.prisma.user.findUnique({
          where: { id: partnerId },
          select: { id: true, name: true, avatar: true },
        })
        const unreadCount = await this.prisma.message.count({
          where: { conversationId: conv.id, senderId: { not: userId }, read: false },
        })
        return {
          ...conv,
          partner: partner ?? { id: partnerId, name: 'Usuário', avatar: null },
          unreadCount,
        }
      }),
    )
    return enriched
  }

  async getMessages(conversationId: string) {
    return this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
    })
  }

  async sendMessage(conversationId: string, senderId: string, content: string, contentType = 'text') {
    const [message] = await this.prisma.$transaction([
      this.prisma.message.create({
        data: { conversationId, senderId, content, contentType },
      }),
      this.prisma.conversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: new Date() },
      }),
    ])
    return message
  }

  async markRead(conversationId: string, userId: string) {
    return this.prisma.message.updateMany({
      where: { conversationId, senderId: { not: userId }, read: false },
      data: { read: true, readAt: new Date() },
    })
  }
}
