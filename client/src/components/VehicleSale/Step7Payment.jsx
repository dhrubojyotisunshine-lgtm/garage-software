import { Wallet, CreditCard } from 'lucide-react';
import { DateField } from '../ui/DateField';
import { SectionCard, Field, inputCls, errorCls } from './parts';
import { computeDerived } from '../../pages/VehicleSale/saleUtils';
import { formatCurrency } from '../../utils/format';

function SummaryRow({ label, value, strong }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <span className={`text-sm ${strong ? 'font-semibold text-gray-800' : 'text-gray-500'}`}>{label}</span>
      <span className={`text-sm ${strong ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>{value}</span>
    </div>
  );
}

export default function Step7Payment({ form, setNested, errors }) {
  const p = form.payment;
  const d = computeDerived(form).payment;
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <SectionCard title="Payment Summary" icon={Wallet}>
        <SummaryRow label="Gross Amount (A + B + C)" value={formatCurrency(d.grossAmount)} />
        <div className="flex items-center justify-between py-2 border-b border-gray-100">
          <span className="text-sm text-gray-500">Total Discount</span>
          <input type="number" className={`${inputCls} max-w-[160px] text-right`} value={p.totalDiscount} onChange={e => setNested('payment', 'totalDiscount', e.target.value)} />
        </div>
        <SummaryRow label="Net Payable" value={formatCurrency(d.netPayable)} strong />
        <div className="flex items-center justify-between py-2 border-b border-gray-100">
          <span className="text-sm text-gray-500">Advance Paid</span>
          <input type="number" className={`${inputCls} max-w-[160px] text-right`} value={p.advancePaid} onChange={e => setNested('payment', 'advancePaid', e.target.value)} />
        </div>
        <SummaryRow label="Balance Amount" value={formatCurrency(d.balanceAmount)} strong />
      </SectionCard>

      <SectionCard title="Payment Information" icon={CreditCard}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label="Payment Mode">
            <select className={inputCls} value={p.paymentMode} onChange={e => setNested('payment', 'paymentMode', e.target.value)}>
              <option value="">Select Mode</option>
              <option value="Cash">Cash</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="UPI">UPI</option>
              <option value="Cheque">Cheque</option>
              <option value="Card">Card</option>
              <option value="Finance">Finance</option>
            </select>
          </Field>
          <Field label="Amount (₹)">
            <input type="number" className={inputCls} value={p.amount} onChange={e => setNested('payment', 'amount', e.target.value)} />
          </Field>
          <Field label="Transaction ID / Ref No.">
            <input className={inputCls} value={p.transactionId} onChange={e => setNested('payment', 'transactionId', e.target.value)} />
          </Field>
          <Field label="Payment Date">
            <DateField value={p.paymentDate} onChange={e => setNested('payment', 'paymentDate', e.target.value)} className={`${inputCls} w-full`} />
          </Field>
          <Field label="Payment Status" required error={errors['payment.paymentStatus']}>
            <div className="flex items-center gap-6 pt-1.5">
              {['Paid', 'Pending'].map(s => (
                <label key={s} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input type="radio" name="paymentStatus" className="accent-primary w-4 h-4" checked={p.paymentStatus === s} onChange={() => setNested('payment', 'paymentStatus', s)} />
                  {s}
                </label>
              ))}
            </div>
          </Field>
        </div>
      </SectionCard>
    </div>
  );
}
