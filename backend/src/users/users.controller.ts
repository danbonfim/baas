import { Controller, Get, Patch, Body, UseGuards, Request } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { PrismaService } from '../prisma.service'

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private prisma: PrismaService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get user profile' })
  async profile(@Request() req: any) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: req.user.sub },
      include: {
        client: { include: { subscription: true } },
        professional: { select: { id: true, slug: true, verified: true } },
      },
    })
    const { passwordHash, mfaSecret, ...safe } = user
    return safe
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Update user profile' })
  async updateProfile(@Request() req: any, @Body() body: { name?: string; phone?: string; avatar?: string }) {
    return this.prisma.user.update({
      where: { id: req.user.sub },
      data: body,
      select: { id: true, name: true, email: true, phone: true, avatar: true },
    })
  }
}
