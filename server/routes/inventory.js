const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect } = require('../middleware/auth');
const SparePart = require('../models/masters/SparePart');
const Lube = require('../models/masters/Lube');
const LabourItem = require('../models/masters/LabourItem');
const ServicePackage = require('../models/masters/ServicePackage');
const Jobcard = require('../models/Jobcard');
const CounterSale = require('../models/CounterSale');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

function parseCSV(buf) {
  const lines = buf.toString('utf8').split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  return lines.slice(1).map(line => {
    const vals = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    const obj = {};
    headers.forEach((h, i) => { obj[h] = vals[i] ?? ''; });
    return obj;
  }).filter(row => Object.values(row).some(v => v));
}

// Drop rows whose code already exists (in DB or earlier in the same file). Name is NOT deduped.
async function dedupeImport(Model, garageId, docs, codeField) {
  const existing = await Model.find({ garageId, active: { $ne: false } }, codeField).lean();
  const codes = new Set(existing.map(e => (e[codeField] || '').trim().toLowerCase()).filter(Boolean));
  const fresh = [];
  let skipped = 0;
  for (const d of docs) {
    const c = (d[codeField] || '').trim().toLowerCase();
    if (c && codes.has(c)) { skipped++; continue; }
    if (c) codes.add(c);
    fresh.push(d);
  }
  return { fresh, skipped };
}

router.use(protect);

router.get('/stats', async (req, res) => {
  try {
    const gid = req.garage._id;
    const q = { garageId: gid, active: { $ne: false } };

    const [spares, lubes, jobs, groups] = await Promise.all([
      SparePart.find(q),
      Lube.find(q),
      LabourItem.find(q),
      ServicePackage.find(q)
    ]);

    const price = (i) => i.sellingPrice || i.unitPrice || 0;
    const totalVal = (arr) => arr.reduce((acc, i) => acc + (i.currentStock || 1) * price(i), 0);

    res.json({
      spares: { count: spares.length, value: totalVal(spares) },
      lubes:  { count: lubes.length,  value: totalVal(lubes)  },
      jobs:   { count: jobs.length,   value: jobs.reduce((acc, i) => acc + price(i), 0) },
      groups: { count: groups.length, value: groups.reduce((acc, i) => acc + (i.totalPrice || 0), 0) }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/import/spares', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const rows = parseCSV(req.file.buffer);
    const docs = rows.map(r => ({
      garageId: req.garage._id,
      name: r.name,
      partNumber: r.partNumber || '',
      company: r.company || '',
      unit: r.unit || 'units',
      subCategory: r.subCategory || 'Frequent Items',
      purchasePrice: Number(r.purchasePrice) || 0,
      sellingPrice: Number(r.sellingPrice) || 0,
      unitPrice: Number(r.sellingPrice) || 0,
      currentStock: Number(r.currentStock) || 0,
      lowerLimit: Number(r.lowerLimit) || 0,
      rackNumber: r.rackNumber || '',
      allVehicles: true
    })).filter(d => d.partNumber?.trim());
    if (!docs.length) return res.status(400).json({ message: 'No valid rows found in CSV (partNumber is required for every row)' });
    const { fresh, skipped } = await dedupeImport(SparePart, req.garage._id, docs, 'partNumber');
    const result = fresh.length ? await SparePart.insertMany(fresh, { ordered: false }) : [];
    res.json({ inserted: result.length, total: rows.length, skipped });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.post('/import/lubes', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const rows = parseCSV(req.file.buffer);
    const docs = rows.map(r => ({
      garageId: req.garage._id,
      name: r.name,
      partNumber: r.partNumber || '',
      company: r.company || '',
      unit: r.unit || 'ltr',
      purchasePrice: Number(r.purchasePrice) || 0,
      sellingPrice: Number(r.sellingPrice) || 0,
      unitPrice: Number(r.sellingPrice) || 0,
      currentStock: Number(r.currentStock) || 0,
      lowerLimit: Number(r.lowerLimit) || 0,
      rackNumber: r.rackNumber || '',
      allVehicles: true
    })).filter(d => d.partNumber?.trim());
    if (!docs.length) return res.status(400).json({ message: 'No valid rows found in CSV (partNumber is required for every row)' });
    const { fresh, skipped } = await dedupeImport(Lube, req.garage._id, docs, 'partNumber');
    const result = fresh.length ? await Lube.insertMany(fresh, { ordered: false }) : [];
    res.json({ inserted: result.length, total: rows.length, skipped });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.post('/import/jobs', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const rows = parseCSV(req.file.buffer);
    const docs = rows.map(r => ({
      garageId: req.garage._id,
      name: r.name,
      jobCode: r.jobCode || '',
      unit: r.unit || 'units',
      subCategory: r.subCategory || 'out_source',
      sellingPrice: Number(r.sellingPrice) || 0,
      unitPrice: Number(r.sellingPrice) || 0,
      allVehicles: true
    })).filter(d => d.jobCode?.trim());
    if (!docs.length) return res.status(400).json({ message: 'No valid rows found in CSV (jobCode is required for every row)' });
    const { fresh, skipped } = await dedupeImport(LabourItem, req.garage._id, docs, 'jobCode');
    const result = fresh.length ? await LabourItem.insertMany(fresh, { ordered: false }) : [];
    res.json({ inserted: result.length, total: rows.length, skipped });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.get('/history', async (req, res) => {
  try {
    const gid = req.garage._id;
    const { type, dateFrom, dateTo, search, page = 1, limit = 40 } = req.query;

    const dateFilter = {};
    if (dateFrom) dateFilter.$gte = new Date(dateFrom);
    if (dateTo) { const d = new Date(dateTo); d.setHours(23, 59, 59, 999); dateFilter.$lte = d; }

    const nameRegex = search ? new RegExp(search, 'i') : null;

    // Jobcard items
    const jcMatch = { garageId: gid, deletedAt: { $exists: false } };
    if (Object.keys(dateFilter).length) jcMatch.createdAt = dateFilter;

    const jcPipeline = [
      { $match: jcMatch },
      { $unwind: '$items' },
      ...(type && type !== 'all' ? [{ $match: { 'items.itemType': type } }] : []),
      ...(nameRegex ? [{ $match: { 'items.name': nameRegex } }] : []),
      { $project: {
        date: '$createdAt',
        itemName: '$items.name',
        itemType: '$items.itemType',
        partNumber: '$items.partNumber',
        qty: '$items.qty',
        unitPrice: '$items.unitPrice',
        amount: '$items.finalAmount',
        source: { $literal: 'Jobcard' },
        sourceNumber: '$jobcardNumber',
        customerName: 1
      }}
    ];

    // Counter Sale items (no Labour)
    const csMatch = { garageId: gid, active: { $ne: false } };
    if (Object.keys(dateFilter).length) csMatch.createdAt = dateFilter;

    const csPipeline = type === 'Labour' ? [] : [
      { $match: csMatch },
      { $unwind: '$items' },
      ...(type && type !== 'all' ? [{ $match: { 'items.itemType': type } }] : []),
      ...(nameRegex ? [{ $match: { 'items.name': nameRegex } }] : []),
      { $project: {
        date: '$createdAt',
        itemName: '$items.name',
        itemType: '$items.itemType',
        partNumber: '$items.partNumber',
        qty: '$items.qty',
        unitPrice: '$items.unitPrice',
        amount: '$items.amount',
        source: { $literal: 'Counter Sale' },
        sourceNumber: '$counterNumber',
        customerName: 1
      }}
    ];

    const [jcItems, csItems] = await Promise.all([
      Jobcard.aggregate(jcPipeline),
      csPipeline.length ? CounterSale.aggregate(csPipeline) : Promise.resolve([])
    ]);

    const all = [...jcItems, ...csItems].sort((a, b) => new Date(b.date) - new Date(a.date));
    const total = all.length;
    const pg = Math.max(1, Number(page));
    const lim = Number(limit);
    const data = all.slice((pg - 1) * lim, pg * lim);

    res.json({ data, total, pages: Math.ceil(total / lim) || 1, page: pg });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;
