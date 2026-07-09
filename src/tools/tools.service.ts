import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateToolDto } from './dto/create-tool.dto';
import { UpdateToolDto } from './dto/update-tool.dto';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { CheckinDto } from './dto/checkin.dto';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto';

@Injectable()
export class ToolsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateToolDto) {
    return this.prisma.tool.create({ data: dto });
  }

  findAll() {
    return this.prisma.tool.findMany({
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
