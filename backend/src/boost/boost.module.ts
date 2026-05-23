import { Module } from '@nestjs/common'
import { BoostController } from './boost.controller'
import { BoostService } from './boost.service'
import { PrismaService } from '../prisma.service'

@Module({
  controllers: [BoostController],
  providers: [BoostService, PrismaService],
  exports: [BoostService],
})
export class BoostModule {}
