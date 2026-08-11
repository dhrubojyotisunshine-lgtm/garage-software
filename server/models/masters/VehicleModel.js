const mongoose = require('mongoose');

const vehicleModelSchema = new mongoose.Schema({
  name: { type: String, required: true },
  makeId: { type: mongoose.Schema.Types.ObjectId, ref: 'VehicleMake', required: true },
  makeName: String,
  garageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Garage', required: true },
  variant: String,
  // Optional tag to distinguish 2-wheeler vs 4-wheeler models ('' = untagged/legacy).
  // Additive & optional — nothing reads it yet; enables future filtering.
  vehicleType: { type: String, default: '' },
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('VehicleModel', vehicleModelSchema);
