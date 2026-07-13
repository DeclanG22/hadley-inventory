import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, Query } from '@nestjs/common';
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
  findAll(@Query('q') q?: string) {
    return this.toolsService.findAll(q);
  }

  // Static routes — must come before @Get(':id')
  @Get('deleted')
  findDeleted() {
    return this.toolsService.findDeleted();
  }

  @Get('costing')
  costing(@Query('dateFrom') dateFrom?: string, @Query('dateTo') dateTo?: string) {
    return this.toolsService.findCosting({ dateFrom, dateTo });
  }

  @Get('maintenance-costing')
  maintenanceCosting(
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('type') type?: string,
  ) {
    return this.toolsService.findMaintenanceCosting({ dateFrom, dateTo, type });
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

  @Post(':id/restore')
  restore(@Param('id', ParseIntPipe) id: number) {
    return this.toolsService.restore(id);
  }

  @Delete(':id/permanent')
  permanentRemove(@Param('id', ParseIntPipe) id: number) {
    return this.toolsService.permanentRemove(id);
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

  @Delete('checkouts/:checkoutId')
  removeCheckout(@Param('checkoutId', ParseIntPipe) checkoutId: number) {
    return this.toolsService.removeCheckout(checkoutId);
  }

  @Delete('maintenance/:maintenanceId')
  removeMaintenance(@Param('maintenanceId', ParseIntPipe) maintenanceId: number) {
    return this.toolsService.removeMaintenance(maintenanceId);
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
