const mongoose = require('mongoose');

// Standalone Party master for the Ledger module.
// A party is uniquely identified by phone number.
const partySchema = new mongoose.Schema({
  partyName: { type: String, required: true, trim: true },
  phone:     { type: String, required: true, unique: true, trim: true }
}, { timestamps: true });

module.exports = mongoose.model('Party', partySchema);
