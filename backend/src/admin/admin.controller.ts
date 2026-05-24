import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Query, Headers, HttpCode } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation, ApiHeader } from '@nestjs/swagger'
import { AdminService } from './admin.service'
import { SeedService } from './seed.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { AdminGuard } from '../auth/admin.guard'

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

  @Post('create-admin')
  @HttpCode(200)
  @ApiOperation({ summary: '[ADMIN SECRET] Create or promote a user to ADMIN role' })
  @ApiHeader({ name: 'X-Admin-Secret', required: true })
  createAdmin(
    @Headers('x-admin-secret') secret: string,
    @Body() body: { email: string; name: string; password: string },
  ) {
    return this.seed.createAdmin(secret, body.email, body.name, body.password)
  }

  // ─── Regular admin endpoints (JWT-protected) ───────────

  @Get('stats')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Platform statistics' })
  stats() {
    return this.service.getPlatformStats()
  }

  @Get('kyc/pending')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List pending KYC verifications' })
  pendingKyc() {
    return this.service.getPendingKyc()
  }

  @Get('kyc/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get KYC review detail for a professional' })
  kycDetail(@Param('id') id: string) {
    return this.service.getKycDetail(id)
  }

  @Patch('kyc/:id/approve')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Approve KYC for professional' })
  approveKyc(@Param('id') id: string, @Body('level') level?: string) {
    return this.service.approveKyc(id, level)
  }

  @Patch('kyc/:id/reject')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reject KYC with reason' })
  rejectKyc(@Param('id') id: string, @Body('reason') reason: string) {
    return this.service.rejectKyc(id, reason)
  }

  @Patch('users/:id/ban')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ban user' })
  banUser(@Param('id') id: string, @Body('reason') reason: string) {
    return this.service.banUser(id, reason)
  }

  @Patch('users/:id/unban')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unban user' })
  unbanUser(@Param('id') id: string) {
    return this.service.unbanUser(id)
  }

  @Get('bookings/recent')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  recentBookings() {
    return this.service.getRecentBookings()
  }

  @Get('users')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  allUsers(@Query('page') page?: string) {
    return this.service.getAllUsers(page ? parseInt(page) : 1)
  }
}
