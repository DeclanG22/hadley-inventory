import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';

@Injectable()
export class LocationsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateLocationDto) {
    return this.prisma.location.create({ data: dto });
  }

  findAll() {
    return this.prisma.location.findMany({ where: { deletedAt: null }, orderBy: { name: 'asc' } });
  }

  findOne(id: number) {
    return this.prisma.location.findUniqueOrThrow({
      where: { id },
      include: {
        items: {
          where: { deletedAt: null },
          include: { category: true, vendor: true, subCategory: true },
          orderBy: { itemNumber: 'asc' },
        },
        tools: {
          where: { deletedAt: null },
          include: { category: true, checkouts: { where: { checkedInAt: null } } },
          orderBy: { toolNumber: 'asc' },
        },
      },
    });
  }

  update(id: number, dto: UpdateLocationDto) {
    return this.prisma.location.update({ where: { id }, data: dto });
  }

  remove(id: number) {
    return this.prisma.location.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  findDeleted() {
    return this.prisma.location.findMany({
      where: { deletedAt: { not: null } },
      orderBy: { deletedAt: 'desc' },
    });
  }

  restore(id: number) {
    return this.prisma.location.update({ where: { id }, data: { deletedAt: null } });
  }

  permanentRemove(id: number) {
    return this.prisma.location.delete({ where: { id } });
  }
}
