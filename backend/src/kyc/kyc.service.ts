import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common'
import { PrismaService } from '../prisma.service'

@Injectable()
export class KycService {
  constructor(private prisma: PrismaService) {}

  /**
   * Professional submits selfie + document URLs (already uploaded to S3/Cloudinary).
   * Triggers an admin review queue.
   */
  async submitDocuments(
    userId: string,
    data: { selfieUrl: string; documentUrl: string; documentType?: string },
  ) {
    const pro = await this.prisma.professional.findUnique({ where: { userId } })
    if (!pro) throw new NotFoundException('Perfil profissional não encontrado')
    if (pro.kycStatus === 'APPROVED') throw new BadRequestException('KYC já aprovado')

    return this.prisma.professional.update({
      where: { id: pro.id },
      data: {
        kycSelfieUrl: data.selfieUrl,
        kycDocumentUrl: data.documentUrl,
        kycDocuments: { documentType: data.documentType || 'RG' } as any,
        kycSubmittedAt: new Date(),
        kycStatus: 'PENDING',
        kycLevel: 'DOCUMENT',
      },
    })
  }

  async getMyKycStatus(userId: string) {
    const pro = await this.prisma.professional.findUnique({
      where: { userId },
      select: {
        kycStatus: true,
        kycLevel: true,
        kycSubmittedAt: true,
        kycReviewedAt: true,
        kycRejectionReason: true,
        verified: true,
      },
    })
    if (!pro) throw new NotFoundException('Perfil profissional não encontrado')
    return pro
  }

  /**
   * Admin approves KYC. Sets kycLevel to BIOMETRIC if selfie + doc, FULL if all checks pass.
   */
  async approveKyc(adminId: string, professionalId: string, level: 'DOCUMENT' | 'BIOMETRIC' | 'FULL' = 'BIOMETRIC') {
    const admin = await this.prisma.user.findUniqueOrThrow({ where: { id: adminId } })
    if (admin.role !== 'ADMIN') throw new ForbiddenException('Apenas admins')

    const pro = await this.prisma.professional.update({
      where: { id: professionalId },
      data: {
        kycStatus: 'APPROVED',
        kycLevel: level,
        verified: true,
        kycReviewedAt: new Date(),
        kycReviewerId: adminId,
        kycRejectionReason: null,
      },
    })

    await this.prisma.notification.create({
      data: {
        userId: pro.userId,
        title: '✅ Verificação aprovada',
        body: `Seu perfil foi verificado (nível: ${level}). Selo de verificado agora aparece em seu perfil.`,
        type: 'KYC_APPROVED',
        data: { level } as any,
      },
    })

    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'KYC_APPROVED',
        resource: 'Professional',
        resourceId: professionalId,
        details: { level } as any,
      },
    })

    return pro
  }

  async rejectKyc(adminId: string, professionalId: string, reason: string) {
    const admin = await this.prisma.user.findUniqueOrThrow({ where: { id: adminId } })
    if (admin.role !== 'ADMIN') throw new ForbiddenException('Apenas admins')

    const pro = await this.prisma.professional.update({
      where: { id: professionalId },
      data: {
        kycStatus: 'REJECTED',
        verified: false,
        kycReviewedAt: new Date(),
        kycReviewerId: adminId,
        kycRejectionReason: reason,
      },
    })

    await this.prisma.notification.create({
      data: {
        userId: pro.userId,
        title: 'Verificação rejeitada',
        body: `Sua submissão de KYC foi rejeitada. Motivo: ${reason}. Por favor, resubmeta com documentos válidos.`,
        type: 'KYC_REJECTED',
        data: { reason } as any,
      },
    })

    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'KYC_REJECTED',
        resource: 'Professional',
        resourceId: professionalId,
        details: { reason } as any,
      },
    })

    return pro
  }

  async listPending(page = 1, limit = 20) {
    const skip = (page - 1) * limit
    const [items, total] = await Promise.all([
      this.prisma.professional.findMany({
        where: { kycStatus: 'PENDING', kycSubmittedAt: { not: null } },
        skip,
        take: limit,
        orderBy: { kycSubmittedAt: 'asc' },
        include: {
          user: { select: { name: true, email: true, phone: true, createdAt: true } },
        },
      }),
      this.prisma.professional.count({
        where: { kycStatus: 'PENDING', kycSubmittedAt: { not: null } },
      }),
    ])

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  async getReviewDetail(adminId: string, professionalId: string) {
    const admin = await this.prisma.user.findUniqueOrThrow({ where: { id: adminId } })
    if (admin.role !== 'ADMIN') throw new ForbiddenException('Apenas admins')

    return this.prisma.professional.findUniqueOrThrow({
      where: { id: professionalId },
      include: {
        user: { select: { name: true, email: true, phone: true, createdAt: true } },
        photos: true,
      },
    })
  }
}
