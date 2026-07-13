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

  async findAll(q?: string, filters?: {
    categoryId?: number; vendorId?: number; locationId?: number;
    page?: number; limit?: number;
    sortBy?: string; sortOrder?: 'asc' | 'desc';
  }) {
    const where: any = { deletedAt: null };
    if (q) {
      where.OR = [
        { itemNumber: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ];
    }
    if (filters?.categoryId) where.categoryId = filters.categoryId;
    if (filters?.vendorId) where.vendorId = filters.vendorId;
    if (filters?.locationId) where.locationId = filters.locationId;

    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 100;
    const skip = (page - 1) * limit;

    const allowedSorts = ['itemNumber', 'description', 'onHand', 'unitPrice'];
    const sortBy = allowedSorts.includes(filters?.sortBy ?? '') ? filters!.sortBy! : 'itemNumber';
    const sortOrder = filters?.sortOrder === 'desc' ? 'desc' : 'asc';

    const [data, total] = await this.prisma.$transaction([
      this.prisma.item.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
        include: {
          category: true,
          subCategory: true,
          location: true,
          vendor: true,
        },
      }),
      this.prisma.item.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findLowStock() {
    const rows = await this.prisma.$queryRaw<{ id: number }[]>`
      SELECT id FROM items WHERE min_stock IS NOT NULL AND on_hand <= min_stock AND deleted_at IS NULL ORDER BY item_number ASC
    `;
    if (rows.length === 0) return [];
    return this.prisma.item.findMany({
      where: { id: { in: rows.map(r => r.id) } },
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
        transactions: { orderBy: { date: 'desc' } },
      },
    });
  }

  update(id: number, dto: UpdateItemDto) {
    const data = this.mapUpdateDto(dto);
    return this.prisma.item.update({ where: { id }, data });
  }

  remove(id: number) {
    return this.prisma.item.update({
      where: { id },
      data: { deletedAt: new Date(), removeFlag: true },
    });
  }

  findDeleted() {
    return this.prisma.item.findMany({
      where: { deletedAt: { not: null } },
      orderBy: { deletedAt: 'desc' },
      include: { category: true, location: true, vendor: true },
    });
  }

  restore(id: number) {
    return this.prisma.item.update({
      where: { id },
      data: { deletedAt: null, removeFlag: false },
    });
  }

  permanentRemove(id: number) {
    return this.prisma.item.delete({ where: { id } });
  }

  // Transactions

  async createTransaction(itemId: number, dto: CreateTransactionDto) {
    const item = await this.prisma.item.findUniqueOrThrow({ where: { id: itemId }, select: { unitPrice: true } });
    const unitPrice = dto.unitPrice ?? item.unitPrice ?? undefined;
    const qtyAbs = Math.abs(dto.quantityInOut);
    const totalCost = dto.totalCost ?? (unitPrice ? Number(unitPrice) * qtyAbs : undefined);
    const [transaction] = await this.prisma.$transaction([
      this.prisma.itemTransaction.create({
        data: {
          itemId,
          jobNumber: dto.jobNumber,
          date: new Date(dto.date + 'T00:00:00'),
          quantityInOut: dto.quantityInOut,
          unitPrice,
          totalCost,
          notes: dto.notes,
        },
      }),
      this.prisma.item.update({
        where: { id: itemId },
        data: {
          onHand: { increment: dto.quantityInOut },
          lastQtyInOut: dto.quantityInOut,
          lastJobNumber: dto.jobNumber,
        },
      }),
    ]);
    return this.prisma.itemTransaction.findUnique({
      where: { id: transaction.id },
      include: { item: true },
    });
  }

  async findAllTransactions(filters: { dateFrom?: string; dateTo?: string; jobNumber?: string }) {
    const where: any = {};

    if (filters.dateFrom || filters.dateTo) {
      where.date = {};
      if (filters.dateFrom) where.date.gte = new Date(filters.dateFrom + 'T00:00:00');
      if (filters.dateTo) where.date.lte = new Date(filters.dateTo + 'T23:59:59');
    }

    if (filters.jobNumber) {
      where.jobNumber = { contains: filters.jobNumber, mode: 'insensitive' };
    }

    return this.prisma.itemTransaction.findMany({
      where,
      orderBy: { date: 'desc' },
      include: {
        item: { select: { id: true, itemNumber: true, description: true, unitPrice: true } },
      },
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
