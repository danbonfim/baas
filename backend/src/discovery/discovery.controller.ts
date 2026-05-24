import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery, ApiBody } from '@nestjs/swagger'
import { DiscoveryService } from './discovery.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'

@ApiTags('Discovery & Matching')
@Controller('discovery')
export class DiscoveryController {
  constructor(private discovery: DiscoveryService) {}

  // ─── 1. Advanced search ─────────────────────────

  @Get('search')
  @ApiOperation({
    summary: 'Advanced search with all filters (city, category, language, service, age, price, rating, sort)',
  })
  search(@Query() query: any, @Request() req: any) {
    const filters = {
      city: query.city,
      category: query.category,
      minPrice: query.minPrice ? +query.minPrice : undefined,
      maxPrice: query.maxPrice ? +query.maxPrice : undefined,
      minAge: query.minAge ? +query.minAge : undefined,
      maxAge: query.maxAge ? +query.maxAge : undefined,
      language: query.language,
      service: query.service,
      verified: query.verified === 'true' ? true : query.verified === 'false' ? false : undefined,
      online: query.online === 'true' ? true : query.online === 'false' ? false : undefined,
      minRating: query.minRating ? +query.minRating : undefined,
      hasContent: query.hasContent === 'true',
      hasSubscription: query.hasSubscription === 'true',
      sortBy: query.sortBy,
      page: query.page ? +query.page : 1,
      limit: query.limit ? +query.limit : 20,
    }
    return this.discovery.search(filters, req.user?.sub)
  }

  // ─── 2. Nearby (proximity) ──────────────────────

  @Get('nearby')
  @ApiOperation({ summary: 'Search professionals within radius (km) of a coordinate. Default 10km, max 100km.' })
  @ApiQuery({ name: 'lat', required: true, type: Number })
  @ApiQuery({ name: 'lng', required: true, type: Number })
  @ApiQuery({ name: 'radius', required: false, type: Number, description: 'km, default 10' })
  nearby(@Query() q: any, @Request() req: any) {
    const lat = +q.lat
    const lng = +q.lng
    const radius = q.radius ? +q.radius : 10
    const filters = {
      verified: q.verified === 'true' ? true : q.verified === 'false' ? false : undefined,
      online: q.online === 'true' ? true : q.online === 'false' ? false : undefined,
      minPrice: q.minPrice ? +q.minPrice : undefined,
      maxPrice: q.maxPrice ? +q.maxPrice : undefined,
    }
    return this.discovery.searchNearby(lat, lng, radius, filters, req.user?.sub)
  }

  // ─── 3. Available now ──────────────────────────

  @Get('available-now')
  @ApiOperation({ summary: 'List professionals currently online and accepting bookings' })
  availableNow(@Query() q: any) {
    return this.discovery.availableNow({
      city: q.city,
      maxPrice: q.maxPrice ? +q.maxPrice : undefined,
      verified: q.verified === 'true' ? true : q.verified === 'false' ? false : undefined,
      lat: q.lat ? +q.lat : undefined,
      lng: q.lng ? +q.lng : undefined,
    })
  }

  // ─── 4. Preferences + Match ─────────────────────

  @Get('preferences')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[CLIENT] Get my discovery preferences' })
  getPrefs(@Request() req: any) {
    return this.discovery.getPreferences(req.user.sub)
  }

  @Patch('preferences')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[CLIENT] Update my discovery preferences' })
  @ApiBody({
    schema: {
      properties: {
        ageMin: { type: 'number', minimum: 18, maximum: 99 },
        ageMax: { type: 'number', minimum: 18, maximum: 99 },
        preferredCities: { type: 'array', items: { type: 'string' } },
        preferredCategories: { type: 'array', items: { type: 'string' } },
        preferredLanguages: { type: 'array', items: { type: 'string' } },
        preferredServices: { type: 'array', items: { type: 'string' } },
        maxPricePerHour: { type: 'number' },
        minRating: { type: 'number', minimum: 0, maximum: 5 },
        onlyVerified: { type: 'boolean' },
        preferOnline: { type: 'boolean' },
      },
    },
  })
  setPrefs(@Request() req: any, @Body() body: any) {
    return this.discovery.setPreferences(req.user.sub, body)
  }

  @Get('for-you')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[CLIENT] Get personalized matches based on my preferences (score-ranked)' })
  forYou(@Request() req: any, @Query('limit') limit?: string) {
    return this.discovery.matchForMe(req.user.sub, limit ? +limit : 20)
  }

  // ─── 5. Travel Mode ─────────────────────────────

  @Post('travel-mode')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[PROFESSIONAL] Enable travel mode for a specific city/date range' })
  @ApiBody({
    schema: {
      properties: {
        city: { type: 'string' },
        state: { type: 'string' },
        country: { type: 'string', default: 'BR' },
        lat: { type: 'number' },
        lng: { type: 'number' },
        startsAt: { type: 'string', format: 'date-time' },
        endsAt: { type: 'string', format: 'date-time' },
        notes: { type: 'string' },
      },
      required: ['city', 'state', 'startsAt', 'endsAt'],
    },
  })
  enableTravel(@Request() req: any, @Body() body: any) {
    return this.discovery.enableTravelMode(req.user.sub, body)
  }

  @Delete('travel-mode/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[PROFESSIONAL] Disable a specific travel mode' })
  disableTravel(@Request() req: any, @Param('id') id: string) {
    return this.discovery.disableTravelMode(req.user.sub, id)
  }

  @Get('travel-mode/mine')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[PROFESSIONAL] List my travel modes' })
  myTravels(@Request() req: any) {
    return this.discovery.myTravelModes(req.user.sub)
  }

  @Get('travel-mode/coming-to/:city')
  @ApiOperation({ summary: 'Public: list professionals traveling to a city in the next 7 days' })
  comingTo(@Param('city') city: string) {
    return this.discovery.travelingTo(city)
  }

  // ─── 6. Recommendations ─────────────────────────

  @Get('recommendations')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '[CLIENT] "Clients who booked X also booked Y" — collaborative filtering recommendations',
  })
  recommendations(@Request() req: any, @Query('limit') limit?: string) {
    return this.discovery.recommendationsFor(req.user.sub, limit ? +limit : 10)
  }

  // ─── 7. Online status ──────────────────────────

  @Patch('online-status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[PROFESSIONAL] Toggle online status — controls appearance in "Available Now"' })
  @ApiBody({ schema: { properties: { online: { type: 'boolean' } }, required: ['online'] } })
  setOnline(@Request() req: any, @Body('online') online: boolean) {
    return this.discovery.setOnlineStatus(req.user.sub, online)
  }

  // ─── 8. Location update ────────────────────────

  @Patch('location')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[PROFESSIONAL] Update my current lat/lng (used in nearby search)' })
  @ApiBody({ schema: { properties: { lat: { type: 'number' }, lng: { type: 'number' } }, required: ['lat', 'lng'] } })
  updateLocation(@Request() req: any, @Body() body: { lat: number; lng: number }) {
    return this.discovery.updateLocation(req.user.sub, body.lat, body.lng)
  }
}
