const mongoose = require('mongoose');

const jobcardStatusSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, enum: ['Open', 'Completed', 'Closed'], default: 'Open' },
  garageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Garage', required: true },
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('JobcardStatus', jobcardStatusSchema);
