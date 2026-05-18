import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { PrismaService } from '../prisma.service'
import * as bcrypt from 'bcryptjs'
import { RegisterDto } from './dto/register.dto'
import { LoginDto } from './dto/login.dto'

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
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

    // Create profile based on role
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

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } })
    if (!user || !user.passwordHash) throw new UnauthorizedException('Credenciais inválidas')
    if (user.banned) throw new UnauthorizedException('Conta suspensa')

    const valid = await bcrypt.compare(dto.password, user.passwordHash)
    if (!valid) throw new UnauthorizedException('Credenciais inválidas')

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    })

    return this.signToken(user.id, user.email, user.role)
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: {
        client: { include: { subscription: true } },
        professional: { select: { id: true, slug: true, verified: true, kycStatus: true } },
      },
    })
    const { passwordHash, mfaSecret, ...safe } = user
    return safe
  }

  private signToken(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role }
    const accessToken = this.jwt.sign(payload)
    return { accessToken, tokenType: 'Bearer' }
  }
}
