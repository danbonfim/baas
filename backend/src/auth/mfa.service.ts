import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import { TOTP, generate, generateSecret, verify, generateURI } from 'otplib'
import * as QRCode from 'qrcode'
import { randomBytes } from 'crypto'
import * as bcrypt from 'bcryptjs'

@Injectable()
export class MfaService {
  constructor(private prisma: PrismaService) {}

  /**
   * Step 1: Generate a TOTP secret and QR code for user setup.
   * The secret is stored as pending until verified via `confirmEnable`.
   */
  async generateSecret(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } })
    if (user.mfaEnabled) throw new BadRequestException('MFA já habilitado')

    const secret = await generateSecret()
    const issuer = 'BAAS'
    const otpAuthUrl = generateURI({
      issuer,
      label: user.email,
      secret,
    })
    const qrCodeDataUrl = await QRCode.toDataURL(otpAuthUrl)

    // Store the secret temporarily (not yet enabled — confirmEnable will activate)
    await this.prisma.user.update({
      where: { id: userId },
      data: { mfaSecret: secret },
    })

    return {
      secret,
      qrCode: qrCodeDataUrl,
      otpAuthUrl,
      manualEntryKey: secret,
    }
  }

  /**
   * Step 2: User scans QR and submits the first 6-digit code.
   * On success, MFA is enabled and 10 backup codes are returned (one-time view).
   */
  async confirmEnable(userId: string, token: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } })
    if (!user.mfaSecret) throw new BadRequestException('Setup não iniciado. Chame /mfa/setup primeiro')
    if (user.mfaEnabled) throw new BadRequestException('MFA já habilitado')

    const valid = await verify({ token, secret: user.mfaSecret })
    if (!valid) throw new BadRequestException('Código TOTP inválido')

    // Generate 10 backup codes
    const plainCodes: string[] = []
    const hashedCodes: string[] = []
    for (let i = 0; i < 10; i++) {
      const code = randomBytes(4).toString('hex').toUpperCase()
      plainCodes.push(code)
      hashedCodes.push(await bcrypt.hash(code, 8))
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { mfaEnabled: true, mfaBackupCodes: hashedCodes },
    })

    return {
      enabled: true,
      backupCodes: plainCodes,
      warning: 'Guarde estes códigos em local seguro. Eles não serão exibidos novamente.',
    }
  }

  /**
   * Verify a TOTP token OR a backup code. Used during login when MFA is enabled.
   * Returns true on success. Consumes a backup code if one is used.
   */
  async verifyToken(userId: string, token: string): Promise<boolean> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } })
    if (!user.mfaEnabled || !user.mfaSecret) return false

    // Try TOTP first
    if (await verify({ token, secret: user.mfaSecret })) return true

    // Try backup codes
    const cleanToken = token.toUpperCase().replace(/\s/g, '')
    for (let i = 0; i < user.mfaBackupCodes.length; i++) {
      const match = await bcrypt.compare(cleanToken, user.mfaBackupCodes[i])
      if (match) {
        // Consume the backup code
        const remaining = user.mfaBackupCodes.filter((_, idx) => idx !== i)
        await this.prisma.user.update({
          where: { id: userId },
          data: { mfaBackupCodes: remaining },
        })
        return true
      }
    }
    return false
  }

  async disable(userId: string, password: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } })
    if (!user.mfaEnabled) throw new BadRequestException('MFA não habilitado')
    if (!user.passwordHash) throw new UnauthorizedException('Senha não definida')

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) throw new UnauthorizedException('Senha incorreta')

    await this.prisma.user.update({
      where: { id: userId },
      data: { mfaEnabled: false, mfaSecret: null, mfaBackupCodes: [] },
    })

    return { disabled: true }
  }

  async regenerateBackupCodes(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } })
    if (!user.mfaEnabled) throw new BadRequestException('MFA não habilitado')

    const plainCodes: string[] = []
    const hashedCodes: string[] = []
    for (let i = 0; i < 10; i++) {
      const code = randomBytes(4).toString('hex').toUpperCase()
      plainCodes.push(code)
      hashedCodes.push(await bcrypt.hash(code, 8))
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { mfaBackupCodes: hashedCodes },
    })

    return { backupCodes: plainCodes }
  }
}
