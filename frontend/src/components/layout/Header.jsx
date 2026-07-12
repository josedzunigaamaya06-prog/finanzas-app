import { useLocation, NavLink } from 'react-router-dom';
import useThemeStore from '../../store/themeStore';
import NotificationBell from '../NotificationBell';

const pageTitles = {
  '/dashboard':       { title: 'Dashboard',      subtitle: 'Resumen de tu situación financiera' },
  '/incomes':         { title: 'Ingresos',        subtitle: 'Gestiona tus fuentes de ingreso' },
  '/expenses':        { title: 'Gastos',          subtitle: 'Controla tus gastos' },
  '/debts':           { title: 'Deudas',          subtitle: 'Estrategia de pago de deudas' },
  '/goals':           { title: 'Metas',           subtitle: 'Objetivos financieros' },
  '/budgets':         { title: 'Presupuestos',    subtitle: 'Límites de gasto por categoría' },
  '/recommendations': { title: 'Sugerencias',     subtitle: 'Recomendaciones inteligentes' },
  '/reports':         { title: 'Reportes',        subtitle: 'Análisis y estadísticas' },
  '/profile':         { title: 'Perfil',          subtitle: 'Configuración de tu cuenta' },
  '/calendar':        { title: 'Calendario',      subtitle: 'Recordatorios y pagos programados' },
  '/wallets':         { title: 'Billeteras',      subtitle: 'Tus cuentas y saldos' },
  '/auto-rules':      { title: 'Reglas automáticas', subtitle: 'Categorización inteligente' },
  '/insights':        { title: 'Análisis',        subtitle: 'Patrones y hábitos financieros' },
  '/prediction':      { title: 'Predicción',      subtitle: 'Proyección de tus finanzas' },
  '/score':           { title: 'Mi salud financiera', subtitle: 'Score y diagnóstico' },
  '/comparison':      { title: 'Comparativa',     subtitle: 'Mes vs mes y año vs año' },
  '/challenge':       { title: 'Retos',           subtitle: 'Desafíos de ahorro mensual' },
  '/wrapped':         { title: 'Wrapped',         subtitle: 'Tu resumen anual financiero' },
};

export default function Header({ onMenuClick }) {
  const { pathname } = useLocation();
  const { isDark, toggle } = useThemeStore();
  const page = pageTitles[pathname] || { title: 'FinanzasPro', subtitle: '' };

  return (
    <header className="flex flex-col sticky top-0 z-30 pt-safe"
      style={{ background: 'white', borderBottom: '1px solid #e5e7eb' }}>
      <div className="h-14 md:h-[3.75rem] flex items-center justify-between px-4 md:px-6">

        {/* Izquierda */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onMenuClick}
            className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg transition-colors flex-shrink-0 active:scale-95"
            style={{ color: '#6b7280' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#f3f4f6'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = ''; }}
            aria-label="Abrir menú"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect y="1.5" width="16" height="1.5" rx="0.75" fill="currentColor"/>
              <rect y="7.25" width="11" height="1.5" rx="0.75" fill="currentColor"/>
              <rect y="13" width="16" height="1.5" rx="0.75" fill="currentColor"/>
            </svg>
          </button>

          <div className="min-w-0">
            <h1 className="text-[15px] md:text-base font-bold text-slate-900 truncate leading-tight tracking-tight">
              {page.title}
            </h1>
            {page.subtitle && (
              <p className="text-[11px] text-slate-400 hidden sm:block leading-tight mt-0.5">{page.subtitle}</p>
            )}
          </div>
        </div>

        {/* Derecha */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <NotificationBell />

          <NavLink
            to="/recommendations"
            className={({ isActive }) =>
              `w-8 h-8 flex items-center justify-center rounded-lg transition-colors active:scale-95 text-[15px] ${
                isActive ? 'bg-amber-50 text-amber-500' : 'text-slate-400 hover:bg-surface-100 hover:text-slate-600'
              }`
            }
            title="Sugerencias"
          >
            💡
          </NavLink>

          <button
            onClick={toggle}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-surface-100 hover:text-slate-600 transition-colors active:scale-95 text-[15px]"
            title={isDark ? 'Modo claro' : 'Modo oscuro'}
          >
            {isDark ? '☀️' : '🌙'}
          </button>
        </div>
      </div>
    </header>
  );
}
