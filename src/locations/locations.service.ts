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
    return this.prisma.location.findMany({ orderBy: { name: 'asc' } });
  }

  findOne(id: number) {
    return this.prisma.location.findUniqueOrThrow({ where: { id } });
  }

  update(id: number, dto: UpdateLocationDto) {
    return this.prisma.location.update({ where: { id }, data: dto });
  }

  remove(id: number) {
    return this.prisma.location.delete({ where: { id } });
  }
}
