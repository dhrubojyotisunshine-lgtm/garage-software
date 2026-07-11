import { Store, ClipboardList } from 'lucide-react';
import { DateField } from '../ui/DateField';
import { SectionCard, Field, inputCls } from './parts';

export default function Step1DealerSale({ form, setTop, setNested, errors }) {
  const d = form.dealer;
  return (
    <>
      <SectionCard title="Dealer / Showroom Details" icon={Store}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="Dealer / Showroom Name" required>
            <input className={inputCls} value={d.name} onChange={e => setNested('dealer', 'name', e.target.value)} />
          </Field>
          <Field label="Address">
            <textarea rows={2} className={`${inputCls} resize-none`} value={d.address} onChange={e => setNested('dealer', 'address', e.target.value)} />
          </Field>
          <Field label="Phone">
            <input className={inputCls} value={d.phone} onChange={e => setNested('dealer', 'phone', e.target.value)} />
          </Field>
          <Field label="Email">
            <input type="email" className={inputCls} value={d.email} onChange={e => setNested('dealer', 'email', e.target.value)} />
          </Field>
          <Field label="GSTIN">
            <input className={inputCls} value={d.gstin} onChange={e => setNested('dealer', 'gstin', e.target.value)} />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="Sale Information" icon={ClipboardList}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <Field label="Invoice No." required error={errors['invoiceNo']}>
            <input className={inputCls} value={form.invoiceNo} onChange={e => setTop('invoiceNo', e.target.value)} placeholder="INV-2506001" />
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
          <Field label="Sales Executive">
            <input className={inputCls} value={form.salesExecutive} onChange={e => setTop('salesExecutive', e.target.value)} placeholder="Select Sales Executive" />
          </Field>
        </div>
      </SectionCard>
    </>
  );
}
