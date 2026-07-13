import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('lookup')
export class LookupController {
  constructor(private readonly prisma: PrismaService) {}

  @Get(':code')
  async lookup(@Param('code') code: string) {
    let item = await this.prisma.item.findFirst({
      where: {
        OR: [
          { itemNumber: { equals: code, mode: 'insensitive' } },
          { qrCode: { equals: code, mode: 'insensitive' } },
        ],
      },
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
        },
      };
    }

    let tool = await this.prisma.tool.findFirst({
      where: {
        OR: [
          { toolNumber: { equals: code, mode: 'insensitive' } },
          { qrCode: { equals: code, mode: 'insensitive' } },
        ],
      },
      include: {
        category: true,
        checkouts: {
          where: { checkedInAt: null },
          take: 1,
        },
      },
    });

    if (!tool) {
      tool = await this.prisma.tool.findFirst({
        where: { name: { contains: code, mode: 'insensitive' } },
        include: {
          category: true,
          checkouts: {
            where: { checkedInAt: null },
            take: 1,
          },
        },
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
        },
      };
    }

    throw new NotFoundException(`No item or tool found matching "${code}"`);
  }
}
