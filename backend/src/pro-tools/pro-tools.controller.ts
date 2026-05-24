import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation, ApiBody } from '@nestjs/swagger'
import { ProToolsService } from './pro-tools.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'

@ApiTags('Professional Tools')
@Controller('pro-tools')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProToolsController {
  constructor(private tools: ProToolsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: '[PROFESSIONAL] Full analytics dashboard (last N days, default 30)' })
  dashboard(@Request() req: any, @Query('days') days?: string) {
    return this.tools.getDashboard(req.user.sub, days ? +days : 30)
  }

  @Get('earnings/balance')
  @ApiOperation({ summary: '[PROFESSIONAL] Earnings balance breakdown (pending/available/paid)' })
  balance(@Request() req: any) {
    return this.tools.getEarningsBalance(req.user.sub)
  }

  @Patch('vacation')
  @ApiOperation({ summary: '[PROFESSIONAL] Toggle vacation mode (pauses profile, preserves rating)' })
  @ApiBody({
    schema: {
      properties: {
        active: { type: 'boolean' },
        until: { type: 'string', format: 'date-time', description: 'Optional return date' },
      },
      required: ['active'],
    },
  })
  vacation(@Request() req: any, @Body() body: { active: boolean; until?: string }) {
    return this.tools.setVacationMode(req.user.sub, body.active, body.until)
  }

  // Quick-reply templates
  @Get('templates')
  @ApiOperation({ summary: '[PROFESSIONAL] List my quick-reply templates' })
  templates(@Request() req: any) {
    return this.tools.getTemplates(req.user.sub)
  }

  @Post('templates')
  @ApiOperation({ summary: '[PROFESSIONAL] Create or update a quick-reply template (omit id to create)' })
  @ApiBody({
    schema: {
      properties: {
        id: { type: 'string', description: 'Omit to create new' },
        title: { type: 'string' },
        content: { type: 'string' },
      },
      required: ['title', 'content'],
    },
  })
  upsertTemplate(@Request() req: any, @Body() body: { id?: string; title: string; content: string }) {
    return this.tools.upsertTemplate(req.user.sub, body)
  }

  @Delete('templates/:id')
  @ApiOperation({ summary: '[PROFESSIONAL] Delete a quick-reply template' })
  deleteTemplate(@Request() req: any, @Param('id') id: string) {
    return this.tools.deleteTemplate(req.user.sub, id)
  }

  // Fiscal report
  @Get('fiscal-report/:year')
  @ApiOperation({ summary: '[PROFESSIONAL] Fiscal report for a year (for IR declaration)' })
  fiscal(@Request() req: any, @Param('year') year: string) {
    return this.tools.getFiscalReport(req.user.sub, +year)
  }
}
