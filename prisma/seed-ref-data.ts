import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const p = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env['DATABASE_URL']! }) });

const categories = [
  { id: 1, name: 'Power Tools' },
  { id: 2, name: 'Hand Tools' },
  { id: 3, name: 'Measuring & Layout' },
  { id: 4, name: 'Fastening' },
  { id: 5, name: 'Safety' },
  { id: 6, name: 'Plumbing' },
  { id: 7, name: 'Electrical' },
];

const locations = [
  { id: 1, name: 'Warehouse A' },
  { id: 2, name: 'Warehouse B' },
  { id: 3, name: 'Warehouse C' },
  { id: 4, name: 'Tool Shed' },
  { id: 5, name: 'Job Site Trailer' },
];

async function main() {
  for (const c of categories) {
    await p.toolCategory.upsert({
      where: { id: c.id },
      create: c,
      update: c,
    });
  }
  for (const l of locations) {
    await p.location.upsert({
      where: { id: l.id },
      create: l,
      update: l,
    });
  }
  const catCount = await p.toolCategory.count();
  const locCount = await p.location.count();
  console.log(`Seeded ${catCount} tool categories and ${locCount} locations`);
  await p.$disconnect();
}

main();
