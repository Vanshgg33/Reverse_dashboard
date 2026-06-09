import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';

@ApiTags('dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @ApiOperation({ summary: 'Get operations dashboard statistics' })
  @ApiResponse({
    status: 200,
    description: 'Aggregated stats: totals, breakdowns, recent bookings',
  })
  getDashboard(): Promise<any> {
    return this.dashboardService.getStats();
  }
}
