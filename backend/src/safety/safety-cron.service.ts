import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { SafetyService } from './safety.service'
import { ChatService } from '../chat/chat.service'

@Injectable()
export class SafetyCronService {
  private readonly logger = new Logger(SafetyCronService.name)

  constructor(
    private safety: SafetyService,
    private chat: ChatService,
  ) {}

  /**
   * Every 5 minutes: find overdue safety check-ins and escalate.
   * Level 1: notification only
   * Level 2: notification + email/SMS
   * Level 3: alert emergency contacts
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async checkOverdue() {
    try {
      const result = await this.safety.processOverdueCheckins()
      if (result.escalatedCount > 0) {
        this.logger.warn(`[SAFETY] Escalated ${result.escalatedCount} overdue check-ins`)
      }
    } catch (err) {
      this.logger.error('[SAFETY] Failed to process overdue check-ins', err)
    }
  }

  /**
   * Every 10 minutes: purge expired messages (self-destructing chat).
   */
  @Cron(CronExpression.EVERY_10_MINUTES)
  async purgeExpired() {
    try {
      const result = await this.chat.purgeExpiredMessages()
      if (result.purged > 0) {
        this.logger.log(`[CHAT] Purged ${result.purged} expired messages`)
      }
    } catch (err) {
      this.logger.error('[CHAT] Failed to purge expired messages', err)
    }
  }
}
