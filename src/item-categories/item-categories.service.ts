import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateItemCategoryDto } from './dto/create-item-category.dto';
import { UpdateItemCategoryDto } from './dto/update-item-category.dto';
import { CreateItemSubCategoryDto } from './dto/create-item-sub-category.dto';

@Injectable()
export class ItemCategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateItemCategoryDto) {
    return this.prisma.itemCategory.create({ data: dto });
  }

  findAll() {
    return this.prisma.itemCategory.findMany({
      orderBy: { name: 'asc' },
      include: { subCategories: true },
    });
  }

  findOne(id: number) {
    return this.prisma.itemCategory.findUniqueOrThrow({
      where: { id },
      include: { subCategories: true },
    });
  }

  update(id: number, dto: UpdateItemCategoryDto) {
    return this.prisma.itemCategory.update({ where: { id }, data: dto });
  }

  remove(id: number) {
    return this.prisma.itemCategory.delete({ where: { id } });
  }

  // SubCategories

  createSubCategory(dto: CreateItemSubCategoryDto) {
    return this.prisma.itemSubCategory.create({
      data: dto,
      include: { itemCategory: true },
    });
  }

  findSubCategories(categoryId: number) {
    return this.prisma.itemSubCategory.findMany({
      where: { itemCategoryId: categoryId },
      orderBy: { name: 'asc' },
    });
  }

  async removeSubCategory(id: number) {
    const sub = await this.prisma.itemSubCategory.findUnique({ where: { id } });
    if (!sub) throw new NotFoundException();
    return this.prisma.itemSubCategory.delete({ where: { id } });
  }
}
