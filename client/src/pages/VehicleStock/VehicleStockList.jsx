import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Pencil, Trash2 } from 'lucide-react';
import { vehicleStockApi } from '../../api/vehicleStockApi';
import { useToast } from '../../components/ui/Toast';
import Pagination from '../../components/ui/Pagination';

export default function VehicleStockList() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await vehicleStockApi.list({ page, limit, search: search || undefined });
      setRows(data.items || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
    } catch { toast({ title: 'Failed to load stock', variant: 'error' }); }
    finally { setLoading(false); }
  }, [page, limit, search]);

  useEffect(() => { load(); }, [load]);

  // Reset to page 1 whenever the search or page size changes.
  useEffect(() => { setPage(1); }, [search, limit]);

  const handleDelete = async (id) => {
    if (!confirm('Delete this stock record?')) return;
    try {
      await vehicleStockApi.delete(id);
      toast({ title: 'Deleted', variant: 'success' });
      load();
    } catch { toast({ title: 'Delete failed', variant: 'error' }); }
  };

  const cols = ['Sr No', 'Vehicle Model', 'Variant', 'Color', 'Chassis Number', 'Engine Number', 'Qty', 'Used', 'Remaining', 'Action'];

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="font-heading font-bold text-gray-800 text-2xl">Stock Management</h1>
        <button onClick={() => navigate('/vehicle-stock/new')}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors">
          <Plus size={16} /> Add Stock
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4 max-w-lg">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by Model, Variant, Color, Chassis or Engine No."
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
            ) : rows.length === 0 ? (
              <tr><td colSpan={cols.length} className="text-center py-12 text-gray-400">No stock records found</td></tr>
            ) : rows.map((r, idx) => (
              <tr key={r._id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                <td className="py-3 px-4 text-gray-500">{(page - 1) * limit + idx + 1}</td>
                <td className="py-3 px-4 font-medium text-gray-800">{r.vehicleModel}</td>
                <td className="py-3 px-4 text-gray-700">{r.variant || '-'}</td>
                <td className="py-3 px-4 text-gray-700">{r.color || '-'}</td>
                <td className="py-3 px-4 text-gray-500 text-xs">{r.chassisNumber || '-'}</td>
                <td className="py-3 px-4 text-gray-500 text-xs">{r.engineNumber || '-'}</td>
                <td className="py-3 px-4 text-gray-800 font-medium">{r.qty}</td>
                <td className="py-3 px-4 text-gray-600">{r.used ?? 0}</td>
                <td className="py-3 px-4">
                  <span className={`font-semibold ${(r.remaining ?? r.qty) <= 0 ? 'text-red-600' : 'text-green-600'}`}>{r.remaining ?? r.qty}</span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-1">
                    <button onClick={() => navigate(`/vehicle-stock/${r._id}`)} title="Edit" className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-400 hover:text-blue-600">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => handleDelete(r._id)} title="Delete" className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination page={page} pages={pages} total={total} limit={limit} onPage={setPage} onLimit={setLimit} />
    </div>
  );
}
