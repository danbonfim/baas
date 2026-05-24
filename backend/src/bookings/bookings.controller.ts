import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Request, ForbiddenException } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation, ApiBody } from '@nestjs/swagger'
import { BookingsService } from './bookings.service'
import { CreateBookingDto } from './dto/create-booking.dto'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'

@ApiTags('Bookings')
@Controller('bookings')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BookingsController {
  constructor(private service: BookingsService) {}

  @Post()
  @ApiOperation({ summary: 'Create booking' })
  create(@Request() req: any, @Body() dto: CreateBookingDto) {
    if (!req.user.clientId) throw new ForbiddenException('Apenas clientes podem criar agendamentos')
    return this.service.create(req.user.clientId, dto)
  }

  @Post('recurring')
  @ApiOperation({ summary: 'Create multiple recurring bookings in one call (2-12 occurrences)' })
  @ApiBody({
    schema: {
      properties: {
        professionalId: { type: 'string' },
        startDate: { type: 'string', format: 'date-time' },
        startTime: { type: 'string', example: '20:00' },
        endTime: { type: 'string', example: '22:00' },
        durationHours: { type: 'number' },
        location: { type: 'string' },
        notes: { type: 'string' },
        recurrence: { type: 'string', enum: ['weekly', 'biweekly', 'monthly'] },
        occurrences: { type: 'number', minimum: 2, maximum: 12 },
      },
      required: ['professionalId', 'startDate', 'startTime', 'endTime', 'durationHours', 'recurrence', 'occurrences'],
    },
  })
  recurring(@Request() req: any, @Body() body: any) {
    if (!req.user.clientId) throw new ForbiddenException('Apenas clientes podem criar agendamentos')
    return this.service.createRecurring(req.user.clientId, body)
  }

  @Get('my')
  @ApiOperation({ summary: 'Get my bookings (client)' })
  myBookings(@Request() req: any, @Query('status') status?: string) {
    return this.service.findByClient(req.user.clientId, status)
  }

  @Get('professional')
  @ApiOperation({ summary: 'Get bookings as professional' })
  professionalBookings(@Request() req: any, @Query('status') status?: string) {
    return this.service.findByProfessional(req.user.professionalId, status)
  }

  @Patch(':id/confirm')
  @ApiOperation({ summary: 'Confirm booking (professional)' })
  confirm(@Param('id') id: string, @Request() req: any) {
    return this.service.confirm(id, req.user.professionalId)
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel booking' })
  cancel(@Param('id') id: string, @Request() req: any, @Body('reason') reason?: string) {
    return this.service.cancel(id, req.user.sub, reason)
  }

  @Patch(':id/complete')
  @ApiOperation({ summary: 'Mark booking as complete (professional)' })
  complete(@Param('id') id: string, @Request() req: any) {
    return this.service.complete(id, req.user.professionalId)
  }

  @Patch(':id/reschedule')
  @ApiOperation({ summary: 'Reschedule booking to new date/time (≥12h notice for client)' })
  @ApiBody({
    schema: {
      properties: {
        date: { type: 'string', format: 'date-time' },
        startTime: { type: 'string' },
        endTime: { type: 'string' },
        durationHours: { type: 'number' },
      },
      required: ['date', 'startTime', 'endTime', 'durationHours'],
    },
  })
  reschedule(@Param('id') id: string, @Request() req: any, @Body() body: any) {
    return this.service.reschedule(id, req.user.sub, body)
  }

  @Post(':id/refund')
  @ApiOperation({
    summary:
      'Request refund. Refund % is tiered: >48h=100%, 24-48h=75%, 12-24h=50%, <12h=0%. Pro-initiated cancellations always 100%.',
  })
  @ApiBody({ schema: { properties: { reason: { type: 'string' } } } })
  refund(@Param('id') id: string, @Request() req: any, @Body('reason') reason?: string) {
    return this.service.requestRefund(id, req.user.sub, reason)
  }
}
