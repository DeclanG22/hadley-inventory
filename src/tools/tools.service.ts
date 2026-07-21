import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateToolDto } from './dto/create-tool.dto';
import { UpdateToolDto } from './dto/update-tool.dto';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { CheckinDto } from './dto/checkin.dto';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto';
import { BatchCreateToolDto } from './dto/batch-create-tool.dto';

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

async function nextHeNumber(prisma: PrismaService): Promise<number | null> {
  const all = await prisma.tool.findMany({
    where: { heNumber: { not: null } },
    select: { heNumber: true },
  });
  const nums = all
    .map(t => t.heNumber!)
    .filter(n => n != null);
  if (nums.length === 0) return null;
  return Math.max(...nums) + 1;
}

@Injectable()
export class ToolsService {
  constructor(private readonly prisma: PrismaService) {}

  markPrinted(ids: number[]) {
    return this.prisma.tool.updateMany({
      where: { id: { in: ids } },
      data: { labelPrinted: true },
    });
  }

  async create(dto: CreateToolDto) {
    if (!dto.heNumber) {
      const next = await nextHeNumber(this.prisma);
      if (next) dto.heNumber = next;
    }
    return this.prisma.tool.create({ data: dto as any });
  }

  async batchCreate(dto: BatchCreateToolDto) {
    const data: any[] = [];
    for (let i = 0; i < dto.quantity; i++) {
      let heNum: number | undefined;
      if (dto.heNumberStart !== undefined) {
        heNum = dto.heNumberStart + i;
      }
      data.push({
        name: dto.name,
        description: dto.description,
        heNumber: heNum,
        serialNumber: dto.serialNumber,
        imageUrl: dto.imageUrl,
        notes: dto.notes,
        vendorId: dto.vendorId,
        locationId: dto.locationId,
      });
    }

    await this.prisma.tool.createMany({ data });
    return this.prisma.tool.findMany({
      orderBy: { id: 'desc' },
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
      const queries = expandSearchQueries(q);
      const heNum = parseInt(q, 10);
      const heWhere = !isNaN(heNum) ? { heNumber: heNum } : null;
      where.OR = queries.flatMap(v => [
        { name: { contains: v, mode: 'insensitive' } },
        { description: { contains: v, mode: 'insensitive' } },
        ...(heWhere ? [heWhere] : []),
      ]);
      const tokens = q.replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase().split(/\s+/).filter(Boolean);
      if (tokens.length > 1) {
        where.OR.push({
          AND: tokens.map(token => ({
            OR: [
              { name: { contains: token, mode: 'insensitive' } },
              { description: { contains: token, mode: 'insensitive' } },
            ]
          }))
        });
      }
    }
    if (filters?.labelPrinted !== undefined) where.labelPrinted = filters.labelPrinted;

    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 100;
    const skip = (page - 1) * limit;

    const allowedSorts = ['name', 'heNumber'];
    const sortBy = allowedSorts.includes(filters?.sortBy ?? '') ? filters!.sortBy! : 'name';
    const sortOrder = filters?.sortOrder === 'desc' ? 'desc' : 'asc';

    const [data, total] = await this.prisma.$transaction([
      this.prisma.tool.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
        include: {
          vendor: true,
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

    if (q) {
      const lq = q.toLowerCase();
      data.sort((a, b) => {
        const aName = a.name.toLowerCase().includes(lq) ? 0 : 1;
        const bName = b.name.toLowerCase().includes(lq) ? 0 : 1;
        return aName - bName;
      });
    }

    return { data, total, page, limit };
  }

  findOne(id: number) {
    return this.prisma.tool.findUniqueOrThrow({
      where: { id },
      include: {
        vendor: true,
        location: true,
        checkouts: {
          orderBy: { checkedOutAt: 'desc' },
        },
        maintenance: {
          orderBy: { date: 'desc' },
        },
        maintenanceFlags: {
          where: { resolvedAt: null },
          orderBy: { createdAt: 'desc' },
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
        tool: { select: { id: true, name: true } },
      },
    });
  }

  findDeleted() {
    return this.prisma.tool.findMany({
      where: { deletedAt: { not: null } },
      orderBy: { deletedAt: 'desc' },
      include: { vendor: true, location: true },
    });
  }

  restore(id: number) {
    return this.prisma.tool.update({
      where: { id },
      data: { deletedAt: null },
    });
  }

  async permanentRemove(id: number) {
    const [checkoutCount, maintCount, flagCount] = await Promise.all([
      this.prisma.toolCheckout.count({ where: { toolId: id } }),
      this.prisma.toolMaintenanceLog.count({ where: { toolId: id } }),
      this.prisma.toolMaintenanceFlag.count({ where: { toolId: id } }),
    ]);
    if (checkoutCount + maintCount + flagCount > 0) {
      const parts: string[] = [];
      if (checkoutCount > 0) parts.push(`${checkoutCount} checkout(s)`);
      if (maintCount > 0) parts.push(`${maintCount} maintenance record(s)`);
      if (flagCount > 0) parts.push(`${flagCount} flag(s)`);
      throw new BadRequestException(`Cannot permanently delete this tool — it has ${parts.join(', ')}. Soft-delete it instead.`);
    }
    return this.prisma.tool.delete({ where: { id } });
  }

  decommission(id: number) {
    return this.prisma.tool.update({
      where: { id },
      data: { decommissionedAt: new Date() },
    });
  }

  reactivate(id: number) {
    return this.prisma.tool.update({
      where: { id },
      data: { decommissionedAt: null },
    });
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
    if (tool.decommissionedAt) {
      throw new BadRequestException('Cannot check out a decommissioned tool');
    }
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

  // Combined costing

  async findCosting(filters: { dateFrom?: string; dateTo?: string }) {
    const whereMaint: any = {};
    if (filters.dateFrom || filters.dateTo) {
      whereMaint.date = {};
      if (filters.dateFrom) whereMaint.date.gte = new Date(filters.dateFrom + 'T00:00:00');
      if (filters.dateTo) whereMaint.date.lte = new Date(filters.dateTo + 'T23:59:59');
    }

    const [tools, maints] = await Promise.all([
      this.prisma.tool.findMany({
        select: { id: true, name: true, purchaseCost: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.toolMaintenanceLog.findMany({
        where: whereMaint,
        orderBy: { date: 'desc' },
        include: {
          tool: { select: { id: true, name: true } },
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
        toolName: t.name,
        description: '',
        performedBy: null,
        cost: Number(t.purchaseCost),
      });
    }

    for (const m of maints) {
      records.push({
        date: m.date,
        type: m.type,
        toolId: m.tool.id,
        toolName: m.tool.name,
        description: m.description ?? '',
        performedBy: m.performedBy ?? null,
        cost: m.cost ? Number(m.cost) : null,
      });
    }

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
        tool: { select: { id: true, name: true, purchaseCost: true } },
      },
    });
  }

  // Maintenance

  async createMaintenance(id: number, dto: CreateMaintenanceDto) {
    const data: any = {
      toolId: id,
      type: dto.type,
      description: dto.description,
      date: new Date(dto.date),
      performedBy: dto.performedBy,
      cost: dto.cost,
      notes: dto.notes,
    };
    if (dto.flagId) {
      data.flagId = dto.flagId;
    }
    const log = await this.prisma.toolMaintenanceLog.create({
      data,
      include: { tool: true },
    });
    if (dto.flagId) {
      await this.prisma.toolMaintenanceFlag.update({
        where: { id: dto.flagId },
        data: { resolvedAt: new Date(), resolvedBy: dto.performedBy ?? 'system' },
      });
    }
    return log;
  }

  findMaintenance(id: number) {
    return this.prisma.toolMaintenanceLog.findMany({
      where: { toolId: id },
      orderBy: { date: 'desc' },
    });
  }

  // Maintenance Flags

  createFlag(toolId: number, dto: { type: string; description?: string; createdBy?: string }) {
    return this.prisma.toolMaintenanceFlag.create({
      data: {
        toolId,
        type: dto.type,
        description: dto.description,
        createdBy: dto.createdBy,
      },
      include: { tool: { select: { id: true, name: true } } },
    });
  }

  findAllFlags(onlyUnresolved = false) {
    const where: any = {};
    if (onlyUnresolved) where.resolvedAt = null;
    return this.prisma.toolMaintenanceFlag.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        tool: { select: { id: true, name: true } },
      },
    });
  }

  async resolveFlag(flagId: number, resolvedBy: string) {
    const flag = await this.prisma.toolMaintenanceFlag.findUnique({ where: { id: flagId } });
    if (!flag) throw new NotFoundException();
    return this.prisma.toolMaintenanceFlag.update({
      where: { id: flagId },
      data: { resolvedAt: new Date(), resolvedBy },
      include: { tool: { select: { id: true, name: true } } },
    });
  }

  async removeFlag(flagId: number) {
    const flag = await this.prisma.toolMaintenanceFlag.findUnique({ where: { id: flagId } });
    if (!flag) throw new NotFoundException();
    return this.prisma.toolMaintenanceFlag.delete({ where: { id: flagId } });
  }

  maintenanceSearch(q?: string) {
    if (!q) return [];
    const queries = expandSearchQueries(q);
    return this.prisma.toolMaintenanceLog.findMany({
      where: {
        OR: queries.flatMap(v => [
          { type: { contains: v, mode: 'insensitive' } },
          { description: { contains: v, mode: 'insensitive' } },
        ]),
      },
      orderBy: { date: 'desc' },
      take: 10,
      include: {
        tool: { select: { id: true, name: true } },
      },
    });
  }
}
