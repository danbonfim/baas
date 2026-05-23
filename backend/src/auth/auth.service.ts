import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { PrismaService } from '../prisma.service'
import { MfaService } from './mfa.service'
import * as bcrypt from 'bcryptjs'
import { RegisterDto } from './dto/register.dto'
import { LoginDto } from './dto/login.dto'

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private mfa: MfaService,
  ) {}

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
