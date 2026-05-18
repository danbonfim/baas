import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Request } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
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
    return this.service.create(req.user.clientId, dto)
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
  @ApiOperation({ summary: 'Mark booking as complete' })
  complete(@Param('id') id: string, @Request() req: any) {
    return this.service.complete(id, req.user.professionalId)
  }
}
