import { Controller, Get, Query } from '@nestjs/common';
import { ActivityService } from './activity.service';

@Controller('activity')
export class ActivityController {
  constructor(private readonly activity: ActivityService) {}

  @Get('recent')
  getRecent(@Query('limit') limit?: string) {
    return this.activity.getRecent(limit ? Number(limit) : 20);
  }
}
