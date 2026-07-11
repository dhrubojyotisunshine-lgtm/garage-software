import { Car, Plus, Trash2 } from 'lucide-react';
import { DateField } from '../ui/DateField';
import { SectionCard, Field, inputCls, errorCls } from './parts';
import { emptyVehicle, num } from '../../pages/VehicleSale/saleUtils';
import { formatCurrency } from '../../utils/format';

const cellCls = 'w-full border border-border rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white';

export default function Step3Vehicle({ form, setForm, setTop, errors }) {
  const vehicles = form.vehicles || [];

  const updateVehicle = (idx, field, value) =>
    setForm(f => ({ ...f, vehicles: f.vehicles.map((v, i) => i === idx ? { ...v, [field]: value } : v) }));
  const addVehicle = () => setForm(f => ({ ...f, vehicles: [...f.vehicles, emptyVehicle()] }));
  const removeVehicle = (idx) => setForm(f => ({ ...f, vehicles: f.vehicles.filter((_, i) => i !== idx) }));

  const cols = ['#', 'Vehicle Model *', 'Variant / Grade', 'Color', 'Chassis Number', 'Engine Number', 'Price (₹)', 'Total (₹)', ''];

  return (
    <>
      <SectionCard title="Vehicle Details" icon={Car}>
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
