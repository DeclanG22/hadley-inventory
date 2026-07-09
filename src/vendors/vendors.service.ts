import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';

@Injectable()
export class VendorsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateVendorDto) {
    return this.prisma.vendor.create({ data: dto });
  }

  findAll() {
    return this.prisma.vendor.findMany({ orderBy: { name: 'asc' } });
  }

  findOne(id: number) {
    return this.prisma.vendor.findUniqueOrThrow({ where: { id } });
  }

  update(id: number, dto: UpdateVendorDto) {
    return this.prisma.vendor.update({ where: { id }, data: dto });
  }

  remove(id: number) {
    return this.prisma.vendor.delete({ where: { id } });
  }
}
