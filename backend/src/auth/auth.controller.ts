import { Controller, Post, Body, Get, UseGuards, Request, HttpCode, Req, Ip } from '@nestjs/common'
import { Throttle } from '@nestjs/throttler'
import { ApiTags, ApiBearerAuth, ApiOperation, ApiBody } from '@nestjs/swagger'
import { AuthService } from './auth.service'
import { MfaService } from './mfa.service'
import { RegisterDto } from './dto/register.dto'
import { LoginDto } from './dto/login.dto'
import { JwtAuthGuard } from './jwt-auth.guard'

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService, private mfa: MfaService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register new user (client or professional)' })
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto)
  }

  @Post('login')
  @HttpCode(200)
  @Throttle({ sensitive: { limit: 10, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Login (returns { mfaRequired: true } if MFA is enabled and mfaToken not provided). Rate-limited: 10 req/min.',
  })
  login(@Body() dto: LoginDto, @Req() req: any, @Ip() ip: string) {
    return this.auth.login(dto, ip, req.headers['user-agent'])
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get authenticated user profile' })
  me(@Request() req: any) {
    return this.auth.me(req.user.sub)
  }

  // ─── MFA Endpoints ──────────────────────────────

  @Post('mfa/setup')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Step 1 of MFA setup — returns secret + QR code data URL' })
  mfaSetup(@Request() req: any) {
    return this.mfa.generateSecret(req.user.sub)
  }

  @Post('mfa/enable')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Step 2 of MFA setup — confirm TOTP code to activate MFA. Returns 10 one-time backup codes.' })
  @ApiBody({ schema: { properties: { token: { type: 'string', example: '123456' } } } })
  mfaEnable(@Request() req: any, @Body('token') token: string) {
    return this.mfa.confirmEnable(req.user.sub, token)
  }

  @Post('mfa/disable')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Disable MFA (requires current password)' })
  @ApiBody({ schema: { properties: { password: { type: 'string' } } } })
  mfaDisable(@Request() req: any, @Body('password') password: string) {
    return this.mfa.disable(req.user.sub, password)
  }

  @Post('mfa/backup-codes/regenerate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Regenerate the 10 backup codes (invalidates previous ones)' })
  mfaRegenerate(@Request() req: any) {
    return this.mfa.regenerateBackupCodes(req.user.sub)
  }
}
