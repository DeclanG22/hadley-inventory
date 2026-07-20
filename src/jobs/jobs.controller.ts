import { Controller, Get, Param, Query } from '@nestjs/common';
import { JobsService } from './jobs.service';

@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Get()
  list(@Query('q') q?: string) {
    return this.jobsService.list(q);
  }

  @Get(':jobNumber')
  getJob(@Param('jobNumber') jobNumber: string) {
    return this.jobsService.getJob(jobNumber);
  }
}
