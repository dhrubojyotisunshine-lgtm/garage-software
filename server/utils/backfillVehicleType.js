/**
 * One-time backfill: tag every EXISTING vehicle model that has no vehicleType as '2W'.
 * (The 4-wheeler seed already tags cars '4W'; this fills in the older, untagged bikes
 * so every model reliably knows its type — no more UI guessing.)
 *
 * Only touches rows where vehicleType is missing/empty. Never changes '2W' or '4W' rows.
 * Safe to run repeatedly.
 *
 *   cd server
 *   node utils/backfillVehicleType.js <garageId>      # one garage
 *   node utils/backfillVehicleType.js --all           # every garage
 *   node utils/backfillVehicleType.js <garageId> --dry   # preview only
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
// Some ISP resolvers refuse the Atlas SRV query → "querySrv ECONNREFUSED".
try { require('dns').setServers(['8.8.8.8', '1.1.1.1']); } catch {}
const mongoose = require('mongoose');
const Garage = require('../models/Garage');
const VehicleModel = require('../models/masters/VehicleModel');

const args = process.argv.slice(2);
const dry = args.includes('--dry');
const all = args.includes('--all');
const garageIdArg = args.find(a => !a.startsWith('--'));

// Match models with no usable type: missing, null, or empty string.
const UNTAGGED = { $or: [{ vehicleType: { $exists: false } }, { vehicleType: null }, { vehicleType: '' }] };

(async () => {
  if (!all && !garageIdArg) {
    console.error('Provide a <garageId> or --all.');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log(`Connected${dry ? ' (DRY RUN — no writes)' : ''}`);

  let filter = { ...UNTAGGED };
  if (!all) {
    if (!mongoose.Types.ObjectId.isValid(garageIdArg)) { console.error(`Invalid garageId: ${garageIdArg}`); process.exit(1); }
    const g = await Garage.findById(garageIdArg).select('_id workshopName');
    if (!g) { console.error(`Garage not found: ${garageIdArg}`); process.exit(1); }
    filter.garageId = g._id;
    console.log(`Target garage: ${g.workshopName || g._id}`);
  } else {
    console.log('Target: ALL garages');
  }

  const count = await VehicleModel.countDocuments(filter);
  console.log(`Untagged models to set → '2W': ${count}`);

  if (!dry && count > 0) {
    const res = await VehicleModel.updateMany(filter, { $set: { vehicleType: '2W' } });
    console.log(`Updated: ${res.modifiedCount ?? res.nModified ?? 0}`);
  }

  await mongoose.disconnect();
  console.log('Done.');
  process.exit(0);
})().catch(err => { console.error('Error:', err.message); process.exit(1); });
