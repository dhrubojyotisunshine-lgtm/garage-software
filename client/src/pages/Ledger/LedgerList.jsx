import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { ledgerApi } from '../../api/ledgerApi';
import { useToast } from '../../components/ui/Toast';
import LedgerTable from '../../components/LedgerTable';
import LedgerModal from '../../components/LedgerModal';
import PartyModal from '../../components/PartyModal';

export default function LedgerList() {
  const [rows, setRows]         = useState([]);
  const [loading, setLoading]   = useState(false);
  const [search, setSearch]     = useState('');
  const [modal, setModal]       = useState(null); // null | { item? }
  const [partyModal, setPartyModal] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Group by the party master id when available; fall back to name for legacy entries.
  const openParty = (r) => {
    if (r.partyId) navigate(`/inventory/ledger/party-id/${r.partyId}`);
    else navigate(`/inventory/ledger/party/${encodeURIComponent(r.partyName)}`);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await ledgerApi.list({ search: search || undefined });
      setRows(data);
    } catch { toast({ title: 'Failed to load ledger', variant: 'error' }); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id) => {
    if (!confirm('Delete this ledger entry?')) return;
    try {
      await ledgerApi.delete(id);
      toast({ title: 'Deleted', variant: 'success' });
      load();
    } catch { toast({ title: 'Delete failed', variant: 'error' }); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="font-heading font-bold text-gray-800 text-2xl">Ledger</h1>
        <div className="flex items-center gap-3">
          <button onClick={() => setPartyModal(true)}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
            Add Party
          </button>
          <button onClick={() => setModal({})}
            className="px-4 py-2 border border-red-500 text-red-500 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors">
            Add Ledger
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4 max-w-lg">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search Ledger By Party Name, Narration or Remark"
          className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
        />
      </div>

      <LedgerTable
        rows={rows}
        loading={loading}
        onEdit={(item) => setModal({ item })}
        onDelete={handleDelete}
        onParty={openParty}
      />

      {modal && (
        <LedgerModal
          item={modal.item}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load(); }}
        />
      )}

      {partyModal && (
        <PartyModal
          onClose={() => setPartyModal(false)}
          onSaved={() => { setPartyModal(false); toast({ title: 'Party ready — pick it in Add Ledger', variant: 'success' }); }}
        />
      )}
    </div>
  );
}
