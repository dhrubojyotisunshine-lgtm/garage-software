import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Pencil, Trash2, Download } from 'lucide-react';
import { vehicleSaleApi } from '../../api/vehicleSaleApi';
import { useToast } from '../../components/ui/Toast';
import { formatCurrency, formatDate } from '../../utils/format';
import { downloadInvoicePdf } from './invoicePdf';

export default function VehicleSalesListPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await vehicleSaleApi.list({ search: search || undefined });
      setSales(data);
    } catch { toast({ title: 'Failed to load sales', variant: 'error' }); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!confirm('Delete this vehicle sale?')) return;
    try {
      await vehicleSaleApi.delete(id);
      toast({ title: 'Deleted', variant: 'success' });
      load();
    } catch { toast({ title: 'Delete failed', variant: 'error' }); }
  };

  const cols = ['Sr No', 'Invoice No.', 'Date', 'Customer', 'Mobile', 'Vehicles', 'Net Payable', 'Advance Paid', 'Balance Amount', 'Status', 'Action'];

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="font-heading font-bold text-gray-800 text-2xl">Vehicle Sales</h1>
        <button onClick={() => navigate('/sale/vehicle-sales/new')}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors">
          <Plus size={16} /> Add Sale
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4 max-w-lg">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by Invoice, Customer Name or Mobile"
          className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              {cols.map(h => (
                <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={cols.length} className="text-center py-12 text-gray-400">Loading…</td></tr>
            ) : sales.length === 0 ? (
              <tr><td colSpan={cols.length} className="text-center py-12 text-gray-400">No vehicle sales found</td></tr>
            ) : sales.map((s, idx) => (
              <tr key={s._id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 cursor-pointer"
                onClick={() => navigate(`/sale/vehicle-sales/${s._id}`)}>
                <td className="py-3 px-4 text-gray-500">{idx + 1}</td>
                <td className="py-3 px-4" onClick={e => e.stopPropagation()}>
                  <button onClick={() => navigate(`/vehicle-sale-invoice/${s._id}`)}
                    className="font-medium text-gray-800 underline underline-offset-2 hover:text-primary">
                    {s.invoiceNo}
                  </button>
                </td>
                <td className="py-3 px-4 text-gray-600 whitespace-nowrap">{formatDate(s.saleDate)}</td>
                <td className="py-3 px-4 text-gray-700">{s.customer?.name || '-'}</td>
                <td className="py-3 px-4 text-gray-500">{s.customer?.mobile || '-'}</td>
                <td className="py-3 px-4 text-gray-500">{s.vehicles?.length || 0}</td>
                <td className="py-3 px-4 text-gray-800 font-medium whitespace-nowrap">{formatCurrency(s.payment?.netPayable || 0)}</td>
                <td className="py-3 px-4 text-gray-700 whitespace-nowrap">{formatCurrency(s.payment?.advancePaid || 0)}</td>
                <td className="py-3 px-4 text-gray-800 font-medium whitespace-nowrap">{formatCurrency(s.payment?.balanceAmount || 0)}</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    s.payment?.paymentStatus === 'Paid' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'
                  }`}>{s.payment?.paymentStatus || 'Pending'}</span>
                </td>
                <td className="py-3 px-4" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center gap-1">
                    <button onClick={() => downloadInvoicePdf(s)} title="Download Invoice PDF" className="p-1.5 rounded-lg hover:bg-green-50 text-green-500 hover:text-green-700">
                      <Download size={14} />
                    </button>
                    <button onClick={() => navigate(`/sale/vehicle-sales/${s._id}`)} title="Edit" className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-400 hover:text-blue-600">
                      <Pencil size={14} />
                    </button>
                    <button onClick={(e) => handleDelete(e, s._id)} title="Delete" className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
