import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const p = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env['DATABASE_URL']! }) });

const locations = [
  { id: 1, name: 'Tool Inventory Shelf 1' },
  { id: 2, name: 'Tool Inventory Shelf 2' },
  { id: 3, name: 'Tool Inventory Shelf 3' },
  { id: 4, name: 'Tool Inventory Shelf 4' },
  { id: 5, name: 'Tool Inventory Shelf 5' },
];

async function main() {
  for (const l of locations) {
    await p.location.upsert({
      where: { id: l.id },
      create: l,
      update: l,
    });
  }
  const locCount = await p.location.count();
  console.log(`Seeded ${locCount} locations`);
  await p.$disconnect();
}

main();
