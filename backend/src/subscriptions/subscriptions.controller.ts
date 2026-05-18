import { Controller, Get, Post, Delete, Body, UseGuards, Request } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { SubscriptionsService } from './subscriptions.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'

@ApiTags('Subscriptions')
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private service: SubscriptionsService) {}

  @Get('plans')
  @ApiOperation({ summary: 'List available subscription plans' })
  plans() {
    return this.service.getPlans()
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my active subscription' })
  mySubscription(@Request() req: any) {
    return this.service.getMy(req.user.clientId)
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Subscribe to a plan' })
  subscribe(@Request() req: any, @Body('plan') plan: 'BASIC' | 'PREMIUM' | 'VIP') {
    return this.service.subscribe(req.user.clientId, plan)
  }

  @Delete()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel subscription at period end' })
  cancel(@Request() req: any) {
    return this.service.cancel(req.user.clientId)
  }
}
