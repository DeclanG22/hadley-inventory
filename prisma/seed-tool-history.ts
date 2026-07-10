import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const p = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env['DATABASE_URL']! }) });

async function main() {
  const tools = await p.tool.findMany({ select: { id: true, toolNumber: true } });
  const now = new Date();

  // Add checkouts for some tools
  const checkoutNames = ['John D', 'Mike R', 'Sarah K', 'Tom B', 'Chris M', 'Alex P'];
  const jobNumbers = ['JOB-2026-001', 'JOB-2026-004', 'JOB-2026-008', 'JOB-2025-050', 'JOB-2025-042'];
  const sites = ['Site A', 'Site B', 'Warehouse 3', 'Job 42'];

  for (const t of tools.slice(0, 8)) {
    const isCheckedOut = Math.random() < 0.3;
    const checkedOutAt = new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000);
    await p.toolCheckout.create({
      data: {
        toolId: t.id,
        checkedOutBy: checkoutNames[Math.floor(Math.random() * checkoutNames.length)],
        jobNumber: jobNumbers[Math.floor(Math.random() * jobNumbers.length)],
        jobSite: sites[Math.floor(Math.random() * sites.length)],
        checkedOutAt,
        checkedInAt: isCheckedOut ? null : new Date(checkedOutAt.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000),
        notes: Math.random() < 0.3 ? 'Returned in good condition' : null,
      },
    });
  }

  // Add maintenance records for some tools
  const maintTypes: ('repair' | 'service' | 'calibration' | 'inspection')[] = ['repair', 'service', 'calibration', 'inspection'];
  const maintBy = ['Jane S', 'Mike R', 'Tool Repair Co', 'Factory Service'];

  for (const t of tools.slice(0, 6)) {
    const count = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < count; i++) {
      const date = new Date(now.getTime() - Math.random() * 180 * 24 * 60 * 60 * 1000);
      await p.toolMaintenanceLog.create({
        data: {
          toolId: t.id,
          type: maintTypes[Math.floor(Math.random() * maintTypes.length)],
          date,
          description: ['Replaced blade', 'Oil change', 'Calibration check', 'Annual inspection', 'Battery replacement', 'Cleaned and lubricated'][Math.floor(Math.random() * 6)],
          performedBy: maintBy[Math.floor(Math.random() * maintBy.length)],
          cost: Math.random() * 200 + 10,
          notes: Math.random() < 0.3 ? 'Routine maintenance' : null,
        },
      });
    }
  }

  const checkouts = await p.toolCheckout.count();
  const maint = await p.toolMaintenanceLog.count();
  console.log(`Created ${checkouts} checkouts and ${maint} maintenance records`);
  await p.$disconnect();
}

main();
