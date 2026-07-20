import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JobsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(q?: string) {
    const txnWhere: any = {
      AND: [
        { jobNumber: { not: null } },
        { jobNumber: { not: { startsWith: 'STOCKTAKE' } } },
      ],
    };
    const chkWhere: any = {
      AND: [
        { jobNumber: { not: null } },
        { jobNumber: { not: { startsWith: 'STOCKTAKE' } } },
      ],
    };

    if (q) {
      txnWhere.AND.push({ jobNumber: { contains: q, mode: 'insensitive' } });
      chkWhere.AND.push({ jobNumber: { contains: q, mode: 'insensitive' } });
    }

    const [txns, checkouts] = await Promise.all([
      this.prisma.itemTransaction.findMany({
        where: txnWhere,
        select: { jobNumber: true },
      }),
      this.prisma.toolCheckout.findMany({
        where: chkWhere,
        select: { jobNumber: true },
      }),
    ]);

    const countMap = new Map<string, { itemCount: number; toolCount: number }>();

    for (const t of txns) {
      if (!t.jobNumber) continue;
      const e = countMap.get(t.jobNumber) ?? { itemCount: 0, toolCount: 0 };
      e.itemCount++;
      countMap.set(t.jobNumber, e);
    }

    for (const c of checkouts) {
      if (!c.jobNumber) continue;
      const e = countMap.get(c.jobNumber) ?? { itemCount: 0, toolCount: 0 };
      e.toolCount++;
      countMap.set(c.jobNumber, e);
    }

    return [...countMap.entries()]
      .map(([jobNumber, { itemCount, toolCount }]) => ({ jobNumber, itemCount, toolCount }))
      .sort((a, b) => a.jobNumber.localeCompare(b.jobNumber));
  }

  async getJob(jobNumber: string) {
    const [itemTxns, toolCheckouts] = await Promise.all([
      this.prisma.itemTransaction.findMany({
        where: { jobNumber: { equals: jobNumber, mode: 'insensitive' } },
        orderBy: { date: 'desc' },
        include: {
          item: { select: { id: true, itemNumber: true, description: true, unit: true, unitPrice: true } },
        },
      }),
      this.prisma.toolCheckout.findMany({
        where: { jobNumber: { equals: jobNumber, mode: 'insensitive' } },
        orderBy: { checkedOutAt: 'desc' },
        include: {
          tool: { select: { id: true, toolNumber: true, name: true } },
        },
      }),
    ]);

    return { jobNumber, itemTxns, toolCheckouts };
  }
}
