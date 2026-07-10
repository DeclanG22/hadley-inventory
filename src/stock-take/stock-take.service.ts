import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStockTakeDto } from './dto/create-stock-take.dto';
import { UpdateStockTakeDto } from './dto/update-stock-take.dto';
import { UpdateStockTakeItemDto } from './dto/update-stock-take-item.dto';

@Injectable()
export class StockTakeService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateStockTakeDto) {
    const items = await this.prisma.item.findMany({
      where: { removeFlag: false },
      select: { id: true, onHand: true },
    });

    if (items.length === 0) {
      throw new BadRequestException('No items available for stock take');
    }

    return this.prisma.stockTake.create({
      data: {
        date: new Date(dto.date),
        notes: dto.notes,
        items: {
          create: items.map(i => ({
            itemId: i.id,
            systemQty: i.onHand,
          })),
        },
      },
      include: {
        items: {
          include: { item: { select: { id: true, itemNumber: true, description: true, onHand: true } } },
          orderBy: { item: { itemNumber: 'asc' } },
        },
      },
    });
  }

  findAll() {
    return this.prisma.stockTake.findMany({
      orderBy: { date: 'desc' },
      include: { _count: { select: { items: true } } },
    });
  }

  findOne(id: number) {
    return this.prisma.stockTake.findUniqueOrThrow({
      where: { id },
      include: {
        items: {
          include: { item: { select: { id: true, itemNumber: true, description: true, onHand: true, unit: true } } },
          orderBy: { item: { itemNumber: 'asc' } },
        },
      },
    });
  }

  update(id: number, dto: UpdateStockTakeDto) {
    return this.prisma.stockTake.update({
      where: { id },
      data: {
        ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
      },
    });
  }

  async remove(id: number) {
    const st = await this.prisma.stockTake.findUniqueOrThrow({
      where: { id },
      select: { status: true },
    });

    if (st.status === 'completed') {
      const items = await this.prisma.stockTakeItem.findMany({
        where: { stockTakeId: id, physicalQty: { not: null } },
        select: { itemId: true, systemQty: true, physicalQty: true, notes: true },
      });

      const reverseTxns: any[] = [];
      const reverseUpdates: { id: number; data: any }[] = [];

      for (const si of items) {
        const variance = si.physicalQty! - si.systemQty;
        if (variance === 0) continue;

        reverseTxns.push({
          itemId: si.itemId,
          jobNumber: `STOCKTAKE-${id}-REVERSED`,
          date: new Date(),
          quantityInOut: -variance,
          unitPrice: 0,
          totalCost: 0,
          notes: `Reversal of stock take #${id} (was: ${si.physicalQty}, system: ${si.systemQty})`,
        });

        reverseUpdates.push({
          id: si.itemId,
          data: { onHand: { increment: -variance } },
        });
      }

      await this.prisma.$transaction([
        ...(reverseTxns.length > 0 ? [this.prisma.itemTransaction.createMany({ data: reverseTxns })] : []),
        ...reverseUpdates.map(u => this.prisma.item.update({ where: { id: u.id }, data: u.data })),
        this.prisma.stockTake.delete({ where: { id } }),
      ]);
    } else {
      await this.prisma.stockTake.delete({ where: { id } });
    }
  }

  async updateItem(stockTakeId: number, itemId: number, dto: UpdateStockTakeItemDto) {
    const st = await this.prisma.stockTake.findUniqueOrThrow({
      where: { id: stockTakeId },
      select: { status: true },
    });
    if (st.status !== 'draft') {
      throw new BadRequestException('Can only update items in a draft stock take');
    }

    return this.prisma.stockTakeItem.update({
      where: { stockTakeId_itemId: { stockTakeId, itemId } },
      data: { physicalQty: dto.physicalQty, notes: dto.notes },
    });
  }

  async reconcile(id: number) {
    const st = await this.prisma.stockTake.findUniqueOrThrow({
      where: { id },
      select: { status: true },
    });
    if (st.status !== 'draft') {
      throw new BadRequestException('Stock take is not in draft status');
    }

    const items = await this.prisma.stockTakeItem.findMany({
      where: { stockTakeId: id, physicalQty: { not: null } },
      include: { item: { select: { id: true } } },
    });

    if (items.length === 0) {
      throw new BadRequestException('No items have been counted');
    }

    const transactions: any[] = [];
    const updates: { id: number; data: any }[] = [];

    for (const si of items) {
      const variance = si.physicalQty! - si.systemQty;
      if (variance === 0) continue;

      transactions.push({
        itemId: si.itemId,
        jobNumber: `STOCKTAKE-${id}`,
        date: new Date(),
        quantityInOut: variance,
        unitPrice: 0,
        totalCost: 0,
        notes: si.notes || `Stock take adjustment (physical: ${si.physicalQty}, system: ${si.systemQty})`,
      });

      updates.push({
        id: si.itemId,
        data: {
          onHand: { increment: variance },
          lastQtyInOut: variance,
          lastJobNumber: `STOCKTAKE-${id}`,
        },
      });
    }

    await this.prisma.$transaction([
      ...(transactions.length > 0 ? [this.prisma.itemTransaction.createMany({ data: transactions })] : []),
      this.prisma.stockTake.update({
        where: { id },
        data: { status: 'completed' },
      }),
      ...updates.map(u => this.prisma.item.update({ where: { id: u.id }, data: u.data })),
    ]);

    return this.findOne(id);
  }
}
