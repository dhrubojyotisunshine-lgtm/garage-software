import { useState, useEffect, useRef } from 'react';
import { Car, Plus, Trash2, Search } from 'lucide-react';
import { DateField } from '../ui/DateField';
import { SectionCard, Field, inputCls, errorCls } from './parts';
import { emptyVehicle, num } from '../../pages/VehicleSale/saleUtils';
import { vehicleStockApi } from '../../api/vehicleStockApi';
import { formatCurrency } from '../../utils/format';

const cellCls = 'w-full border border-border rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white';

export default function Step3Vehicle({ form, setForm, setTop, errors }) {
  const vehicles = form.vehicles || [];

  const updateVehicle = (idx, field, value) =>
    setForm(f => ({ ...f, vehicles: f.vehicles.map((v, i) => i === idx ? { ...v, [field]: value } : v) }));
  const addVehicle = () => setForm(f => ({ ...f, vehicles: [...f.vehicles, emptyVehicle()] }));
  const removeVehicle = (idx) => setForm(f => ({ ...f, vehicles: f.vehicles.filter((_, i) => i !== idx) }));

  // Stock vehicle picker — fill a row from Stock Management inventory.
  const [stock, setStock] = useState([]);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const pickerRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    vehicleStockApi.list().then(({ data }) => setStock(Array.isArray(data) ? data : [])).catch(() => {});
  }, [open]);

  useEffect(() => {
    const onDown = (e) => { if (pickerRef.current && !pickerRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  const filteredStock = stock.filter(s => {
    const q = query.toLowerCase();
    return [s.vehicleModel, s.variant, s.color, s.chassisNumber, s.engineNumber]
      .some(v => (v || '').toLowerCase().includes(q));
  });

  const pickStock = (s) => {
    setForm(f => {
      const rows = [...f.vehicles];
      const filled = {
        ...emptyVehicle(), stockId: s._id,
        vehicleModel: s.vehicleModel || '', variant: s.variant || '', color: s.color || '',
        chassisNumber: s.chassisNumber || '', engineNumber: s.engineNumber || ''
      };
      const emptyIdx = rows.findIndex(v => !v.vehicleModel?.trim() && !v.chassisNumber?.trim());
      if (emptyIdx >= 0) rows[emptyIdx] = { ...rows[emptyIdx], ...filled, price: rows[emptyIdx].price };
      else rows.push(filled);
      return { ...f, vehicles: rows };
    });
    setOpen(false); setQuery('');
  };

  const cols = ['#', 'Vehicle Model *', 'Variant / Grade', 'Color', 'Chassis Number', 'Engine Number', 'Price (₹)', 'Total (₹)', ''];

  return (
    <>
      <SectionCard title="Vehicle Details" icon={Car}>
        {/* Search vehicle from Stock Management */}
        <div className="relative mb-4 max-w-md" ref={pickerRef}>
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={query}
            onFocus={() => setOpen(true)}
            onChange={e => { setQuery(e.target.value); setOpen(true); }}
            placeholder="Search vehicle from stock (model, chassis, engine)"
            className={`${inputCls} pl-9`}
          />
          {open && (
            <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-xl max-h-64 overflow-y-auto">
              {filteredStock.length === 0 ? (
                <div className="px-3 py-4 text-center text-sm text-gray-400">
                  {stock.length === 0 ? 'No stock vehicles found' : 'No match'}
                </div>
              ) : filteredStock.map(s => (
                <button key={s._id} type="button" onClick={() => pickStock(s)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 border-b border-gray-100 last:border-0">
                  <div className="font-medium text-gray-800">{s.vehicleModel} {s.variant ? `· ${s.variant}` : ''} {s.color ? `· ${s.color}` : ''}</div>
                  <div className="text-xs text-gray-400">
                    Chassis: {s.chassisNumber || '-'} · Engine: {s.engineNumber || '-'}
                    <span className="ml-1">· Qty: {s.qty} · Used: {s.used ?? 0} · </span>
                    <span className={`font-semibold ${(s.remaining ?? s.qty) <= 0 ? 'text-red-500' : 'text-green-600'}`}>Remaining: {s.remaining ?? s.qty}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="overflow-x-auto -mx-2">
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="border-b border-border bg-gray-50">
                {cols.map((h, i) => (
                  <th key={i} className="text-left py-2.5 px-2 text-xs font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {vehicles.map((v, idx) => (
                <tr key={idx} className="border-b border-gray-100 align-top">
                  <td className="py-2 px-2 text-gray-500">{idx + 1}</td>
                  <td className="py-2 px-2"><input className={cellCls} value={v.vehicleModel} onChange={e => updateVehicle(idx, 'vehicleModel', e.target.value)} /></td>
                  <td className="py-2 px-2"><input className={cellCls} value={v.variant} onChange={e => updateVehicle(idx, 'variant', e.target.value)} /></td>
                  <td className="py-2 px-2"><input className={cellCls} value={v.color} onChange={e => updateVehicle(idx, 'color', e.target.value)} /></td>
                  <td className="py-2 px-2"><input className={cellCls} value={v.chassisNumber} onChange={e => updateVehicle(idx, 'chassisNumber', e.target.value)} /></td>
                  <td className="py-2 px-2"><input className={cellCls} value={v.engineNumber} onChange={e => updateVehicle(idx, 'engineNumber', e.target.value)} /></td>
                  <td className="py-2 px-2"><input type="number" className={cellCls} value={v.price} onChange={e => updateVehicle(idx, 'price', e.target.value)} /></td>
                  <td className="py-2 px-2 font-medium text-gray-800 whitespace-nowrap">{formatCurrency(num(v.price))}</td>
                  <td className="py-2 px-2">
                    <button onClick={() => removeVehicle(idx)} disabled={vehicles.length === 1}
                      className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {errors['vehicles'] && <p className={errorCls}>{errors['vehicles']}</p>}
        {errors['vehicles.0.vehicleModel'] && <p className={errorCls}>{errors['vehicles.0.vehicleModel']}</p>}

        <button onClick={addVehicle}
          className="mt-3 inline-flex items-center gap-1.5 px-3 py-2 border border-primary text-primary rounded-lg text-sm font-medium hover:bg-primary hover:text-white transition-colors">
          <Plus size={15} /> Add Another Vehicle
        </button>
      </SectionCard>

      <SectionCard title="Booking Details">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Field label="Booking Number">
            <input className={inputCls} value={form.bookingNo} onChange={e => setTop('bookingNo', e.target.value)} />
          </Field>
          <Field label="Booking Date">
            <DateField value={form.bookingDate} onChange={e => setTop('bookingDate', e.target.value)} className={`${inputCls} w-full`} />
          </Field>
          <Field label="Expected Delivery Date">
            <DateField value={form.deliveryDate} onChange={e => setTop('deliveryDate', e.target.value)} className={`${inputCls} w-full`} />
          </Field>
        </div>
      </SectionCard>
    </>
  );
}
