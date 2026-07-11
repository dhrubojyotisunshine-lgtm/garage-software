const Party = require('../models/party.model');
const { validateParty } = require('../validation/party.validation');

// GET /api/party  — list (optional ?search= on name or phone)
exports.list = async (req, res) => {
  try {
    const { search } = req.query;
    const q = {};
    if (search) {
      q.$or = [
        { partyName: { $regex: search, $options: 'i' } },
        { phone:     { $regex: search, $options: 'i' } }
      ];
    }
    const parties = await Party.find(q).sort({ partyName: 1 });
    res.json(parties);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// GET /api/party/:id
exports.getById = async (req, res) => {
  try {
    const party = await Party.findById(req.params.id);
    if (!party) return res.status(404).json({ message: 'Not found' });
    res.json(party);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// POST /api/party
exports.create = async (req, res) => {
  try {
    const { valid, errors } = validateParty(req.body);
    if (!valid) return res.status(400).json({ message: 'Validation failed', errors });
    const party = await Party.create({
      partyName: String(req.body.partyName).trim(),
      phone:     String(req.body.phone).trim()
    });
    res.status(201).json(party);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'A party with this phone number already exists.', errors: { phone: 'Phone number already exists.' } });
    }
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/party/:id
exports.update = async (req, res) => {
  try {
    const { valid, errors } = validateParty(req.body);
    if (!valid) return res.status(400).json({ message: 'Validation failed', errors });
    const party = await Party.findByIdAndUpdate(
      req.params.id,
      { partyName: String(req.body.partyName).trim(), phone: String(req.body.phone).trim() },
      { new: true, runValidators: true }
    );
    if (!party) return res.status(404).json({ message: 'Not found' });
    res.json(party);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'A party with this phone number already exists.', errors: { phone: 'Phone number already exists.' } });
    }
    res.status(500).json({ message: err.message });
  }
};

module.exports = exports;
