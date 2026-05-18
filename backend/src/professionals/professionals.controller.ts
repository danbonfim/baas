import { Controller, Get, Param, Query, UseGuards, Request, Patch, Body } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger'
import { ProfessionalsService } from './professionals.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'

@ApiTags('Professionals')
@Controller('professionals')
export class ProfessionalsController {
  constructor(private service: ProfessionalsService) {}

  @Get()
  @ApiOperation({ summary: 'Search professionals with filters' })
  @ApiQuery({ name: 'city', required: false })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'minPrice', required: false, type: Number })
  @ApiQuery({ name: 'maxPrice', required: false, type: Number })
  @ApiQuery({ name: 'verified', required: false, type: Boolean })
  @ApiQuery({ name: 'online', required: false, type: Boolean })
  @ApiQuery({ name: 'sortBy', required: false, enum: ['rating', 'price-asc', 'price-desc', 'newest'] })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  search(@Query() query: any) {
    return this.service.search({
      city: query.city,
      category: query.category,
      minPrice: query.minPrice ? Number(query.minPrice) : undefined,
      maxPrice: query.maxPrice ? Number(query.maxPrice) : undefined,
      verified: query.verified === 'true' ? true : undefined,
      online: query.online === 'true' ? true : undefined,
      sortBy: query.sortBy,
      page: query.page ? Number(query.page) : 1,
      limit: query.limit ? Number(query.limit) : 20,
    })
  }

  @Get('dashboard')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Professional dashboard stats' })
  async dashboard(@Request() req: any) {
    const pro = await req.user
    return this.service.getDashboardStats(pro.professionalId)
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get professional by slug' })
  findOne(@Param('slug') slug: string) {
    return this.service.findBySlug(slug)
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update professional profile' })
  updateProfile(@Request() req: any, @Body() body: any) {
    return this.service.updateProfile(req.user.professionalId, body)
  }
}
