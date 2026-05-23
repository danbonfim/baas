import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation, ApiBody } from '@nestjs/swagger'
import { BoostService } from './boost.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'

@ApiTags('Boost')
@Controller('boost')
export class BoostController {
  constructor(private boost: BoostService) {}

  @Get('plans')
  @ApiOperation({ summary: 'List boost plans (STANDARD/PREMIUM/ULTRA)' })
  plans() {
    return this.boost.listPlans()
  }

  @Post('intent')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create Stripe payment intent for a boost' })
  @ApiBody({
    schema: {
      properties: { type: { type: 'string', enum: ['STANDARD', 'PREMIUM', 'ULTRA'] } },
      required: ['type'],
    },
  })
  createIntent(@Request() req: any, @Body('type') type: 'STANDARD' | 'PREMIUM' | 'ULTRA') {
    return this.boost.createBoostIntent(req.user.sub, type)
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my active boost (if any)' })
  myActive(@Request() req: any) {
    return this.boost.myActiveBoost(req.user.sub)
  }

  @Get('history')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List my boost history' })
  history(@Request() req: any) {
    return this.boost.myBoostHistory(req.user.sub)
  }
}
