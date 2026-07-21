import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ActivityService {
  constructor(private readonly prisma: PrismaService) {}

  async getRecent(limit = 20) {
    const [txns, checkouts, maint, flags] = await Promise.all([
      this.prisma.itemTransaction.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { item: { select: { id: true, itemNumber: true, description: true } } },
      }),
      this.prisma.toolCheckout.findMany({
        take: limit,
        orderBy: { checkedOutAt: 'desc' },
        include: { tool: { select: { id: true, name: true } } },
      }),
      this.prisma.toolMaintenanceLog.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { tool: { select: { id: true, name: true } } },
      }),
      this.prisma.toolMaintenanceFlag.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { tool: { select: { id: true, name: true } } },
      }),
    ]);

    const mapped = [
      ...txns.map((t) => ({
        type: 'item_transaction' as const,
        id: t.id,
        date: t.date ?? t.createdAt,
        direction: t.quantityInOut > 0 ? 'in' : 'out',
        qty: Math.abs(t.quantityInOut),
        summary: `${t.quantityInOut > 0 ? 'In' : 'Out'} ${Math.abs(t.quantityInOut)} x ${t.item.itemNumber}${t.jobNumber ? ` (job ${t.jobNumber})` : ''}`,
        link: `/items/${t.item.id}`,
        itemRef: t.item.itemNumber,
      })),
      ...checkouts.map((c) => ({
        type: (c.checkedInAt ? 'tool_checkin' : 'tool_checkout') as string,
        id: c.id,
        date: c.checkedInAt ?? c.checkedOutAt,
        summary: `${c.checkedInAt ? 'Checked in' : 'Checked out'} ${c.tool.name} by ${c.checkedOutBy}`,
        link: `/tools/${c.tool.id}`,
        itemRef: c.tool.name,
      })),
      ...maint.map((m) => ({
        type: 'tool_maintenance' as const,
        subType: m.type,
        id: m.id,
        date: m.createdAt,
        summary: `${m.type} on ${m.tool.name}${m.description ? `: ${m.description}` : ''}`,
        link: `/tools/${m.tool.id}`,
        itemRef: m.tool.name,
      })),
      ...flags.flatMap((f) => {
        const events: any[] = [{
          type: 'flag_created' as const,
          subType: f.type,
          id: f.id,
          date: f.createdAt,
          summary: `Flag ${f.type} on ${f.tool.name}${f.description ? `: ${f.description}` : ''}`,
          link: `/tools/maintenance-flags?highlight=${f.id}`,
          itemRef: f.tool.name,
        }];
        if (f.resolvedAt) {
          events.push({
            type: 'flag_resolved' as const,
            subType: f.type,
            id: f.id,
            date: f.resolvedAt,
            summary: `Flag ${f.type} resolved on ${f.tool.name}`,
            link: `/tools/maintenance-flags?highlight=${f.id}`,
            itemRef: f.tool.name,
          });
        }
        return events;
      }),
    ];

    return mapped.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, limit);
  }
}
