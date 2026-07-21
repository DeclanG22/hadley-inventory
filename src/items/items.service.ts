import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { CreateTransactionDto } from './dto/create-transaction.dto';

function expandSearchQueries(q: string): string[] {
  const norm = q.replace(/\s+/g, ' ').trim();
  const results = [norm];
  const collapsed = norm.replace(/\s*([^\w\d\s])\s*/g, '$1').replace(/\s*([x×])\s*/g, '$1');
  if (collapsed !== norm) results.push(collapsed);
  const stripped = norm.replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
  if (stripped !== norm && stripped !== collapsed) results.push(stripped);
  const expanded = norm
    .replace(/(\d)\s*[x×]\s*(\d)/g, '$1 x $2')
    .replace(/(\d)\s*[x×]\s*$/g, '$1 x')
    .replace(/^\s*[x×]\s*(\d)/g, 'x $1');
  if (expanded !== norm) results.push(expanded);
  return [...new Set(results)];
}
import { Prisma } from '@prisma/client';

@Injectable()
export class ItemsService {
  constructor(private readonly prisma: PrismaService) {}

  markPrinted(ids: number[]) {
    return this.prisma.item.updateMany({
      where: { id: { in: ids } },
      data: { labelPrinted: true },
    });
  }

  create(dto: CreateItemDto) {
    const data = this.mapCreateDto(dto);
    return this.prisma.item.create({ data });
  }

  async findAll(q?: string, filters?: {
    categoryId?: number; vendorId?: number; locationId?: number;
    labelPrinted?: boolean;
    page?: number; limit?: number;
    sortBy?: string; sortOrder?: 'asc' | 'desc';
  }) {
    const where: any = { deletedAt: null };
    if (q) {
      const queries = expandSearchQueries(q);
      where.OR = queries.flatMap(v => [
        { itemNumber: { contains: v, mode: 'insensitive' } },
        { description: { contains: v, mode: 'insensitive' } },
      ]);
      const tokens = q.replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase().split(/\s+/).filter(Boolean);
      if (tokens.length > 1) {
        where.OR.push({
          AND: tokens.map(token => ({
            OR: [
              { itemNumber: { contains: token, mode: 'insensitive' } },
              { description: { contains: token, mode: 'insensitive' } },
            ]
          }))
        });
      }
    }
    if (filters?.categoryId) where.categoryId = filters.categoryId;
    if (filters?.vendorId) where.vendorId = filters.vendorId;
    if (filters?.locationId) where.locationId = filters.locationId;
    if (filters?.labelPrinted !== undefined) where.labelPrinted = filters.labelPrinted;

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

    if (q) {
      const lq = q.toLowerCase();
      data.sort((a, b) => {
        const aName = a.itemNumber.toLowerCase().includes(lq) ? 0 : 1;
        const bName = b.itemNumber.toLowerCase().includes(lq) ? 0 : 1;
        return aName - bName;
      });
    }

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

  async permanentRemove(id: number) {
    const count = await this.prisma.itemTransaction.count({ where: { itemId: id } });
    if (count > 0) {
      throw new BadRequestException(`Cannot permanently delete this item — it has ${count} transaction(s). Soft-delete it instead.`);
    }
    return this.prisma.item.delete({ where: { id } });
  }

  // Transactions

  async createTransaction(itemId: number, dto: CreateTransactionDto) {
    const item = await this.prisma.item.findUniqueOrThrow({ where: { id: itemId }, select: { unitPrice: true, onHand: true } });
    if (dto.quantityInOut < 0 && item.onHand + dto.quantityInOut < 0) {
      throw new BadRequestException(`Cannot remove ${Math.abs(dto.quantityInOut)} units — only ${item.onHand} on hand`);
    }
    const unitPrice = dto.unitPrice ?? item.unitPrice ?? undefined;
    const qtyAbs = Math.abs(dto.quantityInOut);
    const totalCost = dto.totalCost ?? (unitPrice ? Number(unitPrice) * qtyAbs : undefined);
    const previousUnitPrice = dto.unitPrice !== undefined ? item.unitPrice : undefined;
    const [transaction] = await this.prisma.$transaction([
      this.prisma.itemTransaction.create({
        data: {
          itemId,
          jobNumber: dto.jobNumber,
          date: dto.date ? new Date(dto.date + 'T' + new Date().toTimeString().slice(0, 8)) : new Date(),
          quantityInOut: dto.quantityInOut,
          unitPrice,
          totalCost,
          previousUnitPrice,
          notes: dto.notes,
        },
      }),
      this.prisma.item.update({
        where: { id: itemId },
        data: {
          onHand: { increment: dto.quantityInOut },
          lastQtyInOut: dto.quantityInOut,
          lastJobNumber: dto.jobNumber,
          ...(dto.unitPrice !== undefined ? { unitPrice: dto.unitPrice } : {}),
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
        item: { select: { id: true, itemNumber: true, description: true, unitPrice: true, analysisCode: true } },
      },
    });
  }

  findTransactions(itemId: number) {
    return this.prisma.itemTransaction.findMany({
      where: { itemId },
      orderBy: { date: 'desc' },
    });
  }

  async removeTransaction(transactionId: number) {
    const txn = await this.prisma.itemTransaction.findUnique({
      where: { id: transactionId },
      select: { itemId: true, quantityInOut: true, previousUnitPrice: true },
    });
    if (!txn) throw new NotFoundException();
    const updateData: any = { onHand: { increment: -txn.quantityInOut } };
    if (txn.previousUnitPrice !== null) {
      updateData.unitPrice = txn.previousUnitPrice;
    }
    await this.prisma.$transaction([
      this.prisma.item.update({ where: { id: txn.itemId }, data: updateData }),
      this.prisma.itemTransaction.delete({ where: { id: transactionId } }),
    ]);
    return { message: 'Transaction deleted and quantity reversed' };
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
