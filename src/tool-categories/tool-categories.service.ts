import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateToolCategoryDto } from './dto/create-tool-category.dto';
import { UpdateToolCategoryDto } from './dto/update-tool-category.dto';

@Injectable()
export class ToolCategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateToolCategoryDto) {
    return this.prisma.toolCategory.create({ data: dto });
  }

  findAll() {
    return this.prisma.toolCategory.findMany({ where: { deletedAt: null }, orderBy: { name: 'asc' } });
  }

  findOne(id: number) {
    return this.prisma.toolCategory.findUniqueOrThrow({ where: { id } });
  }

  update(id: number, dto: UpdateToolCategoryDto) {
    return this.prisma.toolCategory.update({ where: { id }, data: dto });
  }

  remove(id: number) {
    return this.prisma.toolCategory.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  findDeleted() {
    return this.prisma.toolCategory.findMany({
      where: { deletedAt: { not: null } },
      orderBy: { deletedAt: 'desc' },
    });
  }

  restore(id: number) {
    return this.prisma.toolCategory.update({ where: { id }, data: { deletedAt: null } });
  }

  permanentRemove(id: number) {
    return this.prisma.toolCategory.delete({ where: { id } });
  }
}
