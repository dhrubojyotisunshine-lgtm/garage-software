const VehicleStock = require('../models/vehicleStock.model');
const VehicleSale = require('../models/vehicleSale.model');
const { validateStock } = require('../validation/vehicleStock.validation');

function pick(body = {}) {
  return {
    vehicleModel:  body.vehicleModel,
    variant:       body.variant || '',
    color:         body.color || '',
    chassisNumber: body.chassisNumber || '',
    engineNumber:  body.engineNumber || '',
    qty:           body.qty === '' || body.qty === undefined || body.qty === null ? 1 : Number(body.qty)
  };
}

// GET /api/vehicle-stock  — list (optional ?search=)
exports.list = async (req, res) => {
  try {
    const { search } = req.query;
    const q = { garageId: req.garage._id, active: { $ne: false } };
    if (search) {
      q.$or = [
        { vehicleModel:  { $regex: search, $options: 'i' } },
        { variant:       { $regex: search, $options: 'i' } },
        { color:         { $regex: search, $options: 'i' } },
        { chassisNumber: { $regex: search, $options: 'i' } },
        { engineNumber:  { $regex: search, $options: 'i' } }
      ];
    }
    const stock = await VehicleStock.find(q).sort({ createdAt: -1 });

    // Used = number of sold vehicles (across active sales) linked to each stock item.
    const ids = stock.map(s => s._id);
    const usage = ids.length ? await VehicleSale.aggregate([
      { $match: { garageId: req.garage._id, active: { $ne: false } } },
      { $unwind: '$vehicles' },
      { $match: { 'vehicles.stockId': { $in: ids } } },
      { $group: { _id: '$vehicles.stockId', used: { $sum: 1 } } }
    ]) : [];
    const usedMap = new Map(usage.map(u => [String(u._id), u.used]));

    const out = stock.map(s => {
      const used = usedMap.get(String(s._id)) || 0;
      return { ...s.toObject(), used, remaining: (s.qty || 0) - used };
    });
    res.json(out);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// GET /api/vehicle-stock/:id
exports.getById = async (req, res) => {
  try {
    const item = await VehicleStock.findOne({ _id: req.params.id, garageId: req.garage._id });
    if (!item) return res.status(404).json({ message: 'Not found' });
    res.json(item);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// POST /api/vehicle-stock  — single object, or { items: [...] } for bulk add.
exports.create = async (req, res) => {
  try {
    const raw = Array.isArray(req.body?.items) ? req.body.items : [req.body];
    const rows = raw.filter(r => r && String(r.vehicleModel || '').trim());
    if (rows.length === 0) return res.status(400).json({ message: 'At least one vehicle with a model is required.' });

    for (const r of rows) {
      const { valid, errors } = validateStock(r);
      if (!valid) return res.status(400).json({ message: 'Validation failed', errors });
    }
    const docs = rows.map(r => ({ ...pick(r), garageId: req.garage._id }));
    const created = await VehicleStock.insertMany(docs);
    res.status(201).json(created);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// PUT /api/vehicle-stock/:id
exports.update = async (req, res) => {
  try {
    const { valid, errors } = validateStock(req.body);
    if (!valid) return res.status(400).json({ message: 'Validation failed', errors });
    const item = await VehicleStock.findOneAndUpdate(
      { _id: req.params.id, garageId: req.garage._id },
      pick(req.body),
      { new: true, runValidators: true }
    );
    if (!item) return res.status(404).json({ message: 'Not found' });
    res.json(item);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// DELETE /api/vehicle-stock/:id  — soft delete
exports.remove = async (req, res) => {
  try {
    const item = await VehicleStock.findOneAndUpdate(
      { _id: req.params.id, garageId: req.garage._id },
      { active: false }
    );
    if (!item) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
