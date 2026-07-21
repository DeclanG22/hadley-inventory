import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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

    const itemTokens = code.replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (itemTokens.length > 1) {
      const item = await this.prisma.item.findFirst({
        where: {
          AND: itemTokens.map(token => ({
            OR: [
              { itemNumber: { contains: token, mode: 'insensitive' } },
              { description: { contains: token, mode: 'insensitive' } },
            ]
          }))
        },
        include: {
          category: true,
          subCategory: true,
          location: true,
          vendor: true,
        },
      });
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
      vendor: true,
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
      const heNum = parseInt(q, 10);
      let tool = !isNaN(heNum) ? await this.prisma.tool.findFirst({
        where: { heNumber: heNum },
        include: toolInclude,
      }) : null;
      if (!tool) {
        tool = await this.prisma.tool.findFirst({
          where: { name: { equals: q, mode: 'insensitive' } },
          include: toolInclude,
        });
      }
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
            name: tool.name,
            description: tool.description,
            heNumber: tool.heNumber,
            vendor: tool.vendor?.name ?? null,
            imageUrl: tool.imageUrl,
            decommissionedAt: tool.decommissionedAt,
            checkedOut: tool.checkouts.length > 0,
            checkedOutBy: tool.checkouts[0]?.checkedOutBy ?? null,
            checkedOutAt: tool.checkouts[0]?.checkedOutAt ?? null,
            expectedReturnAt: tool.checkouts[0]?.expectedReturnAt ?? null,
            maintenanceFlags: tool.maintenanceFlags,
          },
        };
      }
    }

    const tokens = code.replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (tokens.length > 1) {
      const tool = await this.prisma.tool.findFirst({
        where: {
          AND: tokens.map(token => ({
            OR: [
              { name: { contains: token, mode: 'insensitive' } },
              { description: { contains: token, mode: 'insensitive' } },
            ]
          }))
        },
        include: toolInclude,
      });
      if (tool) {
        return {
          type: 'tool' as const,
          data: {
            id: tool.id,
            name: tool.name,
            description: tool.description,
            heNumber: tool.heNumber,
            vendor: tool.vendor?.name ?? null,
            imageUrl: tool.imageUrl,
            decommissionedAt: tool.decommissionedAt,
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
