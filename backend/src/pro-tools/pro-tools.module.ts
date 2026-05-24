import { Module } from '@nestjs/common'
import { ProToolsController } from './pro-tools.controller'
import { ProToolsService } from './pro-tools.service'
import { PrismaService } from '../prisma.service'

@Module({
  controllers: [ProToolsController],
  providers: [ProToolsService, PrismaService],
  exports: [ProToolsService],
})
export class ProToolsModule {}
