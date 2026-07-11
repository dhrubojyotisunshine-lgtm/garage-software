import { useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Building2, LogOut, Shield } from 'lucide-react';
import useSuperAdminStore from '../../store/superAdminStore';
import { useAutoTooltips } from '../../hooks/useAutoTooltips';
import TooltipLayer from '../../components/ui/TooltipLayer';

const NAV = [
  { to: '/superadmin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/superadmin/garages',   icon: Building2,        label: 'Franchises' },
];

export default function SuperAdminLayout() {
  const { admin, token, fetchMe, logout } = useSuperAdminStore();
  const navigate = useNavigate();
  useAutoTooltips();

  useEffect(() => {
    if (!token) { navigate('/superadmin/login'); return; }
    if (!admin) fetchMe();
  }, []);

  const handleLogout = () => { logout(); navigate('/superadmin/login'); };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-56 bg-gray-900 text-white flex flex-col flex-shrink-0">
        <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-700">
          <div className="w-9 h-9 bg-red-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <Shield size={18} className="text-white" />
          </div>
          <div>
            <div className="text-sm font-bold leading-tight">TTN Garage</div>
            <div className="text-[10px] text-gray-400">Super Admin</div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive ? 'bg-red-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`
              }
            >
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-gray-700">
          <div className="px-3 py-2 mb-2">
            <div className="text-xs font-medium text-white truncate">{admin?.name || 'Admin'}</div>
            <div className="text-[10px] text-gray-400 truncate">{admin?.email}</div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm text-gray-400 hover:bg-gray-800 hover:text-red-400 transition-colors"
          >
            <LogOut size={17} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          <Outlet />
        </div>
      </main>
      <TooltipLayer />
    </div>
  );
}
