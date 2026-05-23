import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation, ApiBody } from '@nestjs/swagger'
import { TipsService } from './tips.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'

@ApiTags('Tips')
@Controller('tips')
export class TipsController {
  constructor(private tips: TipsService) {}

  @Post('intent')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create payment intent to send a tip (R$ 5 - R$ 5000)' })
  @ApiBody({
    schema: {
      properties: {
        professionalId: { type: 'string' },
        amount: { type: 'number', minimum: 5, maximum: 5000 },
        message: { type: 'string', maxLength: 200 },
        isPublic: { type: 'boolean', default: true },
      },
      required: ['professionalId', 'amount'],
    },
  })
  intent(
    @Request() req: any,
    @Body() body: { professionalId: string; amount: number; message?: string; isPublic?: boolean },
  ) {
    return this.tips.createTipIntent(req.user.sub, body)
  }

  @Get('sent')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List tips I have sent (client)' })
  sent(@Request() req: any) {
    return this.tips.listMyTipsSent(req.user.sub)
  }

  @Get('received')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List tips I have received (professional)' })
  received(@Request() req: any) {
    return this.tips.listMyTipsReceived(req.user.sub)
  }

  @Get('public/:professionalId')
  @ApiOperation({ summary: 'List public tips a professional received (social proof)' })
  publicList(@Param('professionalId') id: string) {
    return this.tips.publicProfessionalTips(id)
  }
}
