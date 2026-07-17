import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import BottomNav from './BottomNav';
import OnboardingModal from '../OnboardingModal';
import PWAUpdatePrompt from '../PWAUpdatePrompt';

export default function Layout() {
  const [collapsed, setCollapsed]   = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isDesktop, setIsDesktop]   = useState(() => window.innerWidth >= 768);

  // Detectar si es desktop para aplicar el margen correctamente
  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Margen del contenido según estado del sidebar (solo en desktop)
  const contentMargin = isDesktop ? (collapsed ? '4rem' : '16rem') : '0px';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-900">

      {/* Overlay móvil */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        isDesktop={isDesktop}
      />

      {/* Contenido principal — margen inline para garantizar que funcione en producción */}
      <div
        className="transition-all duration-300 ease-in-out"
        style={{ marginLeft: contentMargin }}
      >
        <Header onMenuClick={() => setMobileOpen(true)} />
        {/* pb: deja aire bajo el contenido para la píldora flotante del nav móvil */}
        <main className="p-3 sm:p-4 md:p-6 min-h-[calc(100vh-4rem)]" style={{ paddingBottom: 'calc(6rem + env(safe-area-inset-bottom, 0px))' }}>
          <Outlet />
        </main>
      </div>

      {/* Navegación inferior (solo móvil) */}
      <BottomNav />

      {/* Guía de inicio para nuevos usuarios */}
      <OnboardingModal />

      {/* Notificación de actualización PWA */}
      <PWAUpdatePrompt />
    </div>
  );
}
