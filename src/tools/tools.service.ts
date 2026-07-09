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
        qrCode: dto.qrCode,
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

  findAll(q?: string) {
    return this.prisma.tool.findMany({
      where: q
        ? {
            OR: [
              { toolNumber: { contains: q, mode: 'insensitive' } },
              { name: { contains: q, mode: 'insensitive' } },
              { brand: { contains: q, mode: 'insensitive' } },
              { model: { contains: q, mode: 'insensitive' } },
              { description: { contains: q, mode: 'insensitive' } },
            ],
          }
        : undefined,
      orderBy: { name: 'asc' },
      include: {
        category: true,
        location: true,
        checkouts: {
          where: { checkedInAt: null },
          take: 1,
          orderBy: { checkedOutAt: 'desc' },
        },
      },
    });
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
}
