import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { StockTakeService } from './stock-take.service';
import { CreateStockTakeDto } from './dto/create-stock-take.dto';
import { UpdateStockTakeDto } from './dto/update-stock-take.dto';
import { UpdateStockTakeItemDto } from './dto/update-stock-take-item.dto';

@Controller('stock-takes')
export class StockTakeController {
  constructor(private readonly stockTakeService: StockTakeService) {}

  @Post()
  create(@Body() dto: CreateStockTakeDto) {
    return this.stockTakeService.create(dto);
  }

  @Get()
  findAll() {
    return this.stockTakeService.findAll();
  }

  @Get('deleted')
  findDeleted() {
    return this.stockTakeService.findDeleted();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.stockTakeService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateStockTakeDto) {
    return this.stockTakeService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.stockTakeService.remove(id);
  }

  @Post(':id/restore')
  restore(@Param('id', ParseIntPipe) id: number) {
    return this.stockTakeService.restore(id);
  }

  @Delete(':id/permanent')
  permanentRemove(@Param('id', ParseIntPipe) id: number) {
    return this.stockTakeService.permanentRemove(id);
  }

  @Patch(':id/items/:itemId')
  updateItem(
    @Param('id', ParseIntPipe) id: number,
    @Param('itemId', ParseIntPipe) itemId: number,
    @Body() dto: UpdateStockTakeItemDto,
  ) {
    return this.stockTakeService.updateItem(id, itemId, dto);
  }

  @Post(':id/reconcile')
  reconcile(@Param('id', ParseIntPipe) id: number) {
    return this.stockTakeService.reconcile(id);
  }
}
