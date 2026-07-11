import { useState, useEffect } from 'react';
import { ShoppingBag, Car, IndianRupee, Wallet, TrendingUp, CircleDollarSign } from 'lucide-react';
import { vehicleSaleApi } from '../../api/vehicleSaleApi';
import { useToast } from '../../components/ui/Toast';
import { formatCurrency } from '../../utils/format';

function StatCard({ icon: Icon, label, value, iconBg }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 px-5 py-4 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconBg}`}>
        <Icon size={22} className="text-white" />
      </div>
      <div>
        <div className="text-xs text-gray-500 mb-0.5">{label}</div>
        <div className="text-xl font-bold text-gray-800">{value}</div>
      </div>
    </div>
  );
}

export default function SaleReportsPage() {
  const { toast } = useToast();
  const [data, setData] = useState(null);

  useEffect(() => {
    vehicleSaleApi.summary()
      .then(({ data }) => setData(data))
      .catch(() => toast({ title: 'Failed to load report', variant: 'error' }));
  }, []);

  return (
    <div>
      <h1 className="font-heading font-bold text-gray-800 text-2xl mb-5">Sale Reports</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard icon={ShoppingBag}      label="Total Sales"      value={data?.totalSales ?? '—'}                    iconBg="bg-blue-400" />
        <StatCard icon={Car}              label="Vehicles Sold"    value={data?.totalVehicles ?? '—'}                 iconBg="bg-indigo-500" />
        <StatCard icon={TrendingUp}       label="Gross Amount"     value={formatCurrency(data?.grossAmount || 0)}     iconBg="bg-primary" />
        <StatCard icon={IndianRupee}      label="Net Payable"      value={formatCurrency(data?.netPayable || 0)}      iconBg="bg-green-500" />
        <StatCard icon={Wallet}           label="Advance Collected" value={formatCurrency(data?.advancePaid || 0)}   iconBg="bg-amber-400" />
        <StatCard icon={CircleDollarSign} label="Balance Due"      value={formatCurrency(data?.balanceAmount || 0)}   iconBg="bg-red-500" />
      </div>
    </div>
  );
}
