import { Controller, Post, Param, UseGuards, Request, Headers, Req } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { PaymentsService } from './payments.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private service: PaymentsService) {}

  @Post('bookings/:bookingId/intent')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create Stripe PaymentIntent for a booking' })
  createIntent(@Param('bookingId') bookingId: string, @Request() req: any) {
    return this.service.createPaymentIntent(bookingId, req.user.clientId)
  }

  @Post('connect/onboarding')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Start Stripe Connect onboarding for professional' })
  connectOnboarding(@Request() req: any) {
    return this.service.createConnectAccount(req.user.professionalId, req.user.email)
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Stripe webhook endpoint' })
  webhook(
    @Headers('stripe-signature') signature: string,
    @Req() req: any,
  ) {
    return this.service.handleWebhook(signature, req.rawBody as Buffer)
  }
}
