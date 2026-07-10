import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const p = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env['DATABASE_URL']! }) });

const tools = [
  { toolNumber: 'SAW-001', name: 'DeWalt Miter Saw', brand: 'DeWalt', model: 'DWS780', categoryId: 1, locationId: 2, description: '12-inch double bevel sliding compound miter saw' },
  { toolNumber: 'SAW-002', name: 'Makita Circular Saw', brand: 'Makita', model: '5007MG', categoryId: 1, locationId: 2, description: '7-1/4 inch magnesium circular saw' },
  { toolNumber: 'SAW-003', name: 'Milwaukee Sawzall', brand: 'Milwaukee', model: '2720-20', categoryId: 1, locationId: 2, description: 'M18 FUEL Super Sawzall' },
  { toolNumber: 'DRILL-001', name: 'DeWalt Hammer Drill', brand: 'DeWalt', model: 'DCD996', categoryId: 1, locationId: 2, description: '20V MAX XR brushless hammer drill' },
  { toolNumber: 'DRILL-002', name: 'Milwaukee Impact Driver', brand: 'Milwaukee', model: '2853-20', categoryId: 1, locationId: 2, description: 'M18 FUEL 1/4 hex impact driver' },
  { toolNumber: 'DRILL-003', name: 'Makita Drill Driver', brand: 'Makita', model: 'XFD131', categoryId: 1, locationId: 2, description: '18V LXT brushless drill driver' },
  { toolNumber: 'HAM-001', name: '16oz Claw Hammer', brand: 'Stanley', model: '51-160', categoryId: 2, locationId: 2, description: 'Steel handle, rip claw' },
  { toolNumber: 'HAM-002', name: 'Dead Blow Hammer', brand: 'Trusty-Cook', model: '30005', categoryId: 2, locationId: 2, description: '3lb dead blow hammer' },
  { toolNumber: 'WRENCH-001', name: 'Crescent Wrench Set', brand: 'Craftsman', model: 'CMMT99430', categoryId: 2, locationId: 2, description: '3-piece adjustable wrench set' },
  { toolNumber: 'WRENCH-002', name: 'Socket Set 1/4 Drive', brand: 'GearWrench', model: '85001', categoryId: 2, locationId: 2, description: '120XP 1/4 drive 40-piece set' },
  { toolNumber: 'SCREW-001', name: 'DeWalt Screw Gun', brand: 'DeWalt', model: 'DCF620', categoryId: 4, locationId: 2, description: '20V MAX drywall screw gun' },
  { toolNumber: 'SCREW-002', name: 'Pneumatic Nailer', brand: 'Bostitch', model: 'F21PL', categoryId: 4, locationId: 2, description: 'Framing nailer 21-degree' },
  { toolNumber: 'TAPE-001', name: 'Stanley PowerLock Tape', brand: 'Stanley', model: '33-725', categoryId: 3, locationId: 2, description: '25ft tape measure with blade lock' },
  { toolNumber: 'TAPE-002', name: 'Bosch Laser Measure', brand: 'Bosch', model: 'GLM50C', categoryId: 3, locationId: 2, description: '50ft laser distance measurer' },
  { toolNumber: 'LEVEL-001', name: 'Empire 48 Level', brand: 'Empire', model: 'E17548', categoryId: 3, locationId: 2, description: '48-inch aluminum box level' },
  { toolNumber: 'SAFE-001', name: 'Hard Hat', brand: 'MSA', model: 'V-Gard', categoryId: 5, locationId: 2, description: 'Type I hard hat with 4-point suspension' },
  { toolNumber: 'SAFE-002', name: 'Safety Glasses 10pk', brand: '3M', model: '2890', categoryId: 5, locationId: 2, description: 'Clear anti-fog safety glasses 10 pack' },
  { toolNumber: 'GRIND-001', name: 'Angle Grinder', brand: 'DeWalt', model: 'DWE402', categoryId: 1, locationId: 2, description: '4-1/2 inch angle grinder with paddle switch' },
  { toolNumber: 'SAND-001', name: 'Random Orbital Sander', brand: 'Festool', model: 'ETS 125', categoryId: 1, locationId: 2, description: '125mm random orbital sander' },
  { toolNumber: 'MULTI-001', name: 'Oscillating Multi-Tool', brand: 'Fein', model: 'FMM 350', categoryId: 1, locationId: 2, description: 'MultiMaster oscillating tool' },
];

async function main() {
  for (const t of tools) {
    await p.tool.upsert({
      where: { toolNumber: t.toolNumber },
      create: t,
      update: t,
    });
  }
  const count = await p.tool.count();
  console.log(`Created/updated ${count} tools (attempted ${tools.length})`);
  await p.$disconnect();
}

main();
