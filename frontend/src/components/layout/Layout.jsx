import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import BottomNav from './BottomNav';

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-900">

      {/* Overlay móvil */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* Contenido principal */}
      <div className={`transition-all duration-300 ease-in-out md:${collapsed ? 'ml-16' : 'ml-64'}`}>
        <Header onMenuClick={() => setMobileOpen(true)} />
        <main className="p-4 md:p-6 min-h-[calc(100vh-4rem)] pb-24 md:pb-6">
          <Outlet />
        </main>
      </div>

      {/* Navegación inferior (solo móvil) */}
      <BottomNav />
    </div>
  );
}
