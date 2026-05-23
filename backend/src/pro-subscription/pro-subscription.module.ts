import { Module } from '@nestjs/common'
import { ProSubscriptionController } from './pro-subscription.controller'
import { ProSubscriptionService } from './pro-subscription.service'
import { PrismaService } from '../prisma.service'

@Module({
  controllers: [ProSubscriptionController],
  providers: [ProSubscriptionService, PrismaService],
  exports: [ProSubscriptionService],
})
export class ProSubscriptionModule {}
