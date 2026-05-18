import { Module } from '@nestjs/common'
import { ProfessionalsController } from './professionals.controller'
import { ProfessionalsService } from './professionals.service'
import { PrismaService } from '../prisma.service'
import { AuthModule } from '../auth/auth.module'

@Module({
  imports: [AuthModule],
  controllers: [ProfessionalsController],
  providers: [ProfessionalsService, PrismaService],
  exports: [ProfessionalsService],
})
export class ProfessionalsModule {}
