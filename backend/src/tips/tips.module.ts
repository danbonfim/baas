import { Module } from '@nestjs/common'
import { TipsController } from './tips.controller'
import { TipsService } from './tips.service'
import { PrismaService } from '../prisma.service'

@Module({
  controllers: [TipsController],
  providers: [TipsService, PrismaService],
  exports: [TipsService],
})
export class TipsModule {}
