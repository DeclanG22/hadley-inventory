import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateToolDto } from './dto/create-tool.dto';
import { UpdateToolDto } from './dto/update-tool.dto';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { CheckinDto } from './dto/checkin.dto';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto';
import { BatchCreateToolDto } from './dto/batch-create-tool.dto';

@Injectable()
export class ToolsService {
  constructor(private readonly prisma: PrismaService) {}

  markPrinted(ids: number[]) {
    return this.prisma.tool.updateMany({
      where: { id: { in: ids } },
      data: { labelPrinted: true },
    });
  }

  create(dto: CreateToolDto) {
    return this.prisma.tool.create({ data: dto });
  }

  async batchCreate(dto: BatchCreateToolDto) {
    const lastTool = await this.prisma.tool.findFirst({
      where: { toolNumber: { startsWith: dto.toolNumberPrefix } },
      orderBy: { toolNumber: 'desc' },
      select: { toolNumber: true },
    });

    let nextNum = 1;
    if (lastTool) {
      const match = lastTool.toolNumber.match(/-(\d+)$/);
      if (match) nextNum = parseInt(match[1], 10) + 1;
    }

    const data: any[] = [];
    for (let i = 0; i < dto.quantity; i++) {
      data.push({
        toolNumber: `${dto.toolNumberPrefix}-${String(nextNum + i).padStart(3, '0')}`,
        name: dto.name,
        description: dto.description,
        brand: dto.brand,
        model: dto.model,
        serialNumber: dto.serialNumber,
        imageUrl: dto.imageUrl,
        notes: dto.notes,
        categoryId: dto.categoryId,
        locationId: dto.locationId,
      });
    }

    await this.prisma.tool.createMany({ data });
    return this.prisma.tool.findMany({
      where: { toolNumber: { startsWith: dto.toolNumberPrefix } },
      orderBy: { toolNumber: 'desc' },
      take: dto.quantity,
    });
  }

  async findAll(q?: string, filters?: {
    labelPrinted?: boolean;
    page?: number; limit?: number;
    sortBy?: string; sortOrder?: 'asc' | 'desc';
  }) {
    const where: any = { deletedAt: null };
    if (q) {
      where.OR = [
        { toolNumber: { contains: q, mode: 'insensitive' } },
        { name: { contains: q, mode: 'insensitive' } },
        { brand: { contains: q, mode: 'insensitive' } },
        { model: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ];
    }
    if (filters?.labelPrinted !== undefined) where.labelPrinted = filters.labelPrinted;

    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 100;
    const skip = (page - 1) * limit;

    const allowedSorts = ['toolNumber', 'name', 'brand', 'model'];
    const sortBy = allowedSorts.includes(filters?.sortBy ?? '') ? filters!.sortBy! : 'name';
    const sortOrder = filters?.sortOrder === 'desc' ? 'desc' : 'asc';

    const [data, total] = await this.prisma.$transaction([
      this.prisma.tool.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
        include: {
          category: true,
          location: true,
          checkouts: {
            where: { checkedInAt: null },
            take: 1,
            orderBy: { checkedOutAt: 'desc' },
          },
        },
      }),
      this.prisma.tool.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  findOne(id: number) {
    return this.prisma.tool.findUniqueOrThrow({
      where: { id },
      include: {
        category: true,
        location: true,
        checkouts: {
          orderBy: { checkedOutAt: 'desc' },
        },
        maintenance: {
          orderBy: { date: 'desc' },
        },
      },
    });
  }

  update(id: number, dto: UpdateToolDto) {
    return this.prisma.tool.update({ where: { id }, data: dto });
  }

  remove(id: number) {
    return this.prisma.tool.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  findOverdue() {
    return this.prisma.toolCheckout.findMany({
      where: {
        checkedInAt: null,
        expectedReturnAt: { not: null, lt: new Date() },
      },
      orderBy: { expectedReturnAt: 'asc' },
      include: {
        tool: { select: { id: true, toolNumber: true, name: true } },
      },
    });
  }

  findDeleted() {
    return this.prisma.tool.findMany({
      where: { deletedAt: { not: null } },
      orderBy: { deletedAt: 'desc' },
      include: { category: true, location: true },
    });
  }

  restore(id: number) {
    return this.prisma.tool.update({
      where: { id },
      data: { deletedAt: null },
    });
  }

  permanentRemove(id: number) {
    return this.prisma.tool.delete({ where: { id } });
  }

  // Checkouts

  async checkout(id: number, dto: CreateCheckoutDto) {
    const tool = await this.prisma.tool.findUnique({
      where: { id },
      include: {
        checkouts: {
          where: { checkedInAt: null },
          take: 1,
        },
      },
    });

    if (!tool) throw new NotFoundException();
    if (tool.checkouts.length > 0) {
      throw new BadRequestException('Tool is already checked out');
    }

    return this.prisma.toolCheckout.create({
      data: {
        toolId: id,
        checkedOutBy: dto.checkedOutBy,
        jobNumber: dto.jobNumber,
        jobSite: dto.jobSite,
        expectedReturnAt: dto.expectedReturnAt ? new Date(dto.expectedReturnAt) : undefined,
        notes: dto.notes,
      },
      include: { tool: true },
    });
  }

  async checkin(id: number, dto: CheckinDto) {
    const open = await this.prisma.toolCheckout.findFirst({
      where: { toolId: id, checkedInAt: null },
      orderBy: { checkedOutAt: 'desc' },
    });

    if (!open) {
      throw new BadRequestException('Tool is not currently checked out');
    }

    return this.prisma.toolCheckout.update({
      where: { id: open.id },
      data: {
        checkedInAt: new Date(),
        notes: dto.notes ?? undefined,
      },
      include: { tool: true },
    });
  }

  findCheckouts(id: number) {
    return this.prisma.toolCheckout.findMany({
      where: { toolId: id },
      orderBy: { checkedOutAt: 'desc' },
    });
  }

  async removeCheckout(checkoutId: number) {
    const co = await this.prisma.toolCheckout.findUnique({ where: { id: checkoutId } });
    if (!co) throw new NotFoundException();
    return this.prisma.toolCheckout.delete({ where: { id: checkoutId }, include: { tool: true } });
  }

  async removeMaintenance(maintenanceId: number) {
    const m = await this.prisma.toolMaintenanceLog.findUnique({ where: { id: maintenanceId } });
    if (!m) throw new NotFoundException();
    return this.prisma.toolMaintenanceLog.delete({ where: { id: maintenanceId } });
  }

  // Combined costing — purchase records + maintenance records

  async findCosting(filters: { dateFrom?: string; dateTo?: string }) {
    const whereMaint: any = {};
    if (filters.dateFrom || filters.dateTo) {
      whereMaint.date = {};
      if (filters.dateFrom) whereMaint.date.gte = new Date(filters.dateFrom + 'T00:00:00');
      if (filters.dateTo) whereMaint.date.lte = new Date(filters.dateTo + 'T23:59:59');
    }

    const [tools, maints] = await Promise.all([
      this.prisma.tool.findMany({
        select: { id: true, toolNumber: true, name: true, brand: true, model: true, purchaseCost: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.toolMaintenanceLog.findMany({
        where: whereMaint,
        orderBy: { date: 'desc' },
        include: {
          tool: { select: { id: true, toolNumber: true, name: true } },
        },
      }),
    ]);

    const records: any[] = [];

    for (const t of tools) {
      if (!t.purchaseCost) continue;
      records.push({
        date: t.createdAt,
        type: 'purchase',
        toolId: t.id,
        toolNumber: t.toolNumber,
        toolName: t.name,
        description: t.brand && t.model ? `${t.brand} ${t.model}` : (t.brand ?? t.model ?? ''),
        performedBy: null,
        cost: Number(t.purchaseCost),
      });
    }

    for (const m of maints) {
      records.push({
        date: m.date,
        type: m.type,
        toolId: m.tool.id,
        toolNumber: m.tool.toolNumber,
        toolName: m.tool.name,
        description: m.description ?? '',
        performedBy: m.performedBy ?? null,
        cost: m.cost ? Number(m.cost) : null,
      });
    }

    // Filter by date for purchase records (maintenance already filtered via Prisma)
    let filtered = records;
    if (filters.dateFrom) {
      const from = new Date(filters.dateFrom + 'T00:00:00');
      filtered = filtered.filter(r => r.date >= from);
    }
    if (filters.dateTo) {
      const to = new Date(filters.dateTo + 'T23:59:59');
      filtered = filtered.filter(r => r.date <= to);
    }

    filtered.sort((a, b) => b.date.getTime() - a.date.getTime());
    return filtered;
  }

  // Maintenance costing

  async findMaintenanceCosting(filters: { dateFrom?: string; dateTo?: string; type?: string }) {
    const where: any = {};

    if (filters.dateFrom || filters.dateTo) {
      where.date = {};
      if (filters.dateFrom) where.date.gte = new Date(filters.dateFrom + 'T00:00:00');
      if (filters.dateTo) where.date.lte = new Date(filters.dateTo + 'T23:59:59');
    }

    if (filters.type) {
      where.type = filters.type;
    }

    return this.prisma.toolMaintenanceLog.findMany({
      where,
      orderBy: { date: 'desc' },
      include: {
        tool: { select: { id: true, toolNumber: true, name: true, purchaseCost: true } },
      },
    });
  }

  // Maintenance

  createMaintenance(id: number, dto: CreateMaintenanceDto) {
    return this.prisma.toolMaintenanceLog.create({
      data: {
        toolId: id,
        type: dto.type,
        description: dto.description,
        date: new Date(dto.date),
        performedBy: dto.performedBy,
        cost: dto.cost,
        notes: dto.notes,
      },
      include: { tool: true },
    });
  }

  findMaintenance(id: number) {
    return this.prisma.toolMaintenanceLog.findMany({
      where: { toolId: id },
      orderBy: { date: 'desc' },
    });
  }

  maintenanceSearch(q?: string) {
    if (!q) return [];
    return this.prisma.toolMaintenanceLog.findMany({
      where: {
        OR: [
          { type: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
        ],
      },
      orderBy: { date: 'desc' },
      take: 10,
      include: {
        tool: { select: { id: true, toolNumber: true, name: true } },
      },
    });
  }
}
