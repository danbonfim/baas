import { Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { PrismaService } from '../prisma.service'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET || 'baas-super-secret-key-change-in-prod',
    })
  }

  async validate(payload: any) {
    // Look up profile IDs so controllers can use req.user.clientId / req.user.professionalId
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        client: { select: { id: true } },
        professional: { select: { id: true } },
      },
    })
    return {
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
      clientId: user?.client?.id ?? null,
      professionalId: user?.professional?.id ?? null,
    }
  }
}
