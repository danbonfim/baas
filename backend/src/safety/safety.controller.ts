import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation, ApiBody } from '@nestjs/swagger'
import { SafetyService } from './safety.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'

@ApiTags('Safety')
@Controller('safety')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SafetyController {
  constructor(private safety: SafetyService) {}

  // ─── Emergency Contacts ────────────────────────

  @Get('emergency-contacts')
  @ApiOperation({ summary: 'List my emergency contacts (max 3)' })
  listContacts(@Request() req: any) {
    return this.safety.listContacts(req.user.sub)
  }

  @Post('emergency-contacts')
  @ApiOperation({ summary: 'Add emergency contact' })
  @ApiBody({
    schema: {
      properties: {
        name: { type: 'string' },
        phone: { type: 'string', example: '+5511999999999' },
        relationship: { type: 'string', example: 'mãe' },
        isPrimary: { type: 'boolean' },
      },
      required: ['name', 'phone'],
    },
  })
  createContact(
    @Request() req: any,
    @Body() body: { name: string; phone: string; relationship?: string; isPrimary?: boolean },
  ) {
    return this.safety.createContact(req.user.sub, body)
  }

  @Delete('emergency-contacts/:id')
  @ApiOperation({ summary: 'Remove an emergency contact' })
  deleteContact(@Request() req: any, @Param('id') id: string) {
    return this.safety.deleteContact(req.user.sub, id)
  }

  // ─── Safety Check-ins (professional) ───────────

  @Post('checkins')
  @ApiOperation({ summary: 'Create a new safety check-in cycle (professional)' })
  @ApiBody({
    schema: {
      properties: {
        bookingId: { type: 'string', nullable: true },
        intervalMinutes: { type: 'number', example: 60 },
        lat: { type: 'number' },
        lng: { type: 'number' },
      },
    },
  })
  createCheckin(
    @Request() req: any,
    @Body() body: { bookingId?: string; intervalMinutes?: number; lat?: number; lng?: number },
  ) {
    const profId = req.user.professionalId || req.user.sub
    return this.safety.createCheckin(
      profId,
      body.bookingId || null,
      body.intervalMinutes ?? 60,
      body.lat !== undefined && body.lng !== undefined ? { lat: body.lat, lng: body.lng } : undefined,
    )
  }

  @Patch('checkins/:id/confirm')
  @ApiOperation({ summary: 'Confirm you are safe' })
  confirmCheckin(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { lat?: number; lng?: number },
  ) {
    const profId = req.user.professionalId || req.user.sub
    return this.safety.confirmCheckin(
      profId,
      id,
      body?.lat !== undefined && body?.lng !== undefined ? { lat: body.lat, lng: body.lng } : undefined,
    )
  }

  @Get('checkins/active')
  @ApiOperation({ summary: 'List active check-ins needing confirmation' })
  activeCheckins(@Request() req: any) {
    const profId = req.user.professionalId || req.user.sub
    return this.safety.listActiveCheckins(profId)
  }

  // ─── Panic Alerts ──────────────────────────────

  @Post('panic')
  @ApiOperation({ summary: 'Trigger a panic alert. Notifies emergency contacts.' })
  @ApiBody({
    schema: {
      properties: {
        lat: { type: 'number' },
        lng: { type: 'number' },
        accuracy: { type: 'number' },
        message: { type: 'string' },
        audioUrl: { type: 'string', description: 'Optional URL to recorded audio' },
        bookingId: { type: 'string' },
      },
    },
  })
  triggerPanic(
    @Request() req: any,
    @Body()
    body: { lat?: number; lng?: number; accuracy?: number; message?: string; audioUrl?: string; bookingId?: string },
  ) {
    return this.safety.triggerPanic(req.user.sub, body)
  }

  @Patch('panic/:id/resolve')
  @ApiOperation({ summary: 'Mark a panic alert as resolved or false-alarm' })
  @ApiBody({
    schema: {
      properties: {
        resolution: { type: 'string', enum: ['RESOLVED', 'FALSE_ALARM'] },
        note: { type: 'string' },
      },
      required: ['resolution'],
    },
  })
  resolvePanic(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { resolution: 'RESOLVED' | 'FALSE_ALARM'; note?: string },
  ) {
    return this.safety.resolveAlert(req.user.sub, id, body.resolution, body.note)
  }

  @Get('panic')
  @ApiOperation({ summary: 'List my recent panic alerts' })
  listPanic(@Request() req: any) {
    return this.safety.listAlerts(req.user.sub)
  }

  // ─── Client Verification ───────────────────────

  @Get('clients/:clientId/profile')
  @ApiOperation({
    summary: 'Get client public reputation profile (for professional decision-making before accepting a booking)',
  })
  clientProfile(@Request() req: any, @Param('clientId') clientId: string) {
    const profId = req.user.professionalId || req.user.sub
    return this.safety.getClientPublicProfile(clientId, profId)
  }

  @Post('clients/:clientId/block')
  @ApiOperation({ summary: 'Block a client (professional)' })
  blockClient(@Request() req: any, @Param('clientId') clientId: string, @Body('reason') reason?: string) {
    const profId = req.user.professionalId || req.user.sub
    return this.safety.blockClient(profId, clientId, reason)
  }

  @Delete('clients/:clientId/block')
  @ApiOperation({ summary: 'Unblock a client' })
  unblockClient(@Request() req: any, @Param('clientId') clientId: string) {
    const profId = req.user.professionalId || req.user.sub
    return this.safety.unblockClient(profId, clientId)
  }

  @Get('blocked-clients')
  @ApiOperation({ summary: 'List all clients I have blocked' })
  blockedList(@Request() req: any) {
    const profId = req.user.professionalId || req.user.sub
    return this.safety.listBlocked(profId)
  }

  @Post('client-review')
  @ApiOperation({ summary: 'Professional reviews client after a completed booking' })
  @ApiBody({
    schema: {
      properties: {
        bookingId: { type: 'string' },
        rating: { type: 'number', minimum: 1, maximum: 5 },
        punctuality: { type: 'number', minimum: 1, maximum: 5 },
        respectful: { type: 'boolean' },
        paidOnTime: { type: 'boolean' },
        comment: { type: 'string' },
      },
      required: ['bookingId', 'rating'],
    },
  })
  reviewClient(
    @Request() req: any,
    @Body()
    body: {
      bookingId: string
      rating: number
      punctuality?: number
      respectful?: boolean
      paidOnTime?: boolean
      comment?: string
    },
  ) {
    const profId = req.user.professionalId || req.user.sub
    return this.safety.createClientReview(profId, body)
  }
}
