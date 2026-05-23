import { Injectable, BadRequestException, Logger } from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import { EmailService } from '../email/email.service'
import * as bcrypt from 'bcryptjs'
import { randomInt } from 'crypto'

type Purpose = 'REGISTER' | 'PASSWORD_RESET'

const CODE_TTL_MINUTES = 10
const MAX_VERIFY_ATTEMPTS = 5
const MAX_REQUESTS_PER_HOUR = 5

@Injectable()
export class VerificationService {
  private readonly logger = new Logger(VerificationService.name)

  constructor(
    private prisma: PrismaService,
    private email: EmailService,
  ) {}

  /**
   * Generate a 6-digit code, store its hash, and send the plaintext via email.
   * Throws if requesting too many codes for the same email/purpose recently.
   */
  async requestCode(email: string, purpose: Purpose, ip?: string): Promise<{ success: boolean; expiresIn: number }> {
    const normalizedEmail = email.toLowerCase().trim()

    // Anti-abuse: limit per email/purpose in the last hour
    const recent = await this.prisma.verificationCode.count({
      where: {
        email: normalizedEmail,
        purpose,
        createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) },
      },
    })
    if (recent >= MAX_REQUESTS_PER_HOUR) {
      throw new BadRequestException('Muitos códigos solicitados. Tente novamente em 1 hora.')
    }

    // Invalidate any previous active codes for the same purpose
    await this.prisma.verificationCode.updateMany({
      where: { email: normalizedEmail, purpose, used: false },
      data: { used: true },
    })

    // Generate 6-digit code (cryptographically random)
    const code = randomInt(100000, 999999).toString()
    const codeHash = await bcrypt.hash(code, 8) // low rounds since TTL is short

    const expiresAt = new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000)

    await this.prisma.verificationCode.create({
      data: { email: normalizedEmail, codeHash, purpose, expiresAt, ip },
    })

    // Send email (fire-and-forget to keep response fast)
    this.email
      .sendVerificationCode(normalizedEmail, code, purpose)
      .then((result) => {
        if (!result.success) this.logger.error(`Code email failed: ${result.error}`)
      })
      .catch((err) => this.logger.error(`Code email exception: ${err.message}`))

    return { success: true, expiresIn: CODE_TTL_MINUTES * 60 }
  }

  /**
   * Verify a code. Returns true if valid. Increments attempts on failure.
   * Marks the code as used on success.
   */
  async verifyCode(email: string, code: string, purpose: Purpose): Promise<boolean> {
    const normalizedEmail = email.toLowerCase().trim()

    // Find latest active code for this email/purpose
    const record = await this.prisma.verificationCode.findFirst({
      where: {
        email: normalizedEmail,
        purpose,
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    })

    if (!record) return false
    if (record.attempts >= MAX_VERIFY_ATTEMPTS) return false

    const valid = await bcrypt.compare(code, record.codeHash)

    if (!valid) {
      await this.prisma.verificationCode.update({
        where: { id: record.id },
        data: { attempts: { increment: 1 } },
      })
      return false
    }

    // Mark code as used
    await this.prisma.verificationCode.update({
      where: { id: record.id },
      data: { used: true },
    })

    return true
  }

  /**
   * Purge expired codes (cron-callable).
   */
  async purgeExpired(): Promise<{ purged: number }> {
    const result = await this.prisma.verificationCode.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { used: true, createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
        ],
      },
    })
    return { purged: result.count }
  }
}
