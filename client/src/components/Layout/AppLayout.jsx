import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { cn } from '../../utils/cn';
import useAuthStore from '../../store/authStore';
import { applyBranding, resetBranding } from '../../utils/branding';
import { useAutoTooltips } from '../../hooks/useAutoTooltips';
import TooltipLayer from '../ui/TooltipLayer';

export function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const branding = useAuthStore(s => s.garage?.branding);

  // App-wide native tooltips on every button / link / icon control
  useAutoTooltips();

  // Apply garage branding to CSS variables — instant theme on load/change
  useEffect(() => {
    if (branding) applyBranding(branding);
    else resetBranding();
  }, [branding?.primaryColor, branding?.menuColor, branding?.headerColor]);

  return (
    <div className="min-h-screen bg-page flex">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(v => !v)} />
      <div className={cn('flex-1 min-w-0 flex flex-col transition-all duration-300', sidebarCollapsed ? 'ml-16' : 'ml-[230px]')}>
        <Topbar onToggleSidebar={() => setSidebarCollapsed(v => !v)} />
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
      <TooltipLayer />
    </div>
  );
}
