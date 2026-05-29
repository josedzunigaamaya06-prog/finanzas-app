import { useLocation, NavLink } from 'react-router-dom';
import useThemeStore from '../../store/themeStore';
import NotificationBell from '../NotificationBell';

const pageTitles = {
  '/dashboard':       { title: 'Dashboard',      subtitle: 'Resumen financiero' },
  '/incomes':         { title: 'Ingresos',        subtitle: 'Gestiona tus ingresos' },
  '/expenses':        { title: 'Gastos',          subtitle: 'Control de gastos' },
  '/debts':           { title: 'Deudas',          subtitle: 'Gestión de deudas' },
  '/goals':           { title: 'Metas',           subtitle: 'Objetivos financieros' },
  '/budgets':         { title: 'Presupuestos',    subtitle: 'Planificación mensual' },
  '/recommendations': { title: 'Sugerencias',     subtitle: 'Insights inteligentes' },
  '/reports':         { title: 'Reportes',        subtitle: 'Análisis y estadísticas' },
  '/profile':         { title: 'Perfil',          subtitle: 'Tu cuenta' },
  '/calendar':        { title: 'Calendario',      subtitle: 'Recordatorios y pagos' },
  '/wallets':         { title: 'Billeteras',      subtitle: 'Tus cuentas y efectivo' },
};

export default function Header({ onMenuClick }) {
  const { pathname } = useLocation();
  const { isDark, toggle } = useThemeStore();
  const page = pageTitles[pathname] || { title: 'FinanzasPro', subtitle: '' };

  return (
    <header
      className="flex flex-col bg-white/90 dark:bg-dark-800/90 backdrop-blur-md border-b border-slate-100 dark:border-slate-700/50 sticky top-0 z-30 shadow-sm shadow-slate-100/50 dark:shadow-none pt-safe"
    >
    <div className="h-14 md:h-16 flex items-center justify-between px-3 sm:px-4 md:px-6">

      {/* Izquierda: hamburger (móvil) + título */}
      <div className="flex items-center gap-2.5 min-w-0">
        <button
          onClick={onMenuClick}
          className="md:hidden w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700/50 text-slate-600 dark:text-slate-300 transition-colors flex-shrink-0 active:scale-95"
          aria-label="Abrir menú"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <rect y="2"  width="18" height="2" rx="1" fill="currentColor"/>
            <rect y="8"  width="14" height="2" rx="1" fill="currentColor"/>
            <rect y="14" width="18" height="2" rx="1" fill="currentColor"/>
          </svg>
        </button>

        <div className="min-w-0">
          <h1 className="text-sm sm:text-base md:text-lg font-bold text-slate-900 dark:text-white truncate leading-tight">
            {page.title}
          </h1>
          {page.subtitle && (
            <p className="text-[11px] text-slate-400 dark:text-slate-500 hidden sm:block leading-tight">{page.subtitle}</p>
          )}
        </div>
      </div>

      {/* Derecha: acciones */}
      <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
        <NotificationBell />
        <NavLink
          to="/recommendations"
          className={({ isActive }) => `w-9 h-9 flex items-center justify-center rounded-xl transition-colors active:scale-95 ${
            isActive
              ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-600'
              : 'hover:bg-slate-100 dark:hover:bg-slate-700/50 text-slate-500 dark:text-slate-400'
          }`}
          title="Sugerencias"
        >
          💡
        </NavLink>
        <button
          onClick={toggle}
          className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700/50 text-slate-500 dark:text-slate-400 transition-colors active:scale-95"
          title={isDark ? 'Modo claro' : 'Modo oscuro'}
        >
          {isDark ? '☀️' : '🌙'}
        </button>
      </div>
    </div>
    </header>
  );
}
