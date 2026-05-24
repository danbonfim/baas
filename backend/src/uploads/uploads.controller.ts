import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation, ApiBody, ApiQuery } from '@nestjs/swagger'
import { UploadsService } from './uploads.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'

type UploadKind = 'avatar' | 'photo' | 'kyc_selfie' | 'kyc_document' | 'content' | 'story' | 'message_attachment'

@ApiTags('Uploads')
@Controller('uploads')
export class UploadsController {
  constructor(private uploads: UploadsService) {}

  @Get('status')
  @ApiOperation({ summary: 'Check if upload service is configured' })
  status() {
    return this.uploads.getStatus()
  }

  @Post('signature')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get signed upload payload for direct upload to Cloudinary from the frontend',
  })
  @ApiBody({
    schema: {
      properties: {
        kind: {
          type: 'string',
          enum: ['avatar', 'photo', 'kyc_selfie', 'kyc_document', 'content', 'story', 'message_attachment'],
        },
      },
      required: ['kind'],
    },
  })
  signature(@Request() req: any, @Body('kind') kind: UploadKind) {
    return this.uploads.generateUploadSignature(req.user.sub, kind)
  }

  @Get('private-url/:publicId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate a time-limited signed URL for a private asset (KYC, PPV)' })
  @ApiQuery({ name: 'ttl', required: false, description: 'Seconds (default 300)' })
  @ApiQuery({ name: 'type', required: false, description: 'image | video | raw (default image)' })
  privateUrl(
    @Param('publicId') publicId: string,
    @Query('ttl') ttl?: string,
    @Query('type') type?: 'image' | 'video' | 'raw',
  ) {
    const url = this.uploads.signPrivateUrl(publicId, ttl ? +ttl : 300, type)
    return { url, expiresInSeconds: ttl ? +ttl : 300 }
  }
}
