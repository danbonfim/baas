import { Injectable, UnauthorizedException, ConflictException, BadRequestException, NotFoundException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { PrismaService } from '../prisma.service'
import { MfaService } from './mfa.service'
import { VerificationService } from './verification.service'
import * as bcrypt from 'bcryptjs'
import { RegisterDto } from './dto/register.dto'
import { LoginDto } from './dto/login.dto'

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private mfa: MfaService,
    private verification: VerificationService,
  ) {}

  // ─── Email-code-based registration ─────────────

  /**
   * Step 1 of email-code signup: validates email is not taken and sends a 6-digit code.
   */
  async requestRegisterCode(email: string, ip?: string): Promise<{ success: boolean; expiresIn: number }> {
    const normalizedEmail = email.toLowerCase().trim()
    const existing = await this.prisma.user.findUnique({ where: { email: normalizedEmail } })
    if (existing) throw new ConflictException('Email já cadastrado')
    return this.verification.requestCode(normalizedEmail, 'REGISTER', ip)
  }

  /**
   * Step 2 of email-code signup: verifies the code (used as temp password) and creates the account.
   * The verification code IS the password during this initial flow. User can change it later via /auth/me.
   */
  async registerWithCode(dto: RegisterDto): Promise<any> {
    const normalizedEmail = dto.email.toLowerCase().trim()

    const existing = await this.prisma.user.findUnique({ where: { email: normalizedEmail } })
    if (existing) throw new ConflictException('Email já cadastrado')

    // Verify the code — `password` field carries the 6-digit code in this flow
    const validCode = await this.verification.verifyCode(normalizedEmail, dto.password, 'REGISTER')
    if (!validCode) throw new BadRequestException('Código inválido ou expirado')

    // Hash the same code as the initial password. User is encouraged to change it.
    const passwordHash = await bcrypt.hash(dto.password, 12)

    const user = await this.prisma.user.create({
      data: {
        email: normalizedEmail,
        name: dto.name,
        phone: dto.phone,
        passwordHash,
        emailVerified: true, // code was emailed → email is verified
        role: dto.role === 'professional' ? 'PROFESSIONAL' : 'CLIENT',
      },
    })

    if (user.role === 'CLIENT') {
      await this.prisma.client.create({ data: { userId: user.id } })
    } else if (user.role === 'PROFESSIONAL') {
      const slug = dto.name.toLowerCase()
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
        + '-' + Date.now()
      await this.prisma.professional.create({
        data: { userId: user.id, slug, city: dto.city || 'São Paulo', state: dto.state || 'SP' },
      })
    }

    return this.signToken(user.id, user.email, user.role)
  }

  // ─── Password reset flow ───────────────────────

  /**
   * Always returns success to prevent email enumeration. Internally, only sends code if user exists.
   */
  async requestPasswordReset(email: string, ip?: string): Promise<{ success: boolean; expiresIn: number }> {
    const normalizedEmail = email.toLowerCase().trim()
    const user = await this.prisma.user.findUnique({ where: { email: normalizedEmail } })
    if (user) {
      return this.verification.requestCode(normalizedEmail, 'PASSWORD_RESET', ip)
    }
    // Fake success response (no email enumeration)
    return { success: true, expiresIn: 600 }
  }

  /**
   * Verify the code and set a new password.
   */
  async resetPassword(email: string, code: string, newPassword: string): Promise<{ success: boolean }> {
    const normalizedEmail = email.toLowerCase().trim()
    if (newPassword.length < 6) throw new BadRequestException('Senha deve ter no mínimo 6 caracteres')

    const user = await this.prisma.user.findUnique({ where: { email: normalizedEmail } })
    if (!user) throw new NotFoundException('Usuário não encontrado')

    const validCode = await this.verification.verifyCode(normalizedEmail, code, 'PASSWORD_RESET')
    if (!validCode) throw new BadRequestException('Código inválido ou expirado')

    const passwordHash = await bcrypt.hash(newPassword, 12)

    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    })

    // Invalidate all active sessions for safety
    await this.prisma.session.deleteMany({ where: { userId: user.id } }).catch(() => {})

    await this.prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'PASSWORD_RESET',
        resource: 'User',
        resourceId: user.id,
      },
    }).catch(() => {})

    return { success: true }
  }

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } })
    if (existing) throw new ConflictException('Email já cadastrado')

    const passwordHash = await bcrypt.hash(dto.password, 12)
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        phone: dto.phone,
        passwordHash,
        role: dto.role === 'professional' ? 'PROFESSIONAL' : 'CLIENT',
      },
    })

    if (user.role === 'CLIENT') {
      await this.prisma.client.create({ data: { userId: user.id } })
    } else if (user.role === 'PROFESSIONAL') {
      const slug = dto.name.toLowerCase()
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
        + '-' + Date.now()
      await this.prisma.professional.create({
        data: { userId: user.id, slug, city: dto.city || 'São Paulo', state: dto.state || 'SP' },
      })
    }

    return this.signToken(user.id, user.email, user.role)
  }

  async login(dto: LoginDto, ip?: string, userAgent?: string) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } })

    if (!user || !user.passwordHash) {
      await this.logAttempt(null, dto.email, ip, userAgent, false, 'user_not_found')
      throw new UnauthorizedException('Credenciais inválidas')
    }
    if (user.banned) {
      await this.logAttempt(user.id, dto.email, ip, userAgent, false, 'banned')
      throw new UnauthorizedException('Conta suspensa')
    }

    // Block after 5 failed attempts in the last 15 minutes
    const recentFailures = await this.prisma.loginAttempt.count({
      where: {
        email: dto.email,
        success: false,
        createdAt: { gte: new Date(Date.now() - 15 * 60 * 1000) },
      },
    })
    if (recentFailures >= 5) {
      await this.logAttempt(user.id, dto.email, ip, userAgent, false, 'brute_force_blocked')
      throw new UnauthorizedException('Muitas tentativas. Tente novamente em 15 minutos.')
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash)
    if (!valid) {
      await this.logAttempt(user.id, dto.email, ip, userAgent, false, 'wrong_password')
      throw new UnauthorizedException('Credenciais inválidas')
    }

    if (user.mfaEnabled) {
      if (!dto.mfaToken) {
        await this.logAttempt(user.id, dto.email, ip, userAgent, false, 'mfa_required')
        return { mfaRequired: true, message: 'Informe o código do autenticador (campo mfaToken)' }
      }
      const mfaValid = await this.mfa.verifyToken(user.id, dto.mfaToken)
      if (!mfaValid) {
        await this.logAttempt(user.id, dto.email, ip, userAgent, false, 'mfa_invalid')
        throw new UnauthorizedException('Código MFA inválido')
      }
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    })
    await this.logAttempt(user.id, dto.email, ip, userAgent, true)

    return this.signToken(user.id, user.email, user.role)
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: {
        client: { include: { subscription: true } },
        professional: {
          select: {
            id: true, slug: true, verified: true,
            kycStatus: true, kycLevel: true,
          },
        },
      },
    })
    const { passwordHash, mfaSecret, mfaBackupCodes, ...safe } = user
    return safe
  }

  private async logAttempt(
    userId: string | null, email: string, ip: string | undefined,
    userAgent: string | undefined, success: boolean, failReason?: string,
  ) {
    await this.prisma.loginAttempt.create({
      data: { userId, email, ip, userAgent, success, failReason },
    }).catch(() => {})
  }

  private signToken(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role }
    const accessToken = this.jwt.sign(payload)
    return { accessToken, tokenType: 'Bearer' }
  }
}
