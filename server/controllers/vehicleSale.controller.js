const VehicleSale = require('../models/vehicleSale.model');
const { validateVehicleSale } = require('../validation/vehicleSale.validation');

// GET /api/vehicle-sales  — list (optional ?search= on invoice / customer / booking)
exports.list = async (req, res) => {
  try {
    const { search } = req.query;
    const q = { garageId: req.garage._id, active: { $ne: false } };
    if (search) {
      q.$or = [
        { invoiceNo:         { $regex: search, $options: 'i' } },
        { bookingNo:         { $regex: search, $options: 'i' } },
        { 'customer.name':   { $regex: search, $options: 'i' } },
        { 'customer.mobile': { $regex: search, $options: 'i' } }
      ];
    }
    const sales = await VehicleSale.find(q).sort({ saleDate: -1, createdAt: -1 });
    res.json(sales);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// GET /api/vehicle-sales/:id
exports.getById = async (req, res) => {
  try {
    const sale = await VehicleSale.findOne({ _id: req.params.id, garageId: req.garage._id });
    if (!sale) return res.status(404).json({ message: 'Not found' });
    res.json(sale);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// POST /api/vehicle-sales
exports.create = async (req, res) => {
  try {
    const { valid, errors } = validateVehicleSale(req.body);
    if (!valid) return res.status(400).json({ message: 'Validation failed', errors });
    const sale = await VehicleSale.create({ ...req.body, garageId: req.garage._id });
    res.status(201).json(sale);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// PUT /api/vehicle-sales/:id
exports.update = async (req, res) => {
  try {
    const { valid, errors } = validateVehicleSale(req.body);
    if (!valid) return res.status(400).json({ message: 'Validation failed', errors });
    const { garageId, _id, ...payload } = req.body;
    const sale = await VehicleSale.findOneAndUpdate(
      { _id: req.params.id, garageId: req.garage._id },
      payload,
      { new: true, runValidators: true }
    );
    if (!sale) return res.status(404).json({ message: 'Not found' });
    res.json(sale);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// DELETE /api/vehicle-sales/:id  — soft delete (matches project convention)
exports.remove = async (req, res) => {
  try {
    const sale = await VehicleSale.findOneAndUpdate(
      { _id: req.params.id, garageId: req.garage._id },
      { active: false }
    );
    if (!sale) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// GET /api/vehicle-sales/reports/summary  — totals for the Sale Reports page
exports.summary = async (req, res) => {
  try {
    const sales = await VehicleSale.find({ garageId: req.garage._id, active: { $ne: false } });
    const totalSales = sales.length;
    let totalVehicles = 0, grossAmount = 0, netPayable = 0, advancePaid = 0, balanceAmount = 0;
    for (const s of sales) {
      totalVehicles += (s.vehicles || []).length;
      grossAmount   += s.payment?.grossAmount   || 0;
      netPayable    += s.payment?.netPayable    || 0;
      advancePaid   += s.payment?.advancePaid   || 0;
      balanceAmount += s.payment?.balanceAmount || 0;
    }
    res.json({ totalSales, totalVehicles, grossAmount, netPayable, advancePaid, balanceAmount });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
