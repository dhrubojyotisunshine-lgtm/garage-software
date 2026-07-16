import { Store, ClipboardList } from 'lucide-react';
import { DateField } from '../ui/DateField';
import { SectionCard, Field, inputCls } from './parts';

export default function Step1DealerSale({ form, setTop, setNested, errors }) {
  const d = form.dealer;
  const roCls = `${inputCls} bg-gray-50 text-gray-600`;
  return (
    <>
      <SectionCard title="Dealer / Showroom Details" icon={Store}>
        <p className="text-xs text-gray-400 -mt-2 mb-3">Auto-filled from your garage profile.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="Dealer / Showroom Name">
            <input className={roCls} value={d.name} readOnly />
          </Field>
          <Field label="Address">
            <textarea rows={2} className={`${roCls} resize-none`} value={d.address} readOnly />
          </Field>
          <Field label="Phone">
            <input className={roCls} value={d.phone} readOnly />
          </Field>
          <Field label="Email">
            <input className={roCls} value={d.email} readOnly />
          </Field>
          <Field label="GSTIN">
            <input className={roCls} value={d.gstin} readOnly />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="Sale Information" icon={ClipboardList}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <Field label="Invoice No.">
            <input className={`${inputCls} bg-gray-50 text-gray-500`} value={form.invoiceNo || ''} readOnly placeholder="Auto-generated on save" />
          </Field>
          <Field label="Sale Date" required error={errors['saleDate']}>
            <DateField value={form.saleDate} onChange={e => setTop('saleDate', e.target.value)} className={`${inputCls} w-full`} />
          </Field>
          <Field label="Sale Type" required error={errors['saleType']}>
            <select className={inputCls} value={form.saleType} onChange={e => setTop('saleType', e.target.value)}>
              <option value="Cash">Cash</option>
              <option value="Finance">Finance</option>
              <option value="Exchange">Exchange</option>
            </select>
          </Field>
          <Field label="Enter Financer">
            <input className={inputCls} value={form.salesExecutive} onChange={e => setTop('salesExecutive', e.target.value)} placeholder="Enter Financer" />
          </Field>
        </div>
      </SectionCard>
    </>
  );
}
