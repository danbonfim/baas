import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Request } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation, ApiBody } from '@nestjs/swagger'
import { KycService } from './kyc.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'

@ApiTags('KYC')
@Controller('kyc')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class KycController {
  constructor(private kyc: KycService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get my KYC status' })
  myStatus(@Request() req: any) {
    return this.kyc.getMyKycStatus(req.user.sub)
  }

  @Post('submit')
  @ApiOperation({ summary: 'Submit selfie + document for verification (URLs of already-uploaded files)' })
  @ApiBody({
    schema: {
      properties: {
        selfieUrl: { type: 'string', description: 'URL of selfie image' },
        documentUrl: { type: 'string', description: 'URL of ID document' },
        documentType: { type: 'string', enum: ['RG', 'CNH', 'PASSPORT'], default: 'RG' },
      },
      required: ['selfieUrl', 'documentUrl'],
    },
  })
  submit(
    @Request() req: any,
    @Body() body: { selfieUrl: string; documentUrl: string; documentType?: string },
  ) {
    return this.kyc.submitDocuments(req.user.sub, body)
  }

  // ─── Admin endpoints ───────────────────────────

  @Get('admin/pending')
  @ApiOperation({ summary: '[ADMIN] List pending KYC reviews' })
  listPending(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.kyc.listPending(page ? +page : 1, limit ? +limit : 20)
  }

  @Get('admin/:professionalId')
  @ApiOperation({ summary: '[ADMIN] Get full review detail' })
  reviewDetail(@Request() req: any, @Param('professionalId') professionalId: string) {
    return this.kyc.getReviewDetail(req.user.sub, professionalId)
  }

  @Patch('admin/:professionalId/approve')
  @ApiOperation({ summary: '[ADMIN] Approve KYC' })
  @ApiBody({
    schema: {
      properties: {
        level: { type: 'string', enum: ['DOCUMENT', 'BIOMETRIC', 'FULL'] },
      },
    },
  })
  approve(
    @Request() req: any,
    @Param('professionalId') professionalId: string,
    @Body('level') level?: 'DOCUMENT' | 'BIOMETRIC' | 'FULL',
  ) {
    return this.kyc.approveKyc(req.user.sub, professionalId, level)
  }

  @Patch('admin/:professionalId/reject')
  @ApiOperation({ summary: '[ADMIN] Reject KYC with a reason' })
  @ApiBody({
    schema: { properties: { reason: { type: 'string' } }, required: ['reason'] },
  })
  reject(
    @Request() req: any,
    @Param('professionalId') professionalId: string,
    @Body('reason') reason: string,
  ) {
    return this.kyc.rejectKyc(req.user.sub, professionalId, reason)
  }
}
