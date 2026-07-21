import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const p = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env['DATABASE_URL']! }) });

const tools = [
  // ===== Power Tools =====
  { name: 'DeWalt Miter Saw', heNumber: 1, locationId: 2, description: '12-inch double bevel sliding compound miter saw' },
  { name: 'Makita Circular Saw', heNumber: 2, locationId: 2, description: '7-1/4 inch magnesium circular saw' },
  { name: 'Milwaukee Sawzall', heNumber: 3, locationId: 2, description: 'M18 FUEL Super Sawzall' },
  { name: 'Skilsaw Worm Drive', heNumber: 4, locationId: 3, description: '7-1/4 inch worm drive circular saw' },
  { name: 'DeWalt Table Saw', heNumber: 5, locationId: 2, description: '10-inch jobsite table saw with rolling stand' },
  { name: 'Milwaukee Band Saw', heNumber: 6, locationId: 2, description: 'M18 FUEL deep cut band saw' },
  { name: 'Makita Jig Saw', heNumber: 7, locationId: 3, description: '18V LXT brushless jig saw' },

  { name: 'DeWalt Hammer Drill', heNumber: 8, locationId: 2, description: '20V MAX XR brushless hammer drill' },
  { name: 'Milwaukee Impact Driver', heNumber: 9, locationId: 2, description: 'M18 FUEL 1/4 hex impact driver' },
  { name: 'Makita Drill Driver', heNumber: 10, locationId: 2, description: '18V LXT brushless drill driver' },
  { name: 'Hilti Rotary Hammer', heNumber: 11, locationId: 3, description: '22V cordless rotary hammer with SDS chuck' },
  { name: 'Bosch Magnetic Drill', heNumber: 12, locationId: 2, description: '1-3/8 inch magnetic drill press' },
  { name: 'DeWalt Right-Angle Drill', heNumber: 13, locationId: 3, description: '20V MAX right-angle drill kit' },

  { name: 'Angle Grinder', heNumber: 14, locationId: 2, description: '4-1/2 inch angle grinder with paddle switch' },
  { name: 'Milwaukee Large Grinder', heNumber: 15, locationId: 2, description: 'M18 FUEL 7-inch angle grinder' },
  { name: 'Makita Die Grinder', heNumber: 16, locationId: 3, description: '1/4 inch die grinder with variable speed' },
  { name: 'Metabo Bench Grinder', heNumber: 17, locationId: 3, description: '6-inch bench grinder with work light' },

  { name: 'Random Orbital Sander', heNumber: 18, locationId: 2, description: '125mm random orbital sander' },
  { name: 'DeWalt Belt Sander', heNumber: 19, locationId: 2, description: '3x21 inch belt sander with dust bag' },
  { name: 'Festool ETS EC 150', heNumber: 20, locationId: 2, description: '150mm orbital sander' },
  { name: 'DeWalt Detail Sander', heNumber: 21, locationId: 3, description: 'Corner/bution sander' },
  { name: 'Makita Finishing Sander', heNumber: 22, locationId: 3, description: '1/4 sheet finishing sander' },

  { name: 'DeWalt Compound Miter Saw', heNumber: 23, locationId: 2, description: '12-inch miter saw with laser' },
  { name: 'Bosch Jigsaw', heNumber: 24, locationId: 2, description: 'Barrel-grip jigsaw with Smart Control' },
  { name: 'Milwaukee Hole Saw', heNumber: 25, locationId: 2, description: 'M18 hole hawg' },
  { name: 'Ridgid Pipe Threader', heNumber: 26, locationId: 4, description: '12R automatic pipe threader' },

  // ===== Compressors and Pneumatic =====
  { name: 'Ingersoll Rand Compressor', heNumber: 27, locationId: 3 },
  { name: 'DeWalt Air Compressor', heNumber: 28, locationId: 3, description: '6-gallon pancake compressor' },
  { name: 'Hitachi Framing Nailer', heNumber: 29, locationId: 4, description: 'Straight finish nailer' },
  { name: 'Paslode Cordless Nailer', heNumber: 30, locationId: 4, description: 'First generation cordless nailer' },
  { name: 'Senco Finish Nailer', heNumber: 31, locationId: 3 },
  { name: 'Bostitch Coil Nailer', heNumber: 32, locationId: 4, description: 'Coil framing nailer' },

  // ===== Welding =====
  { name: 'Miller Welder 210', heNumber: 33, locationId: 4, description: 'Millermatic 210 MIG welder' },
  { name: 'Lincoln 180 Welder', heNumber: 34, locationId: 4, description: 'Lincoln Electric 180 MIG welder' },
  { name: 'Miller Big 40 Welder', heNumber: 35, locationId: 4, description: 'Miller Big 40 diesel welder' },
  { name: 'Plasma Cutter', heNumber: 36, locationId: 4, description: 'Hypertherm Powermax 45 plasma cutter' },
  { name: 'Oxy-Acetylene Torch', heNumber: 37, locationId: 4, description: 'Full oxy-acetylene cutting/welding rig' },
  { name: 'Miller 250 Welder', heNumber: 38, locationId: 4, description: 'Miller 250 MIG welder' },
  { name: 'Lincoln 225 Welder', heNumber: 39, locationId: 4, description: 'Lincoln 225 stick welder' },
  { name: 'Miller 350 Welder', heNumber: 40, locationId: 4, description: 'Miller 350 aluminum welder' },
  { name: 'Miller 211 Welder', heNumber: 41, locationId: 4, description: 'Miller Multimatic 211' },
  { name: 'Miller 252 Welder', heNumber: 42, locationId: 4, description: 'Miller 252 MIG welder' },

  // ===== Heavy Equipment =====
  { name: 'Forklift', heNumber: 43, locationId: 3, description: 'Toyota 5,000 lb forklift' },
  { name: 'Telehandler', heNumber: 44, locationId: 3, description: 'JLG 10,000 lb telehandler' },
  { name: 'Bobcat Skid Steer', heNumber: 45, locationId: 3, description: 'Bobcat S650 skid steer loader' },
  { name: 'Mini Excavator', heNumber: 46, locationId: 3, description: 'Bobcat E35 mini excavator' },
  { name: 'Backhoe', heNumber: 47, locationId: 3, description: 'Case 580 backhoe loader' },
  { name: 'Bulldozer D6', heNumber: 48, locationId: 3, description: 'Cat D6 dozer' },
  { name: 'Excavator 320', heNumber: 49, locationId: 3, description: 'Cat 320 excavator' },
  { name: 'Scissor Lift', heNumber: 50, locationId: 3, description: 'Genie 26-foot scissor lift' },
  { name: 'Boom Lift 60', heNumber: 51, locationId: 3, description: 'JLG 60-foot boom lift' },
  { name: 'Boom Lift 80', heNumber: 52, locationId: 3, description: 'JLG 80-foot boom lift' },
  { name: 'Skytrak Telehandler', heNumber: 53, locationId: 3, description: 'Skytrak 6,000 lb telehandler' },

  // ===== Concrete Equipment =====
  { name: 'Concrete Mixer 9CF', heNumber: 54, locationId: 4, description: '9 cubic foot concrete mixer' },
  { name: 'Concrete Mixer 12CF', heNumber: 55, locationId: 4, description: '12 cubic foot concrete mixer' },
  { name: 'Concrete Vibrator', heNumber: 56, locationId: 4, description: 'Wacker Neuson vibrator' },
  { name: 'Concrete Saw', heNumber: 57, locationId: 4, description: '14-inch gas concrete saw' },
  { name: 'Concrete Trowel', heNumber: 58, locationId: 4, description: 'Power trowel machine' },
  { name: 'Concrete Grinder', heNumber: 59, locationId: 4, description: 'Walk-behind concrete grinder' },
  { name: 'Stihl Cut-off Saw', heNumber: 60, locationId: 4, description: '14-inch gas cut-off saw' },
  { name: 'Husqvarna Concrete Saw', heNumber: 61, locationId: 4, description: 'Electric concrete saw' },
  { name: 'Concrete Pump', heNumber: 62, locationId: 4, description: 'Portable concrete pump' },
  { name: 'Power Trowel 36', heNumber: 63, locationId: 4, description: '36-inch power trowel' },
  { name: 'Concrete Mixer 6CF', heNumber: 64, locationId: 4, description: '6 cubic foot portable mixer' },

  // ===== Misc Tools =====
  { name: 'DeWalt Generator 7K', heNumber: 65, locationId: 3, description: '7,000 watt portable generator' },
  { name: 'DeWalt Generator 10K', heNumber: 66, locationId: 3, description: '10,000 watt portable generator' },
  { name: 'Pressure Washer', heNumber: 67, locationId: 3, description: '3,000 PSI pressure washer' },
  { name: 'Floor Scraper', heNumber: 68, locationId: 3, description: 'Electric floor scraper' },
  { name: 'Carpet Cleaner', heNumber: 69, locationId: 3, description: 'Rug doctor carpet cleaner' },
  { name: 'Floor Polisher', heNumber: 70, locationId: 3, description: 'Rotary floor polisher' },
  { name: 'Hepa Vacuum', heNumber: 71, locationId: 3, description: 'HEPA filtered shop vacuum' },
  { name: 'Shop Vac 5 HP', heNumber: 72, locationId: 3, description: '5 HP shop vacuum' },
  { name: 'DeWalt Lights Tower', heNumber: 73, locationId: 3, description: 'Portable LED light tower' },
  { name: 'Portable Light', heNumber: 74, locationId: 3, description: 'Portable halogen light' },
  { name: 'Power Distribution', heNumber: 75, locationId: 3, description: 'Portable power distribution box' },
  { name: 'Extension Cord 100', heNumber: 76, locationId: 3, description: '100-foot heavy duty extension cord' },
  { name: 'Extension Cord 50', heNumber: 77, locationId: 3, description: '50-foot heavy duty extension cord' },
  { name: 'Air Hose 100', heNumber: 78, locationId: 3, description: '100-foot air hose' },
  { name: 'Water Pump', heNumber: 79, locationId: 5, description: '2-inch submersible water pump' },
  { name: 'Trash Pump', heNumber: 80, locationId: 5, description: '3-inch trash pump' },
  { name: 'Jump Starter', heNumber: 81, locationId: 3, description: 'Portable jump starter' },
  { name: 'Multi-meter', heNumber: 82, locationId: 3, description: 'Fluke 117 multimeter' },
  { name: 'Laser Level', heNumber: 83, locationId: 3, description: 'Rotary laser level with tripod' },
  { name: 'Pipe Bender', heNumber: 84, locationId: 4, description: 'Manual pipe bender' },
  { name: 'Chain Hoist 2T', heNumber: 85, locationId: 3, description: '2-ton chain hoist' },
  { name: 'Come Along 2T', heNumber: 86, locationId: 3, description: '2-ton come along' },
  { name: 'Trencher', heNumber: 87, locationId: 3, description: 'Walk-behind trencher' },
  { name: 'Plate Compactor', heNumber: 88, locationId: 4, description: 'Jumping jack compactor' },
  { name: 'Tamper', heNumber: 89, locationId: 4, description: 'Vibratory tampter' },
  { name: 'Mud Mixer', heNumber: 90, locationId: 4, description: 'Drywall mud mixer' },
  { name: 'Drywall Lift', heNumber: 91, locationId: 3, description: 'Drywall panel lift' },
  { name: 'Paint Sprayer', heNumber: 92, locationId: 3, description: 'Airless paint sprayer' },

  // ===== Surveying =====
  { name: 'Total Station', heNumber: 93, locationId: 2, description: 'Leica total station' },
  { name: 'Transit Level', heNumber: 94, locationId: 2, description: 'Automatic transit level' },
  { name: 'GPS Survey Unit', heNumber: 95, locationId: 2, description: 'Trimble GPS survey unit' },

  { name: 'Jackhammer', heNumber: 96, locationId: 4, description: 'Electric jackhammer' },
  { name: 'Pneumatic Hammer', heNumber: 97, locationId: 4, description: 'Pneumatic hammer drill' },
  { name: 'Scaffolding Set', heNumber: 98, locationId: 3, description: 'Complete scaffolding set (10 sections)' },
  { name: 'Roller', heNumber: 99, locationId: 4, description: 'Vibratory roller compactor' },
  { name: 'Paver', heNumber: 100, locationId: 4, description: 'Asphalt paver' },
  { name: 'Hot Box', heNumber: 101, locationId: 4, description: 'Hot asphalt storage box' },
  { name: 'Saw Safety', heNumber: 102, locationId: 5, description: 'Table saw safety guard system' },
  { name: 'Dust Collector', heNumber: 103, locationId: 3, description: 'Portable dust collection system' },
  { name: 'Blower', heNumber: 104, locationId: 3, description: 'Gas leaf blower' },
  { name: 'Trimmer', heNumber: 105, locationId: 3, description: 'String trimmer' },
  { name: 'Chainsaw 18', heNumber: 106, locationId: 3, description: '18-inch gas chainsaw' },
  { name: 'Chainsaw 20', heNumber: 107, locationId: 3, description: '20-inch gas chainsaw' },
  { name: 'Hedge Trimmer', heNumber: 108, locationId: 3, description: 'Electric hedge trimmer' },
  { name: 'Pole Saw', heNumber: 109, locationId: 3, description: 'Gas pole saw' },
  { name: 'DeWalt Generator 15K', heNumber: 110, locationId: 3, description: '15,000 watt portable generator' },
];

async function main() {
  await p.tool.createMany({ data: tools as any });
  console.log(`Seeded ${tools.length} tools`);
  await p.$disconnect();
}

main();
