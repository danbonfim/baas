import { Module } from '@nestjs/common'
import { SafetyController } from './safety.controller'
import { SafetyService } from './safety.service'
import { SafetyCronService } from './safety-cron.service'
import { ChatModule } from '../chat/chat.module'
import { PrismaService } from '../prisma.service'

@Module({
  imports: [ChatModule],
  controllers: [SafetyController],
  providers: [SafetyService, SafetyCronService, PrismaService],
  exports: [SafetyService],
})
export class SafetyModule {}
