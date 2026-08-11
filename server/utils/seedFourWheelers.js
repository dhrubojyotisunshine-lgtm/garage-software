/**
 * One-time (idempotent) loader: add the 4-wheeler make/model catalogue to a garage's
 * Masters. Each model inserted is tagged vehicleType: '4W'.
 *
 * It NEVER touches existing rows — it reuses a make of the same name and adds only the
 * models a garage doesn't already have (case-insensitive dedup). Safe to run repeatedly.
 *
 *   cd server
 *   node utils/seedFourWheelers.js <garageId>     # one specific garage
 *   node utils/seedFourWheelers.js --all          # every garage
 *   node utils/seedFourWheelers.js <garageId> --dry   # preview only, change nothing
 *
 * Tip: get a garageId from mongosh → db.garages.find({}, { workshopName: 1 })
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
// Some ISP resolvers (e.g. certain Jio/Reliance setups) refuse the Atlas SRV
// query → "querySrv ECONNREFUSED". Force a public resolver just for this script.
try { require('dns').setServers(['8.8.8.8', '1.1.1.1']); } catch {}
const mongoose = require('mongoose');
const Garage = require('../models/Garage');
const VehicleMake = require('../models/masters/VehicleMake');
const VehicleModel = require('../models/masters/VehicleModel');
const FOUR_WHEELER_DATA = require('./fourWheelerData');

const args = process.argv.slice(2);
const dry = args.includes('--dry');
const all = args.includes('--all');
const garageIdArg = args.find(a => !a.startsWith('--'));

const norm = (s) => String(s || '').trim().toLowerCase();

async function seedGarage(garage) {
  let makesCreated = 0, makesReused = 0, modelsAdded = 0, modelsSkipped = 0;

  for (const [makeName, models] of Object.entries(FOUR_WHEELER_DATA)) {
    // Reuse an existing make of the same name (case-insensitive) or create it.
    let make = await VehicleMake.findOne({
      garageId: garage._id,
      name: new RegExp(`^${makeName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
    });
    if (!make) {
      makesCreated++;
      if (!dry) make = await VehicleMake.create({ name: makeName, garageId: garage._id, active: true });
    } else {
      makesReused++;
    }

    // Existing model names under this make → skip set.
    const existing = make
      ? await VehicleModel.find({ garageId: garage._id, makeId: make._id }, 'name').lean()
      : [];
    const have = new Set(existing.map(m => norm(m.name)));

    const toAdd = [];
    for (const modelName of models) {
      if (have.has(norm(modelName))) { modelsSkipped++; continue; }
      have.add(norm(modelName));
      toAdd.push({
        name: modelName,
        makeId: make?._id,
        makeName,
        garageId: garage._id,
        vehicleType: '4W',
        active: true,
      });
    }
    if (toAdd.length) {
      modelsAdded += toAdd.length;
      if (!dry) await VehicleModel.insertMany(toAdd);
    }
  }

  console.log(
    `  ${garage.workshopName || garage._id}: ` +
    `makes +${makesCreated} (reused ${makesReused}), models +${modelsAdded} (skipped ${modelsSkipped})`
  );
  return { makesCreated, makesReused, modelsAdded, modelsSkipped };
}

(async () => {
  if (!all && !garageIdArg) {
    console.error('Provide a <garageId> or --all. Example: node utils/seedFourWheelers.js 6a1b1784...');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log(`Connected${dry ? ' (DRY RUN — no writes)' : ''}`);

  let garages;
  if (all) {
    garages = await Garage.find({}, 'workshopName');
  } else {
    if (!mongoose.Types.ObjectId.isValid(garageIdArg)) {
      console.error(`Invalid garageId: ${garageIdArg}`);
      process.exit(1);
    }
    const g = await Garage.findById(garageIdArg).select('workshopName');
    if (!g) { console.error(`Garage not found: ${garageIdArg}`); process.exit(1); }
    garages = [g];
  }

  console.log(`Seeding 4-wheeler catalogue into ${garages.length} garage(s)...`);
  for (const g of garages) await seedGarage(g);

  await mongoose.disconnect();
  console.log('Done.');
  process.exit(0);
})().catch(err => { console.error('Error:', err.message); process.exit(1); });
