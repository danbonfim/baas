import { Module } from '@nestjs/common'
import { SafetyController } from './safety.controller'
import { SafetyService } from './safety.service'
import { SafetyCronService } from './safety-cron.service'
import { ChatModule } from '../chat/chat.module'
import { AuthModule } from '../auth/auth.module'
import { BoostModule } from '../boost/boost.module'
import { ProSubscriptionModule } from '../pro-subscription/pro-subscription.module'
import { BookingsModule } from '../bookings/bookings.module'
import { PrismaService } from '../prisma.service'

@Module({
  imports: [ChatModule, AuthModule, BoostModule, ProSubscriptionModule, BookingsModule],
  controllers: [SafetyController],
  providers: [SafetyService, SafetyCronService, PrismaService],
  exports: [SafetyService],
})
export class SafetyModule {}
