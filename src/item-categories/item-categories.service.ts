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
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
      include: {
        subCategories: { where: { deletedAt: null } },
      },
    });
  }

  findOne(id: number) {
    return this.prisma.itemCategory.findUniqueOrThrow({
      where: { id },
      include: {
        subCategories: { where: { deletedAt: null } },
        items: {
          where: { deletedAt: null },
          include: { subCategory: true, location: true, vendor: true },
          orderBy: { itemNumber: 'asc' },
        },
      },
    });
  }

  update(id: number, dto: UpdateItemCategoryDto) {
    return this.prisma.itemCategory.update({ where: { id }, data: dto });
  }

  remove(id: number) {
    return this.prisma.itemCategory.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  findDeleted() {
    return this.prisma.itemCategory.findMany({
      where: { deletedAt: { not: null } },
      orderBy: { deletedAt: 'desc' },
    });
  }

  restore(id: number) {
    return this.prisma.itemCategory.update({ where: { id }, data: { deletedAt: null } });
  }

  permanentRemove(id: number) {
    return this.prisma.itemCategory.delete({ where: { id } });
  }

  // SubCategories

  createSubCategory(categoryId: number, dto: CreateItemSubCategoryDto) {
    return this.prisma.itemSubCategory.create({
      data: { name: dto.name, itemCategoryId: categoryId },
      include: { itemCategory: true },
    });
  }

  findSubCategories(categoryId: number) {
    return this.prisma.itemSubCategory.findMany({
      where: { itemCategoryId: categoryId, deletedAt: null },
      orderBy: { name: 'asc' },
    });
  }

  async removeSubCategory(id: number) {
    const sub = await this.prisma.itemSubCategory.findUnique({ where: { id } });
    if (!sub) throw new NotFoundException();
    return this.prisma.itemSubCategory.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  findDeletedSubCategories() {
    return this.prisma.itemSubCategory.findMany({
      where: { deletedAt: { not: null } },
      orderBy: { deletedAt: 'desc' },
      include: { itemCategory: true },
    });
  }

  restoreSubCategory(id: number) {
    return this.prisma.itemSubCategory.update({ where: { id }, data: { deletedAt: null } });
  }

  permanentRemoveSubCategory(id: number) {
    return this.prisma.itemSubCategory.delete({ where: { id } });
  }
}
