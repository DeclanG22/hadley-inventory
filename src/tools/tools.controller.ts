import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { ToolsService } from './tools.service';
import { CreateToolDto } from './dto/create-tool.dto';
import { UpdateToolDto } from './dto/update-tool.dto';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { CheckinDto } from './dto/checkin.dto';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto';
import { BatchCreateToolDto } from './dto/batch-create-tool.dto';

@Controller('tools')
export class ToolsController {
  constructor(private readonly toolsService: ToolsService) {}

  @Post()
  create(@Body() dto: CreateToolDto) {
    return this.toolsService.create(dto);
  }

  @Post('batch')
  batchCreate(@Body() dto: BatchCreateToolDto) {
    return this.toolsService.batchCreate(dto);
  }

  @Get()
  findAll() {
    return this.toolsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.toolsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateToolDto) {
    return this.toolsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.toolsService.remove(id);
  }

  // Checkouts
  @Post(':id/checkout')
  checkout(@Param('id', ParseIntPipe) id: number, @Body() dto: CreateCheckoutDto) {
    return this.toolsService.checkout(id, dto);
  }

  @Post(':id/checkin')
  checkin(@Param('id', ParseIntPipe) id: number, @Body() dto: CheckinDto) {
    return this.toolsService.checkin(id, dto);
  }

  @Get(':id/checkouts')
  findCheckouts(@Param('id', ParseIntPipe) id: number) {
    return this.toolsService.findCheckouts(id);
  }

  // Maintenance
  @Post(':id/maintenance')
  createMaintenance(@Param('id', ParseIntPipe) id: number, @Body() dto: CreateMaintenanceDto) {
    return this.toolsService.createMaintenance(id, dto);
  }

  @Get(':id/maintenance')
  findMaintenance(@Param('id', ParseIntPipe) id: number) {
    return this.toolsService.findMaintenance(id);
  }
}
