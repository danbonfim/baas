import { Module } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { ConfigModule } from '@nestjs/config'
import { ScheduleModule } from '@nestjs/schedule'
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler'
import { PrismaService } from './prisma.service'
import { AuthModule } from './auth/auth.module'
import { UsersModule } from './users/users.module'
import { ProfessionalsModule } from './professionals/professionals.module'
import { BookingsModule } from './bookings/bookings.module'
import { PaymentsModule } from './payments/payments.module'
import { SubscriptionsModule } from './subscriptions/subscriptions.module'
import { ChatModule } from './chat/chat.module'
import { AdminModule } from './admin/admin.module'
import { ReviewsModule } from './reviews/reviews.module'
import { NotificationsModule } from './notifications/notifications.module'
import { SafetyModule } from './safety/safety.module'
import { KycModule } from './kyc/kyc.module'
import { EmailModule } from './email/email.module'
import { BoostModule } from './boost/boost.module'
import { TipsModule } from './tips/tips.module'
import { ContentModule } from './content/content.module'
import { ProSubscriptionModule } from './pro-subscription/pro-subscription.module'
import { DiscoveryModule } from './discovery/discovery.module'
import { ProToolsModule } from './pro-tools/pro-tools.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EmailModule,
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([
      // Global default: 100 requests per minute per IP
      { name: 'default', ttl: 60_000, limit: 100 },
      // Tighter limit for sensitive endpoints (login, mfa, panic) — applied per-route via @Throttle
      { name: 'sensitive', ttl: 60_000, limit: 10 },
    ]),
    AuthModule,
    UsersModule,
    ProfessionalsModule,
    BookingsModule,
    PaymentsModule,
    SubscriptionsModule,
    ChatModule,
    AdminModule,
    ReviewsModule,
    NotificationsModule,
    SafetyModule,
    KycModule,
    BoostModule,
    TipsModule,
    ContentModule,
    ProSubscriptionModule,
    DiscoveryModule,
    ProToolsModule,
  ],
  providers: [
    PrismaService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
  exports: [PrismaService],
})
export class AppModule {}
