import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { LocationsService } from './locations.service';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';

@Controller('locations')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Post()
  create(@Body() dto: CreateLocationDto) {
    return this.locationsService.create(dto);
  }

  @Get()
  findAll() {
    return this.locationsService.findAll();
  }

  @Get('deleted')
  findDeleted() {
    return this.locationsService.findDeleted();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.locationsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateLocationDto) {
    return this.locationsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.locationsService.remove(id);
  }

  @Post(':id/restore')
  restore(@Param('id', ParseIntPipe) id: number) {
    return this.locationsService.restore(id);
  }

  @Delete(':id/permanent')
  permanentRemove(@Param('id', ParseIntPipe) id: number) {
    return this.locationsService.permanentRemove(id);
  }
}
