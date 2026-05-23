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

  // ─── Email-code-based signup ──────────────────

  @Post('register/request-code')
  @HttpCode(200)
  @Throttle({ sensitive: { limit: 5, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Step 1: Request a 6-digit code via email to start signup. The code IS the temporary password used in step 2.',
  })
  @ApiBody({
    schema: {
      properties: { email: { type: 'string', format: 'email' } },
      required: ['email'],
    },
  })
  requestRegisterCode(@Body('email') email: string, @Ip() ip: string) {
    return this.auth.requestRegisterCode(email, ip)
  }

  @Post('register')
  @ApiOperation({
    summary:
      'Step 2: Finalize signup. The "password" field must be the 6-digit code received by email. It becomes the initial password — user can change it later.',
  })
  register(@Body() dto: RegisterDto) {
    return this.auth.registerWithCode(dto)
  }

  // ─── Password reset ───────────────────────────

  @Post('forgot-password')
  @HttpCode(200)
  @Throttle({ sensitive: { limit: 5, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Send a password-reset code via email. Always returns success (anti-email-enumeration).',
  })
  @ApiBody({
    schema: { properties: { email: { type: 'string', format: 'email' } }, required: ['email'] },
  })
  forgotPassword(@Body('email') email: string, @Ip() ip: string) {
    return this.auth.requestPasswordReset(email, ip)
  }

  @Post('reset-password')
  @HttpCode(200)
  @ApiOperation({ summary: 'Verify the code from email and set a new password' })
  @ApiBody({
    schema: {
      properties: {
        email: { type: 'string', format: 'email' },
        code: { type: 'string', example: '123456' },
        newPassword: { type: 'string', minLength: 6 },
      },
      required: ['email', 'code', 'newPassword'],
    },
  })
  resetPassword(@Body() body: { email: string; code: string; newPassword: string }) {
    return this.auth.resetPassword(body.email, body.code, body.newPassword)
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
