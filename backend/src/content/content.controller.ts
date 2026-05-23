import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation, ApiBody } from '@nestjs/swagger'
import { ContentService } from './content.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'

@ApiTags('Premium Content (PPV)')
@Controller('content')
export class ContentController {
  constructor(private content: ContentService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[PROFESSIONAL] Upload premium content (URLs of already-uploaded files)' })
  @ApiBody({
    schema: {
      properties: {
        type: { type: 'string', enum: ['PHOTO', 'VIDEO', 'AUDIO'] },
        url: { type: 'string' },
        thumbnailUrl: { type: 'string' },
        blurUrl: { type: 'string', description: 'Optional blurred preview shown before unlock' },
        title: { type: 'string' },
        description: { type: 'string' },
        price: { type: 'number', minimum: 3, maximum: 1000 },
        durationSeconds: { type: 'number' },
      },
      required: ['type', 'url', 'price'],
    },
  })
  create(@Request() req: any, @Body() body: any) {
    return this.content.createContent(req.user.sub, body)
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[PROFESSIONAL] List my own premium content' })
  mine(@Request() req: any) {
    return this.content.listMyContent(req.user.sub)
  }

  @Get('professional/:professionalId')
  @ApiOperation({
    summary:
      'List all premium content of a professional. If logged in, includes unlock status. Locked items return null url + blur preview.',
  })
  listForProfessional(@Param('professionalId') id: string, @Request() req: any) {
    const userId = req.user?.sub
    return this.content.listProfessionalContent(id, userId)
  }

  @Post(':contentId/unlock-intent')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[CLIENT] Create Stripe payment intent to unlock content' })
  unlockIntent(@Request() req: any, @Param('contentId') contentId: string) {
    return this.content.createUnlockIntent(req.user.sub, contentId)
  }

  @Patch(':contentId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[PROFESSIONAL] Update title/description/price/visibility' })
  update(
    @Request() req: any,
    @Param('contentId') contentId: string,
    @Body() body: { title?: string; description?: string; price?: number; visible?: boolean },
  ) {
    return this.content.updateContent(req.user.sub, contentId, body)
  }

  @Delete(':contentId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[PROFESSIONAL] Soft-delete content (preserves past unlocks)' })
  remove(@Request() req: any, @Param('contentId') contentId: string) {
    return this.content.deleteContent(req.user.sub, contentId)
  }
}
