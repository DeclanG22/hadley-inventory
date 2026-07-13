import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { VendorsService } from './vendors.service';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';

@Controller('vendors')
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @Post()
  create(@Body() dto: CreateVendorDto) {
    return this.vendorsService.create(dto);
  }

  @Get()
  findAll() {
    return this.vendorsService.findAll();
  }

  @Get('deleted')
  findDeleted() {
    return this.vendorsService.findDeleted();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.vendorsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateVendorDto) {
    return this.vendorsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.vendorsService.remove(id);
  }

  @Post(':id/restore')
  restore(@Param('id', ParseIntPipe) id: number) {
    return this.vendorsService.restore(id);
  }

  @Delete(':id/permanent')
  permanentRemove(@Param('id', ParseIntPipe) id: number) {
    return this.vendorsService.permanentRemove(id);
  }
}
