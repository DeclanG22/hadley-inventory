import { Controller, Get, Param, Query, NotFoundException } from '@nestjs/common';
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

const itemInclude = {
  category: true,
  subCategory: true,
  location: true,
  vendor: true,
} as const;

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

function formatItem(item: any) {
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

function formatTool(tool: any) {
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

@Controller('lookup')
export class LookupController {
  constructor(private readonly prisma: PrismaService) {}

  @Get(':code')
  async lookup(@Param('code') code: string, @Query('type') type?: string) {
    const queries = expandSearchQueries(code);

    // Phase 1 — Exact matches on ALL entities (no contains)
    // This ensures an exact heNumber / serialNumber / itemNumber match
    // beats any partial description match on a different entity.
    if (!type || type === 'item') {
      for (const q of queries) {
        const item = await this.prisma.item.findFirst({
          where: { itemNumber: { equals: q, mode: 'insensitive' } },
          include: itemInclude,
        });
        if (item) return formatItem(item);
      }
    }

    if (!type || type === 'tool') {
      for (const q of queries) {
        let tool = await this.prisma.tool.findFirst({
          where: { serialNumber: { equals: q, mode: 'insensitive' } },
          include: toolInclude,
        });
        if (tool) return formatTool(tool);

        const heNum = parseInt(q, 10);
        if (!isNaN(heNum)) {
          tool = await this.prisma.tool.findFirst({
            where: { heNumber: heNum },
            include: toolInclude,
          });
          if (tool) return formatTool(tool);
        }

        tool = await this.prisma.tool.findFirst({
          where: { name: { equals: q, mode: 'insensitive' } },
          include: toolInclude,
        });
        if (tool) return formatTool(tool);
      }
    }

    // Phase 2 — Contains matches
    if (!type || type === 'item') {
      for (const q of queries) {
        const item = await this.prisma.item.findFirst({
          where: { description: { contains: q, mode: 'insensitive' } },
          include: itemInclude,
        });
        if (item) return formatItem(item);
      }
    }

    if (!type || type === 'tool') {
      for (const q of queries) {
        let tool = await this.prisma.tool.findFirst({
          where: { serialNumber: { contains: q, mode: 'insensitive' } },
          include: toolInclude,
        });
        if (tool) return formatTool(tool);

        tool = await this.prisma.tool.findFirst({
          where: { name: { contains: q, mode: 'insensitive' } },
          include: toolInclude,
        });
        if (tool) return formatTool(tool);
      }
    }

    // Phase 3 — Multi-token AND search
    const tokens = code.replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (tokens.length > 1) {
      if (!type || type === 'item') {
        const item = await this.prisma.item.findFirst({
          where: {
            AND: tokens.map(token => ({
              OR: [
                { itemNumber: { contains: token, mode: 'insensitive' } },
                { description: { contains: token, mode: 'insensitive' } },
              ]
            }))
          },
          include: itemInclude,
        });
        if (item) return formatItem(item);
      }

      if (!type || type === 'tool') {
        const tool = await this.prisma.tool.findFirst({
          where: {
            AND: tokens.map(token => ({
              OR: [
                { serialNumber: { contains: token, mode: 'insensitive' } },
                { name: { contains: token, mode: 'insensitive' } },
                { description: { contains: token, mode: 'insensitive' } },
              ]
            }))
          },
          include: toolInclude,
        });
        if (tool) return formatTool(tool);
      }
    }

    if (type === 'item') {
      throw new NotFoundException(`No item found matching "${code}"`);
    }
    if (type === 'tool') {
      throw new NotFoundException(`No tool found matching "${code}"`);
    }
    throw new NotFoundException(`No item or tool found matching "${code}"`);
  }
}
