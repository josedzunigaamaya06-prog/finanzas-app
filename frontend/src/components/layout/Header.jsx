import { useLocation, NavLink } from 'react-router-dom';
import useThemeStore from '../../store/themeStore';

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
};

export default function Header({ onMenuClick }) {
  const { pathname } = useLocation();
  const { isDark, toggle } = useThemeStore();
  const page = pageTitles[pathname] || { title: 'FinanzasPro', subtitle: '' };

  return (
    <header className="h-16 flex items-center justify-between px-4 md:px-6 bg-white/80 dark:bg-dark-800/80 backdrop-blur-sm border-b border-slate-100 dark:border-slate-700/50 sticky top-0 z-30">

      {/* Izquierda: hamburger (móvil) + título */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onMenuClick}
          className="md:hidden w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700/50 text-slate-600 dark:text-slate-300 transition-colors flex-shrink-0"
          aria-label="Abrir menú"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <rect y="2"  width="18" height="2" rx="1" fill="currentColor"/>
            <rect y="8"  width="18" height="2" rx="1" fill="currentColor"/>
            <rect y="14" width="18" height="2" rx="1" fill="currentColor"/>
          </svg>
        </button>

        <div className="min-w-0">
          <h1 className="text-base md:text-lg font-semibold text-slate-900 dark:text-white truncate leading-tight">
            {page.title}
          </h1>
          {page.subtitle && (
            <p className="text-xs text-slate-400 hidden sm:block">{page.subtitle}</p>
          )}
        </div>
      </div>

      {/* Derecha: acciones */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <NavLink
          to="/recommendations"
          className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700/50 text-slate-500 dark:text-slate-400 transition-colors"
          title="Sugerencias"
        >
          💡
        </NavLink>
        <button
          onClick={toggle}
          className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700/50 text-slate-500 dark:text-slate-400 transition-colors"
          title={isDark ? 'Modo claro' : 'Modo oscuro'}
        >
          {isDark ? '☀️' : '🌙'}
        </button>
      </div>
    </header>
  );
}
