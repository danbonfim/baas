import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation, ApiBody } from '@nestjs/swagger'
import { ProSubscriptionService } from './pro-subscription.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'

@ApiTags('Pro Subscription (per-professional)')
@Controller('pro-subscription')
export class ProSubscriptionController {
  constructor(private subs: ProSubscriptionService) {}

  // ─── Professional config ────────────────────────

  @Patch('enable')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[PROFESSIONAL] Enable individual subscription tier with monthly price' })
  @ApiBody({ schema: { properties: { monthlyPrice: { type: 'number', minimum: 15, maximum: 500 } }, required: ['monthlyPrice'] } })
  enable(@Request() req: any, @Body('monthlyPrice') price: number) {
    return this.subs.enableSubscription(req.user.sub, price)
  }

  @Patch('disable')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[PROFESSIONAL] Disable subscription tier (existing subscribers keep access until period end)' })
  disable(@Request() req: any) {
    return this.subs.disableSubscription(req.user.sub)
  }

  // ─── Client subscribe / cancel ──────────────────

  @Post(':professionalId/intent')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[CLIENT] Create payment intent to subscribe to a professional' })
  intent(@Request() req: any, @Param('professionalId') id: string) {
    return this.subs.createSubscriptionIntent(req.user.sub, id)
  }

  @Delete(':professionalId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[CLIENT] Cancel subscription (access kept until period end)' })
  cancel(@Request() req: any, @Param('professionalId') id: string) {
    return this.subs.cancelSubscription(req.user.sub, id)
  }

  // ─── Listing ────────────────────────────────────

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[CLIENT] List my active subscriptions to professionals' })
  mine(@Request() req: any) {
    return this.subs.mySubscriptions(req.user.sub)
  }

  @Get('subscribers')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[PROFESSIONAL] List my active subscribers' })
  subscribers(@Request() req: any) {
    return this.subs.mySubscribers(req.user.sub)
  }
}
