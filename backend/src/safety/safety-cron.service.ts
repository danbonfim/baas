import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { SafetyService } from './safety.service'
import { ChatService } from '../chat/chat.service'
import { VerificationService } from '../auth/verification.service'
import { BoostService } from '../boost/boost.service'
import { ProSubscriptionService } from '../pro-subscription/pro-subscription.service'
import { BookingsService } from '../bookings/bookings.service'

@Injectable()
export class SafetyCronService {
  private readonly logger = new Logger(SafetyCronService.name)

  constructor(
    private safety: SafetyService,
    private chat: ChatService,
    private verification: VerificationService,
    private boost: BoostService,
    private proSubs: ProSubscriptionService,
    private bookings: BookingsService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async sendBookingReminders() {
    try {
      const r = await this.bookings.sendUpcomingReminders()
      if (r.reminded > 0) this.logger.log(`[BOOKINGS] Sent ${r.reminded} 24h reminders`)
    } catch (err) {
      this.logger.error('[BOOKINGS] Reminder cron failed', err)
    }
  }

  @Cron(CronExpression.EVERY_30_MINUTES)
  async expireBoosts() {
    try {
      const r = await this.boost.expireOldBoosts()
      if (r.expired > 0) this.logger.log(`[BOOST] Expired ${r.expired} old boosts`)
    } catch (err) {
      this.logger.error('[BOOST] Failed to expire boosts', err)
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  async expireSubscriptions() {
    try {
      const r = await this.proSubs.processExpiredSubscriptions()
      if (r.expired > 0) this.logger.log(`[PROSUB] Expired ${r.expired} subscriptions`)
    } catch (err) {
      this.logger.error('[PROSUB] Failed to expire subscriptions', err)
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  async purgeExpiredCodes() {
    try {
      const r = await this.verification.purgeExpired()
      if (r.purged > 0) this.logger.log(`[AUTH] Purged ${r.purged} expired verification codes`)
    } catch (err) {
      this.logger.error('[AUTH] Failed to purge expired codes', err)
    }
  }

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
