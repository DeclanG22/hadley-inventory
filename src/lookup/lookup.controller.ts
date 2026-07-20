import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

function expandSearchQueries(q: string): string[] {
  const norm = q.replace(/\s+/g, ' ').trim();
  const results = [norm];
  const collapsed = norm.replace(/\s*([^\w\d\s])\s*/g, '$1').replace(/\s*([x×])\s*/g, '$1');
  if (collapsed !== norm) results.push(collapsed);
  const expanded = norm
    .replace(/(\d)\s*[x×]\s*(\d)/g, '$1 x $2')
    .replace(/(\d)\s*[x×]\s*$/g, '$1 x')
    .replace(/^\s*[x×]\s*(\d)/g, 'x $1');
  if (expanded !== norm) results.push(expanded);
  return [...new Set(results)];
}

@Controller('lookup')
export class LookupController {
  constructor(private readonly prisma: PrismaService) {}

  @Get(':code')
  async lookup(@Param('code') code: string) {
    const queries = expandSearchQueries(code);

    for (const q of queries) {
      let item = await this.prisma.item.findFirst({
        where: { itemNumber: { equals: q, mode: 'insensitive' } },
        include: {
          category: true,
          subCategory: true,
          location: true,
          vendor: true,
        },
      });
      if (!item) {
        item = await this.prisma.item.findFirst({
          where: { description: { contains: q, mode: 'insensitive' } },
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

    for (const q of queries) {
      let tool = await this.prisma.tool.findFirst({
        where: { toolNumber: { equals: q, mode: 'insensitive' } },
        include: toolInclude,
      });
      if (!tool) {
        tool = await this.prisma.tool.findFirst({
          where: { name: { contains: q, mode: 'insensitive' } },
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
            expectedReturnAt: tool.checkouts[0]?.expectedReturnAt ?? null,
            maintenanceFlags: tool.maintenanceFlags,
          },
        };
      }
    }

    throw new NotFoundException(`No item or tool found matching "${code}"`);
  }
}
