import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env['DATABASE_URL']! });
const prisma = new PrismaClient({ adapter });

const JOB_NUMBERS = [
  'JOB-2024-001', 'JOB-2024-015', 'JOB-2024-023', 'JOB-2024-047',
  'JOB-2024-052', 'JOB-2024-068', 'JOB-2025-003', 'JOB-2025-007',
  'JOB-2025-012', 'JOB-2025-019', 'JOB-2025-024', 'JOB-2025-031',
  'JOB-2025-038', 'JOB-2025-042', 'JOB-2025-050', 'JOB-2026-001',
  'JOB-2026-004', 'JOB-2026-008',
];

const NOTES = [
  null, null, null, null, null,
  'Rush order', 'Partial delivery', 'Backorder fulfilled',
  'Job site delivery', 'Weekly restock', 'Emergency supply',
  null, null, null,
];

function randomDate(from: Date, to: Date): Date {
  const ms = from.getTime() + Math.random() * (to.getTime() - from.getTime());
  return new Date(ms);
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function main() {
  const items = await prisma.item.findMany({
    where: { removeFlag: false, description: { not: 'Test Description' } },
    select: { id: true, description: true, unitPrice: true },
  });

  if (items.length === 0) {
    console.log('No items found to seed transactions.');
    await prisma.$disconnect();
    return;
  }

  console.log(`Found ${items.length} eligible items. Generating 100 transactions...`);

  const now = new Date();
  const twoYearsAgo = new Date(now.getFullYear() - 2, 0, 1);

  const transactions: any[] = [];
  const itemUpdates = new Map<number, { qty: number; job: string; date: Date; cost: number; lastQty: number; lastDate: Date }>();

  for (let i = 0; i < 100; i++) {
    const item = pick(items);
    const isOut = Math.random() < 0.7;
    const qty = isOut ? -randomInt(1, 50) : randomInt(5, 200);
    const date = randomDate(twoYearsAgo, now);
    const unitPrice = item.unitPrice ? Number(item.unitPrice) : Number((Math.random() * 10 + 0.5).toFixed(2));
    const totalCost = Number((Math.abs(qty) * unitPrice).toFixed(2));
    const job = pick(JOB_NUMBERS);

    transactions.push({
      itemId: item.id,
      jobNumber: job,
      date,
      quantityInOut: qty,
      unitPrice,
      totalCost,
      notes: pick(NOTES),
    });

    const existing = itemUpdates.get(item.id) || { qty: 0, job: '', date: twoYearsAgo, cost: 0, lastQty: 0, lastDate: new Date(0) };
    existing.qty += qty;
    existing.cost += totalCost;
    if (date > existing.date) {
      existing.date = date;
      existing.job = job;
    }
    if (date > existing.lastDate) {
      existing.lastDate = date;
      existing.lastQty = Math.abs(qty);
    }
    itemUpdates.set(item.id, existing);
  }

  await prisma.itemTransaction.createMany({ data: transactions });
  console.log(`Created ${transactions.length} transactions.`);

  const itemIds = Array.from(itemUpdates.keys());
  const dbItems = await prisma.item.findMany({
    where: { id: { in: itemIds } },
    select: { id: true },
  });

  const existingIds = new Set(dbItems.map(i => i.id));

  for (const [itemId, update] of itemUpdates) {
    if (!existingIds.has(itemId)) continue;
    const baseOnHand = randomInt(50, 500);
    await prisma.item.update({
      where: { id: itemId },
      data: {
        onHand: Math.max(0, baseOnHand + update.qty),
        lastQtyInOut: update.lastQty,
        lastJobNumber: update.job,
        totalCost: Number(update.cost.toFixed(2)),
        dateDisbursed: update.qty < 0 ? update.lastDate : undefined,
      },
    });
  }

  console.log(`Updated ${itemUpdates.size} items with derived fields.`);
  console.log('Done!');
  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
