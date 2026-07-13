import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, Query } from '@nestjs/common';
import { ItemsService } from './items.service';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { CreateTransactionDto } from './dto/create-transaction.dto';

@Controller('items')
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  @Post()
  create(@Body() dto: CreateItemDto) {
    return this.itemsService.create(dto);
  }

  @Get()
  findAll(
    @Query('q') q?: string,
    @Query('categoryId') categoryId?: string,
    @Query('vendorId') vendorId?: string,
    @Query('locationId') locationId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string,
  ) {
    return this.itemsService.findAll(q, {
      categoryId: categoryId ? Number(categoryId) : undefined,
      vendorId: vendorId ? Number(vendorId) : undefined,
      locationId: locationId ? Number(locationId) : undefined,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      sortBy,
      sortOrder: sortOrder as 'asc' | 'desc' | undefined,
    });
  }

  @Get('low-stock')
  findLowStock() {
    return this.itemsService.findLowStock();
  }

  // Static routes — must come before @Get(':id')
  @Get('deleted')
  findDeleted() {
    return this.itemsService.findDeleted();
  }

  // All transactions (costing view) — must come before @Get(':id')
  @Get('transactions')
  findAllTransactions(
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('jobNumber') jobNumber?: string,
  ) {
    return this.itemsService.findAllTransactions({ dateFrom, dateTo, jobNumber });
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.itemsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateItemDto) {
    return this.itemsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.itemsService.remove(id);
  }

  @Post(':id/restore')
  restore(@Param('id', ParseIntPipe) id: number) {
    return this.itemsService.restore(id);
  }

  @Delete(':id/permanent')
  permanentRemove(@Param('id', ParseIntPipe) id: number) {
    return this.itemsService.permanentRemove(id);
  }

  // Transactions nested under item
  @Post(':id/transactions')
  createTransaction(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateTransactionDto,
  ) {
    return this.itemsService.createTransaction(id, dto);
  }

  @Get(':id/transactions')
  findTransactions(@Param('id', ParseIntPipe) id: number) {
    return this.itemsService.findTransactions(id);
  }

  @Delete('transactions/:transactionId')
  removeTransaction(@Param('transactionId', ParseIntPipe) transactionId: number) {
    return this.itemsService.removeTransaction(transactionId);
  }
}
