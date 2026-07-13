import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Printer, Wallet, IndianRupee, FileText, CalendarClock } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DateField } from '../../components/ui/DateField';
import { ledgerApi } from '../../api/ledgerApi';
import { useToast } from '../../components/ui/Toast';
import { formatCurrency, formatDate } from '../../utils/format';
import LedgerModal from '../../components/LedgerModal';
import { partyApi } from '../../api/partyApi';

const csvCell = (v) => {
  if (v == null) return '';
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

function StatBlock({ icon: Icon, label, value, iconBg, valueClass }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 px-5 py-4 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconBg}`}>
        <Icon size={22} className="text-white" />
      </div>
      <div>
        <div className="text-xs text-gray-500 mb-0.5">{label}</div>
        <div className={`text-xl font-bold text-gray-800 ${valueClass || ''}`}>{value}</div>
      </div>
    </div>
  );
}

export default function LedgerDetail() {
  const { name, partyId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [tab, setTab] = useState('details');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  // Name comes from the response when navigating by partyId; from the URL otherwise.
  const displayName = data?.partyName || (name ? decodeURIComponent(name) : '');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;
      const { data } = partyId
        ? await ledgerApi.partyById(partyId, params)
        : await ledgerApi.party(decodeURIComponent(name), params);
      setData(data);
    } catch (err) {
      // A party with no ledger entries yet returns 404 — still render its page
      // (with the Add Ledger button) using the party master's name/phone.
      if (partyId && err.response?.status === 404) {
        try {
          const { data: party } = await partyApi.get(partyId);
          setData({
            partyName: party.partyName, partyPhone: party.phone,
            summary: { totalDebit: 0, totalCredit: 0, balance: 0, count: 0, firstDate: null, lastDate: null },
            opening: 0, rows: [], totalDebit: 0, totalCredit: 0, closing: 0
          });
        } catch { toast({ title: 'Failed to load ledger', variant: 'error' }); }
      } else {
        toast({ title: 'Failed to load ledger', variant: 'error' });
      }
    } finally { setLoading(false); }
  }, [partyId, name, dateFrom, dateTo]);

  useEffect(() => { load(); }, [load]);

  const exportCSV = () => {
    if (!data || !data.rows.length) return toast({ title: 'Nothing to export', variant: 'error' });
    const cols = ['Date', 'Type', 'Narration', 'Remark', 'Debit', 'Credit', 'Balance'];
    const lines = [cols.join(',')];
    lines.push(['', '', 'Opening Balance', '', '', '', (data.opening || 0).toFixed(2)].map(csvCell).join(','));
    data.rows.forEach(r => lines.push([
      formatDate(r.date), r.type, r.narration, r.remark,
      (r.debit || 0).toFixed(2), (r.credit || 0).toFixed(2), (r.balance || 0).toFixed(2),
    ].map(csvCell).join(',')));
    lines.push(['', '', 'Closing Balance', '', (data.totalDebit || 0).toFixed(2), (data.totalCredit || 0).toFixed(2), (data.closing || 0).toFixed(2)].map(csvCell).join(','));
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `ledger-${displayName}-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  // Generate and download a real .pdf (no print dialog) via jsPDF + autotable.
  const exportPDF = () => {
    if (!data || !data.rows.length) return toast({ title: 'Nothing to export', variant: 'error' });
    const money = (n) => (n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
    const s = data.summary || {};
    const range = (dateFrom || dateTo) ? `${dateFrom ? formatDate(dateFrom) : '…'} to ${dateTo ? formatDate(dateTo) : '…'}` : 'All dates';

    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const M = 40;

    doc.setFont('helvetica', 'bold'); doc.setFontSize(16);
    doc.text(displayName || 'Ledger', M, 46);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(110);
    doc.text(`${data.partyPhone ? data.partyPhone + '  ·  ' : ''}${range}  ·  ${s.count || 0} transaction(s)`, M, 62);
    doc.setTextColor(30);
    doc.text(
      `Total Debit: ${money(s.totalDebit)}     Total Credit: ${money(s.totalCredit)}     Balance: ${money(s.balance)}`,
      M, 80
    );

    const body = [
      [{ content: 'Opening Balance', colSpan: 2, styles: { fontStyle: 'bold' } }, '', '', { content: money(data.opening), styles: { halign: 'right', fontStyle: 'bold' } }],
      ...data.rows.map(r => {
        const particulars = `${r.credit > 0 ? 'Cr' : 'Dr'}  ${r.type}` +
          (r.narration ? `\n${r.narration}` : '') + (r.remark ? `\n${r.remark}` : '');
        return [
          formatDate(r.date),
          particulars,
          r.debit ? money(r.debit) : '',
          r.credit ? money(r.credit) : '',
          money(r.balance)
        ];
      })
    ];

    autoTable(doc, {
      startY: 96,
      margin: { left: M, right: M },
      head: [['Date', 'Particulars', 'Debit', 'Credit', 'Balance']],
      body,
      foot: [[
        { content: 'Closing Balance', colSpan: 2 },
        money(data.totalDebit), money(data.totalCredit), money(data.closing)
      ]],
      styles: { fontSize: 9, cellPadding: 5, valign: 'top' },
      headStyles: { fillColor: [243, 244, 246], textColor: 80, fontStyle: 'bold' },
      footStyles: { fillColor: [243, 244, 246], textColor: 20, fontStyle: 'bold' },
      columnStyles: { 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right' } }
    });

    doc.save(`ledger-${displayName || 'party'}-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  if (!data && loading) return <div className="py-16 text-center text-gray-400">Loading…</div>;
  if (!data) return <div className="py-16 text-center text-gray-400">No ledger entries for this party.</div>;

  const s = data.summary || {};

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/ledger')} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="font-heading font-bold text-gray-800 text-2xl">{displayName}</h1>
            <p className="text-gray-500 text-sm">{data.partyPhone ? `${data.partyPhone} · ` : ''}{s.count || 0} transaction{(s.count || 0) === 1 ? '' : 's'}</p>
          </div>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="px-4 py-2 border border-red-500 text-red-500 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors">
          Add Ledger
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 mb-5">
        {[['details', 'Ledger Information'], ['ledger', 'Ledger Transactions']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-4 py-2.5 text-sm font-medium -mb-px border-b-2 transition-colors ${
              tab === key ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* ── Ledger Information tab ── */}
      {tab === 'details' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatBlock icon={IndianRupee} label="Total Debit"  value={formatCurrency(s.totalDebit || 0)}  iconBg="bg-green-500" />
            <StatBlock icon={Wallet}      label="Total Credit" value={formatCurrency(s.totalCredit || 0)} iconBg="bg-purple-500" />
            <StatBlock icon={FileText}    label="Balance"      value={formatCurrency(s.balance || 0)}     iconBg="bg-blue-400" valueClass={s.balance < 0 ? 'text-red-600' : ''} />
            <StatBlock icon={CalendarClock} label="Last Transaction" value={s.lastDate ? formatDate(s.lastDate) : '—'} iconBg="bg-amber-400" />
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm font-semibold text-gray-700 mb-3">Ledger Information</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2.5 text-sm">
              {[
                ['Party Name', displayName],
                ['Phone', data.partyPhone || '—'],
                ['Total Transactions', s.count ?? 0],
                ['Total Debit', formatCurrency(s.totalDebit || 0)],
                ['Total Credit', formatCurrency(s.totalCredit || 0)],
                ['Balance (Credit − Debit)', formatCurrency(s.balance || 0)],
                ['First Transaction', s.firstDate ? formatDate(s.firstDate) : '—'],
                ['Last Transaction', s.lastDate ? formatDate(s.lastDate) : '—'],
              ].map(([k, v]) => (
                <div key={k} className="flex gap-3">
                  <span className="text-gray-400 w-44 flex-shrink-0">{k}</span>
                  <span className="text-gray-800 font-medium">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Ledger Transactions tab ── */}
      {tab === 'ledger' && (
        <div>
          {/* Filters + export */}
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <div className="flex items-center gap-1.5 border border-gray-200 rounded-lg px-3 py-2 bg-white">
              <span className="text-xs text-gray-400">From</span>
              <DateField value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="text-sm focus:outline-none text-gray-600" />
              <span className="text-xs text-gray-400">To</span>
              <DateField value={dateTo} onChange={e => setDateTo(e.target.value)} className="text-sm focus:outline-none text-gray-600" />
              {(dateFrom || dateTo) && (
                <button onClick={() => { setDateFrom(''); setDateTo(''); }} className="text-xs text-gray-400 hover:text-red-500">Clear</button>
              )}
            </div>
            <div className="flex-1" />
            <button onClick={exportCSV}
              className="flex items-center gap-1.5 px-3 py-2 border border-green-300 rounded-lg text-sm font-medium text-green-700 hover:bg-green-50 bg-white">
              <Download size={14} /> Export CSV
            </button>
            <button onClick={exportPDF}
              className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 bg-white">
              <Printer size={14} /> Download PDF
            </button>
          </div>

          {/* Ledger table */}
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  {['Date', 'Narration', 'Remark', 'Type', 'Debit', 'Credit', 'Balance'].map((h, i) => (
                    <th key={h} className={`py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap ${i >= 4 ? 'text-right' : 'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="text-center py-12 text-gray-400">Loading…</td></tr>
                ) : (
                  <>
                    <tr className="border-b border-gray-100 bg-blue-50/40">
                      <td className="py-2.5 px-4 text-gray-500 text-xs" colSpan={6}>Opening Balance</td>
                      <td className="py-2.5 px-4 text-right font-semibold text-gray-700">{formatCurrency(data.opening || 0)}</td>
                    </tr>
                    {data.rows.length === 0 ? (
                      <tr><td colSpan={7} className="text-center py-10 text-gray-400">No transactions in this range</td></tr>
                    ) : data.rows.map((r, i) => (
                      <tr key={r._id || i} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                        <td className="py-3 px-4 text-gray-600 text-xs whitespace-nowrap align-top">{formatDate(r.date)}</td>
                        <td className="py-3 px-4 text-gray-700 align-top">
                          <span className={`mr-1.5 text-xs font-bold ${r.credit > 0 ? 'text-purple-600' : 'text-green-600'}`}>{r.credit > 0 ? 'Cr' : 'Dr'}</span>
                          {r.narration || '-'}
                        </td>
                        <td className="py-3 px-4 text-gray-500 text-xs align-top">{r.remark || '-'}</td>
                        <td className="py-3 px-4 text-gray-600 align-top">{r.type}</td>
                        <td className="py-3 px-4 text-right text-green-700 align-top">{r.debit ? formatCurrency(r.debit) : ''}</td>
                        <td className="py-3 px-4 text-right text-purple-700 align-top">{r.credit ? formatCurrency(r.credit) : ''}</td>
                        <td className="py-3 px-4 text-right font-medium text-gray-800 align-top">{formatCurrency(r.balance || 0)}</td>
                      </tr>
                    ))}
                  </>
                )}
              </tbody>
              {!loading && (
                <tfoot>
                  <tr className="border-t-2 border-gray-300 bg-gray-50 font-semibold">
                    <td className="py-3 px-4" colSpan={4}>Closing Balance</td>
                    <td className="py-3 px-4 text-right text-green-700">{formatCurrency(data.totalDebit || 0)}</td>
                    <td className="py-3 px-4 text-right text-purple-700">{formatCurrency(data.totalCredit || 0)}</td>
                    <td className="py-3 px-4 text-right text-gray-900">{formatCurrency(data.closing || 0)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
          <p className="text-xs text-gray-400 mt-2">Balance = running total of Credit − Debit. Cr = credit entry, Dr = debit entry.</p>
        </div>
      )}

      {showAdd && (
        <LedgerModal
          presetParty={{ partyId: partyId || '', partyName: displayName, partyPhone: data.partyPhone || '' }}
          onClose={() => setShowAdd(false)}
          onSaved={() => { setShowAdd(false); load(); }}
        />
      )}
    </div>
  );
}
