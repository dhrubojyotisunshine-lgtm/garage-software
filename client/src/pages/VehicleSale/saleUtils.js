// Shared form shape + derived-value calculations for the Vehicle Sale wizard.

export const STEPS = [
  'Dealer & Sale Info',
  'Customer Details',
  'Vehicle Details',
  'Billing Breakdown',
  'Insurance Details',
  'RTO Charges',
  'Payment Details',
  'Narration / Remarks'
];

export const emptyVehicle = () => ({
  vehicleModel: '', variant: '', color: '', chassisNumber: '', engineNumber: '',
  price: 0, insurance: 0, rto: 0, total: 0
});

export const emptySale = () => ({
  dealer: { name: '', address: '', phone: '', email: '', gstin: '' },
  invoiceNo: '', saleDate: '', saleType: 'Cash', salesExecutive: '',
  customer: { name: '', mobile: '', address: '', email: '', pan: '' },
  vehicles: [emptyVehicle()],
  bookingNo: '', bookingDate: '', deliveryDate: '',
  billing: { exShowroom: 0, gst: 0, tcs: 0, accessories: 0, subtotal: 0, netVehicleAmount: 0 },
  insurance: {
    company: '',
    policyTypes: { thirdParty: false, comprehensive: false, zeroDepreciation: false, ownDamage: false },
    basicPremium: 0, gstOnPremium: 0, totalInsurance: 0
  },
  rto: { registrationCharges: 0, registrationFee: 0, totalRto: 0 },
  payment: {
    grossAmount: 0, totalDiscount: 0, netPayable: 0, advancePaid: 0, balanceAmount: 0,
    paymentMode: '', amount: 0, transactionId: '', paymentDate: '', paymentStatus: 'Pending'
  },
  narration: '', remark: ''
});

export const num = (v) => (v === '' || v === null || v === undefined || isNaN(Number(v)) ? 0 : Number(v));

// Returns a NEW form object with numeric inputs normalized and all derived
// fields recomputed. Pure — never mutates. Safe to use for both display and save.
export function computeDerived(form) {
  // Insurance & RTO are captured in their own steps, so a vehicle's total is just its price.
  const vehicles = (form.vehicles || []).map(v => {
    const price = num(v.price);
    return { ...v, price, total: price };
  });

  // Ex-Showroom Price is auto-filled from the sum of vehicle prices.
  const b = form.billing || {};
  const exShowroom = vehicles.reduce((sum, v) => sum + num(v.price), 0);
  const gst = num(b.gst), tcs = num(b.tcs), accessories = num(b.accessories);
  const subtotal = exShowroom + gst + tcs + accessories;
  const billing = { ...b, exShowroom, gst, tcs, accessories, subtotal, netVehicleAmount: subtotal };

  const ins = form.insurance || {};
  const basicPremium = num(ins.basicPremium), gstOnPremium = num(ins.gstOnPremium);
  const insurance = { ...ins, basicPremium, gstOnPremium, totalInsurance: basicPremium + gstOnPremium };

  const r = form.rto || {};
  const registrationCharges = num(r.registrationCharges), registrationFee = num(r.registrationFee);
  const rto = { ...r, registrationCharges, registrationFee, totalRto: registrationCharges + registrationFee };

  const p = form.payment || {};
  const totalDiscount = num(p.totalDiscount), advancePaid = num(p.advancePaid), amount = num(p.amount);
  const grossAmount = billing.netVehicleAmount + insurance.totalInsurance + rto.totalRto;
  const netPayable = grossAmount - totalDiscount;
  const balanceAmount = netPayable - advancePaid;
  const payment = { ...p, totalDiscount, advancePaid, amount, grossAmount, netPayable, balanceAmount };

  return { ...form, vehicles, billing, insurance, rto, payment };
}

// Per-step validation. Returns an errors object ({} = valid). Only validates the given step.
export function validateStep(step, form) {
  const e = {};
  if (step === 0) {
    if (!form.invoiceNo?.trim()) e['invoiceNo'] = 'Invoice Number is required.';
    if (!form.saleDate) e['saleDate'] = 'Sale Date is required.';
    if (!form.saleType) e['saleType'] = 'Sale Type is required.';
  } else if (step === 1) {
    if (!form.customer?.name?.trim()) e['customer.name'] = 'Customer Name is required.';
    if (!form.customer?.mobile?.trim()) e['customer.mobile'] = 'Mobile Number is required.';
  } else if (step === 2) {
    if (!form.vehicles?.length) e['vehicles'] = 'Add at least one vehicle.';
    else {
      const first = form.vehicles[0];
      if (!first.vehicleModel?.trim()) e['vehicles.0.vehicleModel'] = 'Vehicle Model is required.';
    }
  } else if (step === 6) {
    if (!form.payment?.paymentStatus) e['payment.paymentStatus'] = 'Payment Status is required.';
  }
  return e;
}
