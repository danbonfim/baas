import { Module } from '@nestjs/common'
import { PaymentsController } from './payments.controller'
import { PaymentsService } from './payments.service'
import { PrismaService } from '../prisma.service'
import { AuthModule } from '../auth/auth.module'
import { TipsModule } from '../tips/tips.module'
import { ContentModule } from '../content/content.module'
import { BoostModule } from '../boost/boost.module'
import { ProSubscriptionModule } from '../pro-subscription/pro-subscription.module'

@Module({
  imports: [AuthModule, TipsModule, ContentModule, BoostModule, ProSubscriptionModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, PrismaService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
