import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { ToolCategoriesService } from './tool-categories.service';
import { CreateToolCategoryDto } from './dto/create-tool-category.dto';
import { UpdateToolCategoryDto } from './dto/update-tool-category.dto';

@Controller('tool-categories')
export class ToolCategoriesController {
  constructor(private readonly toolCategoriesService: ToolCategoriesService) {}

  @Post()
  create(@Body() dto: CreateToolCategoryDto) {
    return this.toolCategoriesService.create(dto);
  }

  @Get()
  findAll() {
    return this.toolCategoriesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.toolCategoriesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateToolCategoryDto) {
    return this.toolCategoriesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.toolCategoriesService.remove(id);
  }
}
