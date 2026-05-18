import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common'
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger'
import { ReviewsService } from './reviews.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private service: ReviewsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  create(@Request() req: any, @Body() dto: { bookingId: string; rating: number; comment?: string }) {
    return this.service.createReview(req.user.sub, dto)
  }

  @Get('professional/:id')
  getProfessionalReviews(@Param('id') id: string) {
    return this.service.getProfessionalReviews(id)
  }

  @Get('reviewable')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  getReviewable(@Request() req: any) {
    return this.service.getReviewableBookings(req.user.sub)
  }
}
