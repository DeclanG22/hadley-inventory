import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { ItemCategoriesService } from './item-categories.service';
import { CreateItemCategoryDto } from './dto/create-item-category.dto';
import { UpdateItemCategoryDto } from './dto/update-item-category.dto';
import { CreateItemSubCategoryDto } from './dto/create-item-sub-category.dto';

@Controller('item-categories')
export class ItemCategoriesController {
  constructor(private readonly itemCategoriesService: ItemCategoriesService) {}

  @Post()
  create(@Body() dto: CreateItemCategoryDto) {
    return this.itemCategoriesService.create(dto);
  }

  @Get()
  findAll() {
    return this.itemCategoriesService.findAll();
  }

  @Get('deleted')
  findDeleted() {
    return this.itemCategoriesService.findDeleted();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.itemCategoriesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateItemCategoryDto) {
    return this.itemCategoriesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.itemCategoriesService.remove(id);
  }

  @Post(':id/restore')
  restore(@Param('id', ParseIntPipe) id: number) {
    return this.itemCategoriesService.restore(id);
  }

  @Delete(':id/permanent')
  permanentRemove(@Param('id', ParseIntPipe) id: number) {
    return this.itemCategoriesService.permanentRemove(id);
  }

  // SubCategories nested under category
  @Post(':id/sub-categories')
  createSubCategory(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateItemSubCategoryDto,
  ) {
    return this.itemCategoriesService.createSubCategory(id, dto);
  }

  @Get(':id/sub-categories')
  findSubCategories(@Param('id', ParseIntPipe) id: number) {
    return this.itemCategoriesService.findSubCategories(id);
  }

  @Delete('sub-categories/:subId')
  removeSubCategory(@Param('subId', ParseIntPipe) subId: number) {
    return this.itemCategoriesService.removeSubCategory(subId);
  }

  @Get('sub-categories/deleted')
  findDeletedSubCategories() {
    return this.itemCategoriesService.findDeletedSubCategories();
  }

  @Post('sub-categories/:subId/restore')
  restoreSubCategory(@Param('subId', ParseIntPipe) subId: number) {
    return this.itemCategoriesService.restoreSubCategory(subId);
  }

  @Delete('sub-categories/:subId/permanent')
  permanentRemoveSubCategory(@Param('subId', ParseIntPipe) subId: number) {
    return this.itemCategoriesService.permanentRemoveSubCategory(subId);
  }
}
