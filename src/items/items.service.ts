import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ItemsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateItemDto) {
    const data = this.mapCreateDto(dto);
    return this.prisma.item.create({ data });
  }

  findAll() {
    return this.prisma.item.findMany({
      orderBy: { itemNumber: 'asc' },
      include: {
        category: true,
        subCategory: true,
        location: true,
        vendor: true,
      },
    });
  }

  findOne(id: number) {
    return this.prisma.item.findUniqueOrThrow({
      where: { id },
      include: {
        category: true,
        subCategory: true,
        location: true,
        vendor: true,
      },
    });
  }

  update(id: number, dto: UpdateItemDto) {
    const data = this.mapUpdateDto(dto);
    return this.prisma.item.update({ where: { id }, data });
  }

  remove(id: number) {
    return this.prisma.item.delete({ where: { id } });
  }

  // Transactions

  createTransaction(itemId: number, dto: CreateTransactionDto) {
    return this.prisma.itemTransaction.create({
      data: {
        itemId,
        jobNumber: dto.jobNumber,
        date: new Date(dto.date),
        quantityInOut: dto.quantityInOut,
        unitPrice: dto.unitPrice,
        totalCost: dto.totalCost,
        notes: dto.notes,
      },
      include: { item: true },
    });
  }

  findTransactions(itemId: number) {
    return this.prisma.itemTransaction.findMany({
      where: { itemId },
      orderBy: { date: 'desc' },
    });
  }

  // Helpers

  private mapCreateDto(dto: CreateItemDto): Prisma.ItemCreateInput {
    const { dateAdded, dateDisbursed, ...rest } = dto;
    return {
      ...rest,
      dateAdded: dateAdded ? new Date(dateAdded) : undefined,
      dateDisbursed: dateDisbursed ? new Date(dateDisbursed) : undefined,
    } as Prisma.ItemCreateInput;
  }

  private mapUpdateDto(dto: UpdateItemDto): Prisma.ItemUpdateInput {
    const { dateAdded, dateDisbursed, ...rest } = dto;
    const data: Prisma.ItemUpdateInput = { ...rest };
    if (dateAdded !== undefined) {
      data.dateAdded = dateAdded ? new Date(dateAdded) : null;
    }
    if (dateDisbursed !== undefined) {
      data.dateDisbursed = dateDisbursed ? new Date(dateDisbursed) : null;
    }
    return data;
  }
}
