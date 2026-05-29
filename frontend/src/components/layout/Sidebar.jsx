import { NavLink, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';

const navGroups = [
  {
    items: [
      { to: '/dashboard', icon: '⊞', label: 'Dashboard' },
    ],
  },
  {
    label: 'Dinero',
    items: [
      { to: '/wallets',  icon: '👛', label: 'Billeteras' },
      { to: '/incomes',  icon: '↑',  label: 'Ingresos' },
      { to: '/expenses', icon: '↓',  label: 'Gastos' },
      { to: '/debts',    icon: '🏦', label: 'Deudas' },
    ],
  },
  {
    label: 'Planificación',
    items: [
      { to: '/budgets',  icon: '📊', label: 'Presupuestos' },
      { to: '/goals',    icon: '🎯', label: 'Metas' },
      { to: '/challenge',icon: '💪', label: 'Retos' },
      { to: '/calendar', icon: '📅', label: 'Calendario' },
    ],
  },
  {
    label: 'Inteligencia',
    items: [
      { to: '/recommendations', icon: '💡', label: 'Sugerencias' },
      { to: '/auto-rules',      icon: '⚡', label: 'Reglas auto' },
      { to: '/insights',        icon: '🔍', label: 'Análisis' },
      { to: '/prediction',      icon: '📈', label: 'Predicción' },
    ],
  },
  {
    label: 'Reportes',
    items: [
      { to: '/reports',    icon: '📋', label: 'Reportes' },
      { to: '/comparison', icon: '↔️', label: 'Comparativa' },
      { to: '/score',      icon: '🏆', label: 'Mi salud' },
      { to: '/wrapped',    icon: '🎵', label: 'Wrapped' },
    ],
  },
];

export default function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose, isDesktop }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Sesión cerrada');
    navigate('/login');
    onMobileClose?.();
  };

  const handleNavClick = () => {
    onMobileClose?.();
  };

  return (
    <aside
      className={`
        fixed left-0 top-0 h-full z-40 flex flex-col
        bg-dark-900 border-r border-slate-700/50
        transition-all duration-300 ease-in-out
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}
      style={{ width: isDesktop ? (collapsed ? '4rem' : '16rem') : '18rem' }}
    >
      {/* Logo */}
      <div className={`flex items-center h-16 px-4 border-b border-slate-700/50 flex-shrink-0 ${collapsed ? 'md:justify-center' : 'gap-3'}`}>
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
          F
        </div>
        <span className={`font-bold text-white text-lg ${collapsed ? 'md:hidden' : ''}`}>
          FinanzasPro
        </span>
        <button
          onClick={onMobileClose}
          className="md:hidden ml-auto w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Navegación */}
      <nav className="flex-1 py-3 px-2 overflow-y-auto space-y-4">
        {navGroups.map((group, gi) => (
          <div key={gi}>
            {/* Etiqueta de sección */}
            {group.label && !collapsed && (
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest px-3 mb-1">
                {group.label}
              </p>
            )}
            {group.label && collapsed && (
              <div className="mx-3 h-px bg-slate-700/50 mb-1" />
            )}

            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={handleNavClick}
                  title={collapsed ? item.label : ''}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200
                    ${isActive
                      ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                    }
                    ${collapsed ? 'md:justify-center' : ''}`
                  }
                >
                  <span className="text-base flex-shrink-0">{item.icon}</span>
                  <span className={collapsed ? 'md:hidden' : ''}>{item.label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Usuario */}
      <div className="p-3 border-t border-slate-700/50 space-y-1 flex-shrink-0">
        <NavLink
          to="/profile"
          onClick={handleNavClick}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors
            ${isActive ? 'bg-primary-500/20 text-primary-400' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'}
            ${collapsed ? 'md:justify-center' : ''}`
          }
        >
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className={`min-w-0 ${collapsed ? 'md:hidden' : ''}`}>
            <p className="text-white text-xs font-medium truncate">{user?.name}</p>
            <p className="text-slate-500 text-xs truncate">{user?.email}</p>
          </div>
        </NavLink>

        <button
          onClick={handleLogout}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors ${collapsed ? 'md:justify-center' : ''}`}
        >
          <span className="text-base flex-shrink-0">⏏</span>
          <span className={collapsed ? 'md:hidden' : ''}>Cerrar sesión</span>
        </button>

        <button
          onClick={onToggle}
          className={`hidden md:flex w-full items-center gap-3 px-3 py-2 rounded-xl text-xs text-slate-500 hover:text-slate-300 hover:bg-slate-700/30 transition-colors ${collapsed ? 'justify-center' : ''}`}
        >
          <span className="text-base">{collapsed ? '→' : '←'}</span>
          {!collapsed && <span>Colapsar</span>}
        </button>
      </div>
    </aside>
  );
}
