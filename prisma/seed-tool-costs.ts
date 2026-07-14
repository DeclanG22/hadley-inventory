import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const p = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env['DATABASE_URL']! }) });

async function main() {
  const tools = await p.tool.findMany({ select: { id: true } });
  const costs = [49.99, 89.99, 129.99, 199.99, 59.99, 14.99, 24.99, 34.99, 44.99, 79.99, 149.99, 99.99, 19.99, 69.99, 39.99, 12.99, 29.99, 109.99, 179.99, 259.99, 89.99, 149.99, 39.99, 69.99, 399.99, 549.99, 249.99, 299.99, 129.99, 19.99, 24.99, 34.99, 14.99, 49.99, 89.99, 149.99, 199.99, 249.99, 59.99, 29.99, 44.99, 34.99, 19.99, 15.99, 12.99, 19.99, 24.99, 8.99, 14.99, 59.99, 34.99, 99.99, 139.99, 24.99, 34.99, 79.99, 18.99, 29.99, 12.99, 9.99, 49.99, 89.99, 149.99, 399.99, 24.99, 34.99, 89.99, 19.99, 14.99, 34.99, 44.99, 129.99, 34.99, 19.99, 49.99, 79.99, 199.99, 29.99, 9.99, 29.99, 69.99];
  for (let i = 0; i < tools.length; i++) {
    await p.tool.update({ where: { id: tools[i].id }, data: { purchaseCost: costs[i % costs.length] } });
  }
  console.log('Seeded purchase costs for', tools.length, 'tools');
  await p.$disconnect();
}

main();
