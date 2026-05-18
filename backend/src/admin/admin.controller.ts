import { Controller, Get, Patch, Param, Body, UseGuards, Query } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { AdminService } from './admin.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(private service: AdminService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Platform statistics' })
  stats() {
    return this.service.getPlatformStats()
  }

  @Get('kyc/pending')
  @ApiOperation({ summary: 'List pending KYC verifications' })
  pendingKyc() {
    return this.service.getPendingKyc()
  }

  @Patch('kyc/:id/approve')
  @ApiOperation({ summary: 'Approve KYC for professional' })
  approveKyc(@Param('id') id: string) {
    return this.service.approveKyc(id)
  }

  @Patch('users/:id/ban')
  @ApiOperation({ summary: 'Ban user' })
  banUser(@Param('id') id: string, @Body('reason') reason: string) {
    return this.service.banUser(id, reason)
  }

  @Get('bookings/recent')
  recentBookings() {
    return this.service.getRecentBookings()
  }

  @Get('users')
  allUsers(@Query('page') page?: string) {
    return this.service.getAllUsers(page ? parseInt(page) : 1)
  }
}
