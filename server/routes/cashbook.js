const express      = require('express');
const router       = express.Router();
const CashbookEntry = require('../models/CashbookEntry');
const Jobcard      = require('../models/Jobcard');
const CounterSale  = require('../models/CounterSale');
const PurchaseOrder = require('../models/PurchaseOrder');
const Customer     = require('../models/Customer');
const Supplier     = require('../models/Supplier');
const { protect }  = require('../middleware/auth');

router.use(protect);

const ONLINE_METHODS = ['UPI', 'Card', 'Cheque'];

/* Build a { $gte, $lte } date filter from optional from/to (inclusive days). */
function dateRangeFilter(dateFrom, dateTo) {
  const f = {};
  if (dateFrom) { const s = new Date(dateFrom); s.setHours(0, 0, 0, 0);   f.$gte = s; }
  if (dateTo)   { const e = new Date(dateTo);   e.setHours(23, 59, 59, 999); f.$lte = e; }
  return Object.keys(f).length ? f : null;
}

/* ── Running balance (all-time) ── */
async function getBalance(garageId) {
  const entries = await CashbookEntry.find({ garageId, active: { $ne: false } }, 'type amount');
  const inTotal  = entries.filter(e => e.type === 'IN').reduce((s, e) => s + e.amount, 0);
  const outTotal = entries.filter(e => e.type === 'OUT').reduce((s, e) => s + e.amount, 0);
  return { inTotal, outTotal, balance: inTotal - outTotal };
}

/* ── Stats ── */
router.get('/stats', async (req, res) => {
  try {
    const gid = req.garage._id;
    const { dateFrom, dateTo } = req.query;
    const q = { garageId: gid, active: { $ne: false } };
    const dr = dateRangeFilter(dateFrom, dateTo);
    if (dr) q.date = dr;

    const entries = await CashbookEntry.find(q, 'type amount paymentMethod');
    let cashReceived = 0, cashReceivedCash = 0, cashReceivedOnline = 0, cashSpend = 0;
    for (const e of entries) {
      if (e.type === 'IN') {
        cashReceived += e.amount;
        if (e.paymentMethod === 'Cash')            cashReceivedCash += e.amount;
        else if (ONLINE_METHODS.includes(e.paymentMethod)) cashReceivedOnline += e.amount;
      } else if (e.type === 'OUT') {
        cashSpend += e.amount;
      }
    }

    // Wallet balance stays all-time regardless of the date filter.
    const { balance } = await getBalance(gid);
    res.json({ cashReceived, cashReceivedCash, cashReceivedOnline, cashSpend, balance });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

/* ── Pending references for modal ── */
router.get('/pending', async (req, res) => {
  try {
    const { category, search } = req.query;
    const gid = req.garage._id;

    if (category === 'Counter Sale Payment') {
      const q = { garageId: gid, active: { $ne: false }, balanceDue: { $gt: 0 } };
      if (search) q.$or = [
        { customerName:   { $regex: search, $options: 'i' } },
        { customerMobile: { $regex: search, $options: 'i' } }
      ];
      const items = await CounterSale.find(q).sort({ createdAt: -1 }).limit(10);
      return res.json(items.map(i => ({
        _id: i._id, type: 'CounterSale',
        number: i.counterNumber, name: i.customerName,
        mobile: i.customerMobile, date: i.createdAt,
        balance: i.balanceDue
      })));
    }

    if (category === 'Jobcard Payment') {
      const q = { garageId: gid, deletedAt: null, balanceDue: { $gt: 0 } };
      if (search) q.$or = [
        { customerName:   { $regex: search, $options: 'i' } },
        { customerMobile: { $regex: search, $options: 'i' } }
      ];
      const items = await Jobcard.find(q).sort({ createdAt: -1 }).limit(10);
      return res.json(items.map(i => ({
        _id: i._id, type: 'Jobcard',
        number: i.jobcardNumber, name: i.customerName,
        mobile: i.customerMobile, date: i.createdAt,
        balance: i.balanceDue
      })));
    }

    if (category === 'PO Payment') {
      const q = { garageId: gid, active: { $ne: false }, pendingAmount: { $gt: 0 } };
      if (search) q.$or = [
        { supplierName: { $regex: search, $options: 'i' } },
        { poNumber:     { $regex: search, $options: 'i' } }
      ];
      const items = await PurchaseOrder.find(q).sort({ createdAt: -1 }).limit(10);
      return res.json(items.map(i => ({
        _id: i._id, type: 'PurchaseOrder',
        number: i.poNumber, name: i.supplierName,
        mobile: i.supplierPhone, date: i.createdAt,
        balance: i.pendingAmount
      })));
    }

    res.json([]);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

/* ── List ── */
router.get('/', async (req, res) => {
  try {
    const { search, category, date, dateFrom, dateTo, type, payMode } = req.query;
    const q = { garageId: req.garage._id, active: { $ne: false } };
    if (search) q.$or = [
      { referenceName:   { $regex: search, $options: 'i' } },
      { referenceMobile: { $regex: search, $options: 'i' } },
      { referenceNumber: { $regex: search, $options: 'i' } }
    ];
    if (category && category !== 'all') q.category = category;
    if (type     && type !== 'all')     q.type = type;
    // Cash vs Online (UPI / Card / Cheque)
    if (payMode === 'cash')   q.paymentMethod = 'Cash';
    if (payMode === 'online') q.paymentMethod = { $in: ONLINE_METHODS };
    const dr = dateRangeFilter(dateFrom, dateTo);
    if (dr) {
      q.date = dr;
    } else if (date) {
      const d = new Date(date);
      const start = new Date(d); start.setHours(0, 0, 0, 0);
      const end   = new Date(d); end.setHours(23, 59, 59, 999);
      q.date = { $gte: start, $lte: end };
    }
    const entries = await CashbookEntry.find(q).sort({ createdAt: -1 });
    res.json(entries);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

/* ── Create ── */
router.post('/', async (req, res) => {
  try {
    const { referenceId, referenceType, linkedPaidAmount, paymentMethod, transactionNumber, date, ...rest } = req.body;
    const entry = new CashbookEntry({
      ...rest,
      garageId: req.garage._id,
      referenceId,
      referenceType,
      linkedPaidAmount: linkedPaidAmount || 0,
      paymentMethod,
      transactionNumber,
      date: date || new Date()
    });
    await entry.save();

    // Sync linked document balance
    if (referenceId && linkedPaidAmount > 0) {
      const paid = Number(linkedPaidAmount);
      const txEntry = {
        amount: paid,
        paymentType: paymentMethod,
        details: transactionNumber || '',
        date: date || new Date()
      };

      if (referenceType === 'CounterSale') {
        const doc = await CounterSale.findById(referenceId);
        if (doc) {
          const newPaid = (doc.paidAmount || 0) + paid;
          const newBal  = Math.max(0, (doc.total || 0) - newPaid);
          doc.paidAmount  = newPaid;
          doc.balanceDue  = newBal;
          doc.transactions = [...(doc.transactions || []), txEntry];
          await doc.save();
        }
      }

      if (referenceType === 'Jobcard') {
        const doc = await Jobcard.findById(referenceId);
        if (doc) {
          const newPaid = (doc.paidAmount || 0) + paid;
          const newBal  = Math.max(0, (doc.billAmount || doc.total || 0) - newPaid);
          doc.paidAmount  = newPaid;
          doc.balanceDue  = newBal;
          doc.transactions = [...(doc.transactions || []), { ...txEntry, type: 'Payment' }];
          await doc.save();
        }
      }

      if (referenceType === 'PurchaseOrder') {
        const doc = await PurchaseOrder.findById(referenceId);
        if (doc) {
          const newPaid    = (doc.paidAmount || 0) + paid;
          const newPending = Math.max(0, (doc.totalPayable || 0) - newPaid);
          await PurchaseOrder.findByIdAndUpdate(referenceId, {
            paidAmount: newPaid, pendingAmount: newPending,
            transactionType: paymentMethod, transactionNumber, transactionDate: date
          });
        }
      }
    }

    const { balance } = await getBalance(req.garage._id);
    res.status(201).json({ entry, balance });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

/* ── Delete ── */
router.delete('/:id', async (req, res) => {
  try {
    await CashbookEntry.findOneAndUpdate(
      { _id: req.params.id, garageId: req.garage._id },
      { active: false }
    );
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
