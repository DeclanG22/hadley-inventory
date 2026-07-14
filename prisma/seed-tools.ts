import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const p = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env['DATABASE_URL']! }) });

const tools = [
  // ===== Power Tools (categoryId 1) =====
  { toolNumber: 'SAW-001', name: 'DeWalt Miter Saw', brand: 'DeWalt', model: 'DWS780', categoryId: 1, locationId: 2, description: '12-inch double bevel sliding compound miter saw' },
  { toolNumber: 'SAW-002', name: 'Makita Circular Saw', brand: 'Makita', model: '5007MG', categoryId: 1, locationId: 2, description: '7-1/4 inch magnesium circular saw' },
  { toolNumber: 'SAW-003', name: 'Milwaukee Sawzall', brand: 'Milwaukee', model: '2720-20', categoryId: 1, locationId: 2, description: 'M18 FUEL Super Sawzall' },
  { toolNumber: 'SAW-004', name: 'Skilsaw Worm Drive', brand: 'Skilsaw', model: 'SPT77WML-01', categoryId: 1, locationId: 3, description: '7-1/4 inch worm drive circular saw' },
  { toolNumber: 'SAW-005', name: 'DeWalt Table Saw', brand: 'DeWalt', model: 'DWE7491RS', categoryId: 1, locationId: 2, description: '10-inch jobsite table saw with rolling stand' },
  { toolNumber: 'SAW-006', name: 'Milwaukee Band Saw', brand: 'Milwaukee', model: '2729-21', categoryId: 1, locationId: 2, description: 'M18 FUEL deep cut band saw' },
  { toolNumber: 'SAW-007', name: 'Makita Jig Saw', brand: 'Makita', model: 'XVJ01Z', categoryId: 1, locationId: 3, description: '18V LXT brushless jig saw' },

  { toolNumber: 'DRILL-001', name: 'DeWalt Hammer Drill', brand: 'DeWalt', model: 'DCD996', categoryId: 1, locationId: 2, description: '20V MAX XR brushless hammer drill' },
  { toolNumber: 'DRILL-002', name: 'Milwaukee Impact Driver', brand: 'Milwaukee', model: '2853-20', categoryId: 1, locationId: 2, description: 'M18 FUEL 1/4 hex impact driver' },
  { toolNumber: 'DRILL-003', name: 'Makita Drill Driver', brand: 'Makita', model: 'XFD131', categoryId: 1, locationId: 2, description: '18V LXT brushless drill driver' },
  { toolNumber: 'DRILL-004', name: 'Hilti Rotary Hammer', brand: 'Hilti', model: 'TE 6-A22', categoryId: 1, locationId: 3, description: '22V cordless rotary hammer with SDS chuck' },
  { toolNumber: 'DRILL-005', name: 'Bosch Magnetic Drill', brand: 'Bosch', model: 'GCM12SD', categoryId: 1, locationId: 2, description: '1-3/8 inch magnetic drill press' },
  { toolNumber: 'DRILL-006', name: 'DeWalt Right-Angle Drill', brand: 'DeWalt', model: 'DCD740C1', categoryId: 1, locationId: 3, description: '20V MAX right-angle drill kit' },

  { toolNumber: 'GRIND-001', name: 'Angle Grinder', brand: 'DeWalt', model: 'DWE402', categoryId: 1, locationId: 2, description: '4-1/2 inch angle grinder with paddle switch' },
  { toolNumber: 'GRIND-002', name: 'Milwaukee Large Grinder', brand: 'Milwaukee', model: '2680-20', categoryId: 1, locationId: 2, description: 'M18 FUEL 7-inch angle grinder' },
  { toolNumber: 'GRIND-003', name: 'Makita Die Grinder', brand: 'Makita', model: 'GD0602', categoryId: 1, locationId: 3, description: '1/4 inch die grinder with variable speed' },
  { toolNumber: 'GRIND-004', name: 'Metabo Bench Grinder', brand: 'Metabo', model: 'DS 150', categoryId: 1, locationId: 3, description: '6-inch bench grinder with work light' },

  { toolNumber: 'SAND-001', name: 'Random Orbital Sander', brand: 'Festool', model: 'ETS 125', categoryId: 1, locationId: 2, description: '125mm random orbital sander' },
  { toolNumber: 'SAND-002', name: 'DeWalt Belt Sander', brand: 'DeWalt', model: 'DW431', categoryId: 1, locationId: 2, description: '3x21 inch belt sander with dust bag' },
  { toolNumber: 'SAND-003', name: 'Bosch Detail Sander', brand: 'Bosch', model: 'GSS18V-30', categoryId: 1, locationId: 2, description: '18V cordless detail sander' },

  { toolNumber: 'MULTI-001', name: 'Oscillating Multi-Tool', brand: 'Fein', model: 'FMM 350', categoryId: 1, locationId: 2, description: 'MultiMaster oscillating tool' },
  { toolNumber: 'MULTI-002', name: 'DeWalt Oscillating Tool', brand: 'DeWalt', model: 'DCS356C1', categoryId: 1, locationId: 2, description: '20V MAX XR brushless oscillating tool' },
  { toolNumber: 'PIPE-001', name: 'Milwaukee Pipe Threader', brand: 'Milwaukee', model: '2470-20', categoryId: 1, locationId: 3, description: 'M12 cordless pipe threader' },
  { toolNumber: 'HEAT-001', name: 'Milwaukee Heat Gun', brand: 'Milwaukee', model: '2688-20', categoryId: 1, locationId: 2, description: 'M18 FUEL cordless heat gun' },
  { toolNumber: 'VAC-001', name: 'Festool Shop Vac', brand: 'Festool', model: 'CT 36 AC', categoryId: 1, locationId: 3, description: 'HEPA dust extractor with auto-clean' },
  { toolNumber: 'WELD-001', name: 'Miller Welder', brand: 'Miller', model: 'Millermatic 211', categoryId: 1, locationId: 2, description: 'MIG welder with auto-set' },
  { toolNumber: 'COMP-001', name: 'DeWalt Air Compressor', brand: 'DeWalt', model: 'DXCMH1489665', categoryId: 1, locationId: 3, description: '8-gallon portable air compressor' },
  { toolNumber: 'GEN-001', name: 'Honda Generator', brand: 'Honda', model: 'EU2200i', categoryId: 1, locationId: 2, description: '2200-watt inverter generator' },

  // ===== Hand Tools (categoryId 2) =====
  { toolNumber: 'HAM-001', name: '16oz Claw Hammer', brand: 'Stanley', model: '51-160', categoryId: 2, locationId: 2, description: 'Steel handle, rip claw' },
  { toolNumber: 'HAM-002', name: 'Dead Blow Hammer', brand: 'Trusty-Cook', model: '30005', categoryId: 2, locationId: 2, description: '3lb dead blow hammer' },
  { toolNumber: 'HAM-003', name: 'Framing Hammer', brand: 'Estwing', model: 'E3-22S', categoryId: 2, locationId: 2, description: '22oz steel handle framing hammer' },
  { toolNumber: 'HAM-004', name: 'Sledge Hammer', brand: 'Stanley', model: '54-664', categoryId: 2, locationId: 2, description: '8lb sledge hammer with fiberglass handle' },
  { toolNumber: 'HAM-005', name: 'Brass Hammer', brand: 'Proto', model: 'J1934B', categoryId: 2, locationId: 3, description: '2lb brass mallet, non-sparking' },

  { toolNumber: 'WRENCH-001', name: 'Crescent Wrench Set', brand: 'Craftsman', model: 'CMMT99430', categoryId: 2, locationId: 2, description: '3-piece adjustable wrench set' },
  { toolNumber: 'WRENCH-002', name: 'Socket Set 1/4 Drive', brand: 'GearWrench', model: '85001', categoryId: 2, locationId: 2, description: '120XP 1/4 drive 40-piece set' },
  { toolNumber: 'WRENCH-003', name: 'Socket Set 3/8 Drive', brand: 'Snap-on', model: 'S80K', categoryId: 2, locationId: 3, description: '3/8 drive socket set 60-piece' },
  { toolNumber: 'WRENCH-004', name: 'Combination Wrench Set', brand: 'Proto', model: 'JSCVM-12', categoryId: 2, locationId: 2, description: '12-piece combination wrench set metric' },
  { toolNumber: 'WRENCH-005', name: 'Torque Wrench', brand: 'CDI', model: '2503MFRMH', categoryId: 2, locationId: 2, description: '1/2 drive torque wrench 50-250 ft-lb' },
  { toolNumber: 'WRENCH-006', name: 'Allen Key Set', brand: 'Bondhus', model: '10433', categoryId: 2, locationId: 3, description: 'Metric/SAE hex key set fold-up' },
  { toolNumber: 'WRENCH-007', name: 'Pipe Wrench 18', brand: 'Ridgid', model: 'E-118', categoryId: 2, locationId: 2, description: '18-inch heavy-duty pipe wrench' },
  { toolNumber: 'WRENCH-008', name: 'Strap Wrench', brand: 'Klein', model: '66941', categoryId: 2, locationId: 2, description: 'Oil-resistant strap wrench 2-inch' },

  { toolNumber: 'PLIER-001', name: 'Linesman Pliers', brand: 'Klein', model: 'D2000-28NE', categoryId: 2, locationId: 2, description: '9-inch linesman pliers with crimper' },
  { toolNumber: 'PLIER-002', name: 'Needle Nose Pliers', brand: 'Channellock', model: '318', categoryId: 2, locationId: 2, description: '8-inch needle nose pliers' },
  { toolNumber: 'PLIER-003', name: 'Channel Locks 12', brand: 'Channellock', model: '440', categoryId: 2, locationId: 2, description: '12-inch tongue and groove pliers' },
  { toolNumber: 'PLIER-004', name: 'Vise Grips', brand: 'Irwin', model: 'SP-10', categoryId: 2, locationId: 2, description: '10-inch locking pliers with wire cutter' },
  { toolNumber: 'PLIER-005', name: 'Diagonal Cutters', brand: 'Knipex', model: '70 02 160', categoryId: 2, locationId: 3, description: 'High-leverage diagonal cutters 6-inch' },
  { toolNumber: 'PLIER-006', name: 'Snap Ring Pliers', brand: 'Proto', model: 'J382', categoryId: 2, locationId: 3, description: 'Internal/external snap ring pliers set' },

  { toolNumber: 'SCREW-003', name: 'Screwdriver Set 12pc', brand: 'Wiha', model: '26193', categoryId: 2, locationId: 2, description: 'Precision screwdriver set with case' },
  { toolNumber: 'SCREW-004', name: 'Impact Screwdriver', brand: 'Vessel', model: 'M820', categoryId: 2, locationId: 2, description: 'Impact screwdriver with reversible bit' },
  { toolNumber: 'SCREW-005', name: 'Nut Driver Set', brand: 'Klein', model: '65200', categoryId: 2, locationId: 2, description: '6-piece nut driver set 3/16 to 9/16' },
  { toolNumber: 'CUT-001', name: 'Bolt Cutters 36', brand: 'Klein', model: 'KC36', categoryId: 2, locationId: 2, description: '36-inch bolt cutter up to 3/8 steel' },
  { toolNumber: 'CUT-002', name: 'Aviation Snips', brand: 'Midwest', model: 'W10R', categoryId: 2, locationId: 2, description: 'Offset aviation snips 3-piece set' },
  { toolNumber: 'CUT-003', name: 'Utility Knife', brand: 'Stanley', model: '10-099', categoryId: 2, locationId: 2, description: 'Quick-change retractable utility knife' },
  { toolNumber: 'CUT-004', name: 'Hacksaw', brand: 'Lenox', model: '20515', categoryId: 2, locationId: 2, description: 'High-tension hacksaw with bi-metal blade' },
  { toolNumber: 'PRY-001', name: 'Wonder Bar', brand: 'Stanley', model: '55-511', categoryId: 2, locationId: 2, description: '12-inch flat wonder bar nail puller' },
  { toolNumber: 'PRY-002', name: 'Crow Bar 36', brand: 'Proto', model: 'J4436', categoryId: 2, locationId: 3, description: '36-inch wrecking bar with nail slot' },

  // ===== Measuring & Layout (categoryId 3) =====
  { toolNumber: 'TAPE-001', name: 'Stanley PowerLock Tape', brand: 'Stanley', model: '33-725', categoryId: 3, locationId: 2, description: '25ft tape measure with blade lock' },
  { toolNumber: 'TAPE-002', name: 'Bosch Laser Measure', brand: 'Bosch', model: 'GLM50C', categoryId: 3, locationId: 2, description: '50ft laser distance measurer' },
  { toolNumber: 'TAPE-003', name: 'FatMax 35 Tape', brand: 'Stanley', model: '33-872', categoryId: 3, locationId: 2, description: '35ft FATMAX tape measure with standout' },
  { toolNumber: 'TAPE-004', name: 'Lufkin 100 Tape', brand: 'Lufkin', model: 'PHV1425N', categoryId: 3, locationId: 3, description: '100-foot open reel tape measure' },

  { toolNumber: 'LEVEL-001', name: 'Empire 48 Level', brand: 'Empire', model: 'E17548', categoryId: 3, locationId: 2, description: '48-inch aluminum box level' },
  { toolNumber: 'LEVEL-002', name: 'Stabila 24 Level', brand: 'Stabila', model: '37475', categoryId: 3, locationId: 2, description: '24-inch torpedo level with rare earth magnets' },
  { toolNumber: 'LEVEL-003', name: 'Bosch Laser Level', brand: 'Bosch', model: 'GLL 30', categoryId: 3, locationId: 2, description: 'Self-leveling cross-line laser level' },
  { toolNumber: 'LEVEL-004', name: 'Johnson Digital Level', brand: 'Johnson', model: '40-6644', categoryId: 3, locationId: 3, description: 'Digital angle finder and level 12-inch' },
  { toolNumber: 'LEVEL-005', name: 'Rotary Laser Kit', brand: 'DeWalt', model: 'DW079LG', categoryId: 3, locationId: 3, description: 'Green beam rotary laser with receiver' },

  { toolNumber: 'SQR-001', name: 'Combination Square', brand: 'Starrett', model: 'C4H-12', categoryId: 3, locationId: 2, description: '12-inch combination square hardened' },
  { toolNumber: 'SQR-002', name: 'Framing Square', brand: 'Empire', model: 'E100', categoryId: 3, locationId: 2, description: '24x16 inch aluminum framing square' },
  { toolNumber: 'SQR-003', name: 'Speed Square', brand: 'Swanson', model: 'SQV-1', categoryId: 3, locationId: 2, description: '7-inch speed square with rafter square' },
  { toolNumber: 'SQR-004', name: 'T-Bevel Square', brand: 'General', model: '828', categoryId: 3, locationId: 2, description: 'Sliding T-bevel square 12-inch' },
  { toolNumber: 'CAL-001', name: 'Digital Caliper', brand: 'Mitutoyo', model: '500-196-30', categoryId: 3, locationId: 3, description: '6-inch digital caliper with IP67 rating' },
  { toolNumber: 'MIC-001', name: 'Outside Micrometer', brand: 'Starrett', model: '436ME', categoryId: 3, locationId: 3, description: '1-inch outside micrometer 0.0001 grad' },

  // ===== Fastening & Finish (categoryId 4) =====
  { toolNumber: 'SCREW-001', name: 'DeWalt Screw Gun', brand: 'DeWalt', model: 'DCF620', categoryId: 4, locationId: 2, description: '20V MAX drywall screw gun' },
  { toolNumber: 'SCREW-002', name: 'Pneumatic Nailer', brand: 'Bostitch', model: 'F21PL', categoryId: 4, locationId: 2, description: 'Framing nailer 21-degree' },
  { toolNumber: 'NAIL-001', name: 'Finish Nailer 16ga', brand: 'Senco', model: 'SJ616F', categoryId: 4, locationId: 2, description: '16-gauge finish nailer with adjustable depth' },
  { toolNumber: 'NAIL-002', name: 'Brad Nailer 18ga', brand: 'Milwaukee', model: '2741-20', categoryId: 4, locationId: 2, description: 'M18 FUEL 18-gauge brad nailer' },
  { toolNumber: 'NAIL-003', name: 'Pin Nailer 23ga', brand: 'Grex', model: 'P635', categoryId: 4, locationId: 3, description: '23-gauge pin nailer with no-mar tip' },
  { toolNumber: 'NAIL-004', name: 'Roofing Nailer', brand: 'Bostitch', model: 'RN46-1', categoryId: 4, locationId: 3, description: 'Coil roofing nailer with adjustable shingle guide' },
  { toolNumber: 'STA-001', name: 'Staple Gun Pneumatic', brand: 'Senco', model: 'SJS18', categoryId: 4, locationId: 2, description: '18-gauge pneumatic stapler' },
  { toolNumber: 'STA-002', name: 'Staple Gun Manual', brand: 'Arrow', model: 'HTX50', categoryId: 4, locationId: 2, description: 'Heavy-duty manual staple gun 1/4 to 9/16' },
  { toolNumber: 'GLUE-001', name: 'Hot Glue Gun', brand: 'Bosch', model: 'PKP18E', categoryId: 4, locationId: 2, description: 'Variable-temperature hot glue gun' },
  { toolNumber: 'GLUE-002', name: 'Caulk Gun', brand: 'Tajima', model: 'PSG-L', categoryId: 4, locationId: 2, description: 'Professional smooth-rod caulk gun' },

  // ===== Safety (categoryId 5) =====
  { toolNumber: 'SAFE-001', name: 'Hard Hat', brand: 'MSA', model: 'V-Gard', categoryId: 5, locationId: 2, description: 'Type I hard hat with 4-point suspension' },
  { toolNumber: 'SAFE-002', name: 'Safety Glasses 10pk', brand: '3M', model: '2890', categoryId: 5, locationId: 2, description: 'Clear anti-fog safety glasses 10 pack' },
  { toolNumber: 'SAFE-003', name: 'Full Body Harness', brand: '3M', model: '1151340', categoryId: 5, locationId: 2, description: 'D-ring full body harness with quick-connect' },
  { toolNumber: 'SAFE-004', name: 'Safety Vest', brand: 'ML Kishigo', model: 'M5900', categoryId: 5, locationId: 2, description: 'Class 2 hi-vis safety vest mesh' },
  { toolNumber: 'SAFE-005', name: 'Welding Helmet', brand: 'Miller', model: '281200', categoryId: 5, locationId: 3, description: 'Auto-darkening welding helmet' },
  { toolNumber: 'SAFE-006', name: 'Ear Muffs', brand: '3M', model: 'PELTOR X5A', categoryId: 5, locationId: 2, description: 'Over-the-head earmuffs NRR 31dB' },
  { toolNumber: 'SAFE-007', name: 'Respirator Half-Mask', brand: '3M', model: '7502', categoryId: 5, locationId: 2, description: 'Half-face respirator silicone reusable' },
  { toolNumber: 'SAFE-008', name: 'Welding Jacket', brand: 'Lincoln', model: 'K3102-1', categoryId: 5, locationId: 3, description: 'Leather welding jacket size L' },
  { toolNumber: 'SAFE-009', name: 'Work Gloves 12pk', brand: 'Mechanix', model: 'MG-50-009', categoryId: 5, locationId: 2, description: 'M-pact impact-resistant work gloves' },
  { toolNumber: 'SAFE-010', name: 'Fall Arrest Lanyard', brand: '3M', model: '1231100', categoryId: 5, locationId: 2, description: '6-ft shock-absorbing lanyard with snap hooks' },

  // ===== Plumbing & Pipe (categoryId 6 — assume exists) =====
  { toolNumber: 'PIPE-002', name: 'Propane Torch Kit', brand: 'Bernzomatic', model: 'TS8000', categoryId: 6, locationId: 2, description: 'Self-igniting propane brazing torch' },
  { toolNumber: 'PIPE-003', name: 'Pipe Bender 1/2', brand: 'Ridgid', model: '36452', categoryId: 6, locationId: 3, description: '1/2-inch EMT conduit bender' },
  { toolNumber: 'PIPE-004', name: 'Tubing Cutter 1', brand: 'Ridgid', model: '40615', categoryId: 6, locationId: 2, description: '1-inch copper tubing cutter with reamer' },
  { toolNumber: 'PLUMB-001', name: 'Closet Auger', brand: 'General', model: 'GIDDS-5', categoryId: 6, locationId: 2, description: 'Toilet auger with vinyl sleeve' },
  { toolNumber: 'PLUMB-002', name: 'Drain Snake 25', brand: 'Ridgid', model: 'K-45', categoryId: 6, locationId: 2, description: '25-foot electric drum auger' },

  // ===== Electrical (categoryId 7 — assume exists) =====
  { toolNumber: 'ELEC-001', name: 'Multimeter', brand: 'Fluke', model: '87V', categoryId: 7, locationId: 2, description: 'Digital multimeter with True RMS' },
  { toolNumber: 'ELEC-002', name: 'Clamp Meter', brand: 'Fluke', model: '323', categoryId: 7, locationId: 2, description: '400A true-RMS clamp meter' },
  { toolNumber: 'ELEC-003', name: 'Voltage Tester', brand: 'Klein', model: 'NCVT-2', categoryId: 7, locationId: 2, description: 'Non-contact voltage tester dual-range' },
  { toolNumber: 'ELEC-004', name: 'Wire Strippers', brand: 'Klein', model: '11063W', categoryId: 7, locationId: 2, description: 'Self-adjusting wire strippers 10-22 AWG' },
  { toolNumber: 'ELEC-005', name: 'Crimping Tool', brand: 'Thomas & Betts', model: 'TBM10', categoryId: 7, locationId: 2, description: 'Sta-Kon wire terminal crimping tool' },
  { toolNumber: 'ELEC-006', name: 'Fish Tape 50', brand: 'Klein', model: '56007', categoryId: 7, locationId: 2, description: '50-foot steel fish tape with rewinder' },
  { toolNumber: 'ELEC-007', name: 'Label Maker', brand: 'Brother', model: 'PT-D600', categoryId: 7, locationId: 3, description: 'Professional label maker with QWERTY keyboard' },
  { toolNumber: 'ELEC-008', name: 'Megohmmeter', brand: 'Fluke', model: '1507', categoryId: 7, locationId: 3, description: 'Insulation resistance tester 250-1000V' },
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
  console.log(`Seeded ${count} tools total (file contains ${tools.length})`);
  await p.$disconnect();
}

main();
