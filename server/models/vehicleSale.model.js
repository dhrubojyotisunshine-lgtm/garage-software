const mongoose = require('mongoose');

// Standalone Vehicle Sale module — independent of all existing models.
const vehicleItemSchema = new mongoose.Schema({
  vehicleModel:  { type: String, default: '' },
  variant:       { type: String, default: '' },
  color:         { type: String, default: '' },
  chassisNumber: { type: String, default: '' },
  engineNumber:  { type: String, default: '' },
  price:         { type: Number, default: 0 },
  insurance:     { type: Number, default: 0 },
  rto:           { type: Number, default: 0 },
  total:         { type: Number, default: 0 }
}, { _id: false });

const vehicleSaleSchema = new mongoose.Schema({
  // Step 1 — Dealer & Sale Info
  dealer: {
    name:    { type: String, default: '' },
    address: { type: String, default: '' },
    phone:   { type: String, default: '' },
    email:   { type: String, default: '' },
    gstin:   { type: String, default: '' }
  },
  invoiceNo:      { type: String, required: true },
  saleDate:       { type: Date, required: true },
  saleType:       { type: String, enum: ['Cash', 'Finance', 'Exchange'], default: 'Cash' },
  salesExecutive: { type: String, default: '' },

  // Step 2 — Customer Details
  customer: {
    name:    { type: String, required: true },
    mobile:  { type: String, required: true },
    address: { type: String, default: '' },
    email:   { type: String, default: '' },
    pan:     { type: String, default: '' }
  },

  // Step 3 — Vehicle Details
  vehicles:     { type: [vehicleItemSchema], default: [] },
  bookingNo:    { type: String, default: '' },
  bookingDate:  { type: Date },
  deliveryDate: { type: Date },

  // Step 4 — Billing Breakdown
  billing: {
    exShowroom:       { type: Number, default: 0 },
    gst:              { type: Number, default: 0 },
    tcs:              { type: Number, default: 0 },
    accessories:      { type: Number, default: 0 },
    subtotal:         { type: Number, default: 0 },
    netVehicleAmount: { type: Number, default: 0 }
  },

  // Step 5 — Insurance Details
  insurance: {
    company:    { type: String, default: '' },
    policyTypes: {
      thirdParty:      { type: Boolean, default: false },
      comprehensive:   { type: Boolean, default: false },
      zeroDepreciation:{ type: Boolean, default: false },
      ownDamage:       { type: Boolean, default: false }
    },
    basicPremium:   { type: Number, default: 0 },
    gstOnPremium:   { type: Number, default: 0 },
    totalInsurance: { type: Number, default: 0 }
  },

  // Step 6 — RTO Charges
  rto: {
    registrationCharges: { type: Number, default: 0 },
    registrationFee:     { type: Number, default: 0 },
    totalRto:            { type: Number, default: 0 }
  },

  // Step 7 — Payment Details
  payment: {
    grossAmount:   { type: Number, default: 0 },
    totalDiscount: { type: Number, default: 0 },
    netPayable:    { type: Number, default: 0 },
    advancePaid:   { type: Number, default: 0 },
    balanceAmount: { type: Number, default: 0 },
    paymentMode:   { type: String, default: '' },
    amount:        { type: Number, default: 0 },
    transactionId: { type: String, default: '' },
    paymentDate:   { type: Date },
    paymentStatus: { type: String, enum: ['Paid', 'Pending'], default: 'Pending' }
  },

  // Step 8 — Narration / Remarks
  narration: { type: String, default: '' },
  remark:    { type: String, default: '' },

  // Tenancy / audit (matches project convention)
  garageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Garage', required: true },
  active:   { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('VehicleSale', vehicleSaleSchema);
