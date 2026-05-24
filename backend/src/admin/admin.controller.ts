import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Query, Headers, HttpCode } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation, ApiHeader } from '@nestjs/swagger'
import { AdminService } from './admin.service'
import { SeedService } from './seed.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'

@ApiTags('Admin')
@Controller('admin')
export class AdminController {
  constructor(private service: AdminService, private seed: SeedService) {}

  // ─── Demo seeding (header-secret auth, no JWT) ─────────

  @Post('seed-demo')
  @HttpCode(200)
  @ApiOperation({ summary: '[ADMIN SECRET] Seed 10 demo professional profiles (idempotent)' })
  @ApiHeader({ name: 'X-Admin-Secret', required: true })
  seedDemo(@Headers('x-admin-secret') secret: string) {
    return this.seed.seedDemoData(secret)
  }

  @Delete('wipe-demo')
  @ApiOperation({ summary: '[ADMIN SECRET] Wipe all demo profiles (@demo.baas.app)' })
  @ApiHeader({ name: 'X-Admin-Secret', required: true })
  wipeDemo(@Headers('x-admin-secret') secret: string) {
    return this.seed.wipeDemoData(secret)
  }

  // ─── Regular admin endpoints (JWT-protected) ───────────

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Platform statistics' })
  stats() {
    return this.service.getPlatformStats()
  }

  @Get('kyc/pending')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List pending KYC verifications' })
  pendingKyc() {
    return this.service.getPendingKyc()
  }

  @Patch('kyc/:id/approve')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Approve KYC for professional' })
  approveKyc(@Param('id') id: string) {
    return this.service.approveKyc(id)
  }

  @Patch('users/:id/ban')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ban user' })
  banUser(@Param('id') id: string, @Body('reason') reason: string) {
    return this.service.banUser(id, reason)
  }

  @Get('bookings/recent')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  recentBookings() {
    return this.service.getRecentBookings()
  }

  @Get('users')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  allUsers(@Query('page') page?: string) {
    return this.service.getAllUsers(page ? parseInt(page) : 1)
  }
}
