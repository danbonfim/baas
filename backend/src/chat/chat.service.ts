import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma.service'

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async getOrCreateConversation(clientUserId: string, professionalProfileId: string) {
    const pro = await this.prisma.professional.findUnique({
      where: { id: professionalProfileId },
      select: { userId: true },
    })
    if (!pro) throw new NotFoundException('Profissional não encontrada')

    const conv = await this.prisma.conversation.upsert({
      where: { clientId_professionalId: { clientId: clientUserId, professionalId: pro.userId } },
      create: { clientId: clientUserId, professionalId: pro.userId },
      update: {},
      include: {
        messages: {
          where: this.notExpired(),
          orderBy: { createdAt: 'asc' },
          take: 50,
        },
      },
    })
    return conv
  }

  async getConversations(userId: string) {
    const convs = await this.prisma.conversation.findMany({
      where: { OR: [{ clientId: userId }, { professionalId: userId }] },
      include: {
        messages: {
          where: this.notExpired(),
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { lastMessageAt: 'desc' },
    })

    const enriched = await Promise.all(
      convs.map(async (conv) => {
        const partnerId = conv.clientId === userId ? conv.professionalId : conv.clientId
        const partner = await this.prisma.user.findUnique({
          where: { id: partnerId },
          select: { id: true, name: true, avatar: true },
        })
        const unreadCount = await this.prisma.message.count({
          where: {
            conversationId: conv.id,
            senderId: { not: userId },
            read: false,
            ...this.notExpired(),
          },
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
    // Filter out expired/deleted messages on read.
    return this.prisma.message.findMany({
      where: {
        conversationId,
        ...this.notExpired(),
      },
      orderBy: { createdAt: 'asc' },
    })
  }

  /**
   * @param ttlSeconds Optional. If provided, the message is auto-deleted after N seconds.
   *                   Standard values: 60 (1min), 3600 (1h), 86400 (24h).
   */
  async sendMessage(
    conversationId: string,
    senderId: string,
    content: string,
    contentType = 'text',
    ttlSeconds?: number,
  ) {
    const expiresAt = ttlSeconds && ttlSeconds > 0 ? new Date(Date.now() + ttlSeconds * 1000) : null

    const [message] = await this.prisma.$transaction([
      this.prisma.message.create({
        data: { conversationId, senderId, content, contentType, expiresAt },
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

  async deleteMessage(messageId: string, userId: string) {
    const msg = await this.prisma.message.findUnique({ where: { id: messageId } })
    if (!msg) throw new NotFoundException('Mensagem não encontrada')
    if (msg.senderId !== userId) throw new NotFoundException('Você só pode apagar mensagens próprias')

    return this.prisma.message.update({
      where: { id: messageId },
      data: { deleted: true, deletedAt: new Date(), content: '[mensagem apagada]' },
    })
  }

  /**
   * Cron-callable: hard-delete messages whose `expiresAt` has passed.
   * Returns number of messages purged.
   */
  async purgeExpiredMessages() {
    const result = await this.prisma.message.deleteMany({
      where: {
        expiresAt: { lt: new Date(), not: null },
      },
    })
    return { purged: result.count }
  }

  private notExpired(): any {
    return {
      AND: [
        { deleted: false },
        { OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
      ],
    }
  }
}
