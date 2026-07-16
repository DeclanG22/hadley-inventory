import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('lookup')
export class LookupController {
  constructor(private readonly prisma: PrismaService) {}

  @Get(':code')
  async lookup(@Param('code') code: string) {
    let item = await this.prisma.item.findFirst({
      where: { itemNumber: { equals: code, mode: 'insensitive' } },
      include: {
        category: true,
        subCategory: true,
        location: true,
        vendor: true,
      },
    });

    if (!item) {
      item = await this.prisma.item.findFirst({
        where: { description: { contains: code, mode: 'insensitive' } },
        include: {
          category: true,
          subCategory: true,
          location: true,
          vendor: true,
        },
      });
    }

    if (item) {
      return {
        type: 'item' as const,
        data: {
          id: item.id,
          itemNumber: item.itemNumber,
          description: item.description,
          onHand: item.onHand,
          unit: item.unit,
          category: item.category?.name ?? null,
          imageUrl: item.imageUrl,
          weightPerUnit: item.weightPerUnit ? Number(item.weightPerUnit) : null,
        },
      };
    }

    const toolInclude = {
      category: true,
      checkouts: {
        where: { checkedInAt: null },
        take: 1,
      },
      maintenanceFlags: {
        where: { resolvedAt: null },
        select: { id: true, type: true, description: true, createdAt: true },
      },
    } as const;

    let tool = await this.prisma.tool.findFirst({
      where: { toolNumber: { equals: code, mode: 'insensitive' } },
      include: toolInclude,
    });

    if (!tool) {
      tool = await this.prisma.tool.findFirst({
        where: { name: { contains: code, mode: 'insensitive' } },
        include: toolInclude,
      });
    }

    if (tool) {
      return {
        type: 'tool' as const,
        data: {
          id: tool.id,
          toolNumber: tool.toolNumber,
          name: tool.name,
          brand: tool.brand,
          model: tool.model,
          category: tool.category?.name ?? null,
          imageUrl: tool.imageUrl,
          checkedOut: tool.checkouts.length > 0,
          checkedOutBy: tool.checkouts[0]?.checkedOutBy ?? null,
          checkedOutAt: tool.checkouts[0]?.checkedOutAt ?? null,
          maintenanceFlags: tool.maintenanceFlags,
        },
      };
    }

    throw new NotFoundException(`No item or tool found matching "${code}"`);
  }
}
