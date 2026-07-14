import { useState, useEffect, useMemo } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, FileText, FileSpreadsheet, ShoppingCart,
  Package, BarChart2, BookOpen, Calendar, CreditCard,
  Database, Settings, ChevronDown, ChevronRight, Wrench, Users, UserCircle, BellRing, Car, ScrollText
} from 'lucide-react';
import { cn } from '../../utils/cn';
import useAuthStore from '../../store/authStore';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

const ALL_NAV = [
  { key: 'dashboard',    label: 'Dashboard',    icon: LayoutDashboard, path: '/dashboard' },
  { key: 'jobcards',     label: 'Jobcards',     icon: FileText,        path: '/jobcards' },
  { key: 'reminders',   label: 'Reminders',    icon: BellRing,        path: '/reminders' },
  { key: 'customers',   label: 'Customers',    icon: UserCircle,      path: '/customers' },
  { key: 'estimate',    label: 'Estimate',     icon: FileSpreadsheet, path: '/estimate' },
  { key: 'counter-sale',label: 'Counter-Sale', icon: ShoppingCart,    path: '/counter-sale' },
  {
    key: 'inventory', label: 'Inventory', icon: Package, path: '/inventory',
    children: [
      { label: 'Stock',          path: '/inventory' },
      { label: 'Supplier',       path: '/inventory/supplier' },
      { label: 'Purchase Order', path: '/inventory/purchase-order' },
      { label: 'History',        path: '/inventory/history' }
    ]
  },
  {
    key: 'sale', label: 'Vehicle Sale', icon: Car, path: '/sale/vehicle-sales',
    children: [
      { label: 'Vehicle Sales',    path: '/sale/vehicle-sales' },
      { label: 'Sale Reports',     path: '/sale/reports' },
      { label: 'Stock Management', path: '/vehicle-stock' }
    ]
  },
  { key: 'ledger',      label: 'Ledger',      icon: ScrollText, path: '/ledger' },
  { key: 'reports',     label: 'Reports',     icon: BarChart2,  path: '/reports' },
  { key: 'cashbook',    label: 'Cashbook',    icon: BookOpen,   path: '/cashbook' },
  { key: 'appointment', label: 'Appointment', icon: Calendar,   path: '/appointment' },
  // { key: 'expenses',    label: 'Expenses',    icon: CreditCard, path: '/expenses' }, // hidden per request
  { key: 'masters',     label: 'Masters',     icon: Database,   path: '/masters' },
  { key: 'staff',       label: 'Staff',       icon: Users,      path: '/staff' },
  { key: 'settings',    label: 'Settings',    icon: Settings,   path: '/settings' },
];

export function Sidebar({ collapsed, onToggle }) {
  const location     = useLocation();
  const { garage, isStaff, staffUser } = useAuthStore();
  const [expandedItems, setExpandedItems] = useState({});

  const navItems = useMemo(() => {
    // Staff: filter by role's menuAccess
    if (isStaff && staffUser?.roleId?.menuAccess?.length) {
      const allowed = staffUser.roleId.menuAccess;
      return ALL_NAV.filter(n => allowed.includes(n.key));
    }
    // Garage owner: apply menuConfig ordering/visibility
    const cfg = garage?.menuConfig;
    if (!cfg || cfg.length === 0) return ALL_NAV;
    const sorted = [...cfg].sort((a, b) => a.order - b.order);
    const configured = sorted
      .filter(c => c.enabled)
      .map(c => ALL_NAV.find(n => n.key === c.key))
      .filter(Boolean);
    // Append any nav items not present in the saved menuConfig (e.g. newly added
    // modules) so they remain visible without altering existing order/visibility.
    const coveredKeys = new Set(cfg.map(c => c.key));
    const extras = ALL_NAV.filter(n => !coveredKeys.has(n.key));
    return [...configured, ...extras];
  }, [garage?.menuConfig, isStaff, staffUser]);

  // Brand logo (super-admin branding logo, else workshop logo)
  const rawLogo = garage?.branding?.logoUrl || garage?.logoUrl;
  const logoUrl = rawLogo || null;

  useEffect(() => {
    ALL_NAV.forEach(item => {
      if (item.children && item.children.some(c => location.pathname.startsWith(c.path) || location.pathname === item.path)) {
        setExpandedItems(prev => ({ ...prev, [item.label]: true }));
      }
    });
  }, [location.pathname]);

  const toggleExpand = (label) => {
    setExpandedItems(prev => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <aside
      className={cn(
        'fixed top-0 left-0 h-full bg-sidebar-bg flex flex-col transition-all duration-300 z-30',
        collapsed ? 'w-16' : 'w-[230px]'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt="logo"
            className="w-8 h-8 rounded-lg object-contain flex-shrink-0 bg-white/10"
          />
        ) : (
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
            <Wrench size={16} className="text-white" />
          </div>
        )}
        {!collapsed && (
          <div>
            <div className="font-heading font-bold text-white text-sm leading-tight">
              {garage?.workshopName || 'Sunshine Garage'}
            </div>
            <div className="text-[10px] text-sidebar-text/60">Management System</div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        {navItems.map((item) => {
          if (!item) return null;
          if (item.children) {
            const isExpanded = expandedItems[item.label];
            return (
              <div key={item.label}>
                <button
                  onClick={() => toggleExpand(item.label)}
                  className="sidebar-item w-full justify-between"
                >
                  <div className="flex items-center gap-3">
                    <item.icon size={18} className="flex-shrink-0" />
                    {!collapsed && <span>{item.label}</span>}
                  </div>
                  {!collapsed && (
                    isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
                  )}
                </button>
                {isExpanded && !collapsed && (
                  <div className="ml-7 mt-1 space-y-0.5">
                    {item.children.map(child => (
                      <NavLink
                        key={child.path}
                        to={child.path}
                        className={({ isActive }) => cn(
                          'flex items-center px-3 py-2 rounded-lg text-xs text-sidebar-text/80 hover:text-white hover:bg-sidebar-hover transition-colors',
                          isActive && 'text-white bg-sidebar-active'
                        )}
                      >
                        {child.label}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => cn('sidebar-item', isActive && 'active')}
              title={collapsed ? item.label : undefined}
            >
              <item.icon size={18} className="flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {!collapsed && (
        <div className="px-4 py-3 border-t border-white/10">
          {isStaff && staffUser ? (
            <div>
              <p className="text-xs text-white/70 font-medium truncate">{staffUser.name}</p>
              <p className="text-[10px] text-sidebar-text/40">{staffUser.role} · {garage?.workshopName}</p>
            </div>
          ) : (
            <p className="text-[10px] text-sidebar-text/40">v1.0.0 · Sunshine Garage</p>
          )}
        </div>
      )}
    </aside>
  );
}
