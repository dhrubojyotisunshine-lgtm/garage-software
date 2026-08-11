/**
 * Correction: re-tag vehicle models using the 4-wheeler list as the authority.
 *
 * The earlier backfill set EVERY untagged model to '2W', which wrongly tagged any
 * pre-existing car (e.g. a legacy "Alto K10") as 2W. This fixes that:
 *   - model name is in the 4-wheeler catalogue  → '4W'
 *   - already '4W' (manually tagged)            → keep '4W' (never downgrade)
 *   - everything else                           → '2W'
 *
 * Safe / idempotent. Only writes rows whose type actually changes.
 *
 *   cd server
 *   node utils/retagVehicleTypes.js <garageId> --dry   # preview
 *   node utils/retagVehicleTypes.js <garageId>         # apply
 *   node utils/retagVehicleTypes.js --all
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
try { require('dns').setServers(['8.8.8.8', '1.1.1.1']); } catch {}
const mongoose = require('mongoose');
const Garage = require('../models/Garage');
const VehicleModel = require('../models/masters/VehicleModel');
const FOUR_WHEELER_DATA = require('./fourWheelerData');

const args = process.argv.slice(2);
const dry = args.includes('--dry');
const all = args.includes('--all');
const garageIdArg = args.find(a => !a.startsWith('--'));

// Set of all 4-wheeler model names (lowercased).
const fourWheelNames = new Set(
  Object.values(FOUR_WHEELER_DATA).flat().map(n => n.trim().toLowerCase())
);
const correctType = (m) => {
  if (fourWheelNames.has(String(m.name || '').trim().toLowerCase())) return '4W';
  if (m.vehicleType === '4W') return '4W';   // don't downgrade a manual 4W tag
  return '2W';
};

(async () => {
  if (!all && !garageIdArg) { console.error('Provide a <garageId> or --all.'); process.exit(1); }
  await mongoose.connect(process.env.MONGO_URI);
  console.log(`Connected${dry ? ' (DRY RUN — no writes)' : ''}`);

  const filter = {};
  if (!all) {
    if (!mongoose.Types.ObjectId.isValid(garageIdArg)) { console.error(`Invalid garageId: ${garageIdArg}`); process.exit(1); }
    const g = await Garage.findById(garageIdArg).select('workshopName');
    if (!g) { console.error(`Garage not found: ${garageIdArg}`); process.exit(1); }
    filter.garageId = g._id;
    console.log(`Target garage: ${g.workshopName || g._id}`);
  }

  const models = await VehicleModel.find(filter, 'name makeName vehicleType').lean();
  const fixes = [];
  for (const m of models) {
    const want = correctType(m);
    if (want !== (m.vehicleType || '')) fixes.push({ _id: m._id, from: m.vehicleType || '(empty)', to: want, label: `${m.makeName || ''} ${m.name}`.trim() });
  }

  console.log(`Models scanned: ${models.length} | to re-tag: ${fixes.length}`);
  fixes.slice(0, 40).forEach(f => console.log(`  ${f.label}: ${f.from} → ${f.to}`));
  if (fixes.length > 40) console.log(`  …and ${fixes.length - 40} more`);

  if (!dry) {
    for (const f of fixes) await VehicleModel.updateOne({ _id: f._id }, { $set: { vehicleType: f.to } });
    console.log(`Updated: ${fixes.length}`);
  }

  await mongoose.disconnect();
  console.log('Done.');
  process.exit(0);
})().catch(err => { console.error('Error:', err.message); process.exit(1); });
