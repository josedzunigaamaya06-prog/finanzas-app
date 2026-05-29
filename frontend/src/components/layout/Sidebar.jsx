import { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';

const navGroups = [
  {
    id: 'general',
    items: [
      { to: '/dashboard', icon: '⊞', label: 'Dashboard' },
    ],
  },
  {
    id: 'dinero',
    label: 'Dinero',
    icon: '💳',
    items: [
      { to: '/wallets',  icon: '👛', label: 'Billeteras' },
      { to: '/incomes',  icon: '↑',  label: 'Ingresos' },
      { to: '/expenses', icon: '↓',  label: 'Gastos' },
      { to: '/debts',    icon: '🏦', label: 'Deudas' },
    ],
  },
  {
    id: 'planificacion',
    label: 'Planificación',
    icon: '📅',
    items: [
      { to: '/budgets',   icon: '📊', label: 'Presupuestos' },
      { to: '/goals',     icon: '🎯', label: 'Metas' },
      { to: '/challenge', icon: '💪', label: 'Retos' },
      { to: '/calendar',  icon: '📅', label: 'Calendario' },
    ],
  },
  {
    id: 'inteligencia',
    label: 'Inteligencia',
    icon: '🤖',
    items: [
      { to: '/recommendations', icon: '💡', label: 'Sugerencias' },
      { to: '/auto-rules',      icon: '⚡', label: 'Reglas auto' },
      { to: '/insights',        icon: '🔍', label: 'Análisis' },
      { to: '/prediction',      icon: '📈', label: 'Predicción' },
    ],
  },
  {
    id: 'reportes',
    label: 'Reportes',
    icon: '📋',
    items: [
      { to: '/reports',    icon: '📋', label: 'Reportes' },
      { to: '/comparison', icon: '↔️', label: 'Comparativa' },
      { to: '/score',      icon: '🏆', label: 'Mi salud' },
      { to: '/wrapped',    icon: '🎵', label: 'Wrapped' },
    ],
  },
];

// Qué grupos empiezan abiertos
const DEFAULT_OPEN = { general: true, dinero: true, planificacion: true, inteligencia: false, reportes: false };

export default function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose, isDesktop }) {
  const { user, logout } = useAuthStore();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [open, setOpen] = useState(DEFAULT_OPEN);

  const toggle = (id) => setOpen((prev) => ({ ...prev, [id]: !prev[id] }));

  const handleLogout = () => {
    logout();
    toast.success('Sesión cerrada');
    navigate('/login');
    onMobileClose?.();
  };

  const handleNavClick = () => onMobileClose?.();

  // ¿Algún ítem del grupo está activo?
  const groupHasActive = (items) => items.some((i) => location.pathname.startsWith(i.to));

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
      <nav className="flex-1 py-3 px-2 overflow-y-auto space-y-0.5">
        {navGroups.map((group) => {
          const isOpen    = open[group.id] ?? true;
          const hasActive = groupHasActive(group.items);

          /* Grupo sin encabezado (Dashboard) */
          if (!group.label) {
            return (
              <div key={group.id} className="mb-1">
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
            );
          }

          /* Grupos con encabezado desplegable */
          return (
            <div key={group.id} className="mb-1">
              {/* Encabezado del grupo */}
              {collapsed ? (
                /* Modo colapsado: solo línea separadora */
                <div className="mx-3 h-px bg-slate-700/50 my-2" />
              ) : (
                <button
                  onClick={() => toggle(group.id)}
                  className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-widest transition-colors ${
                    hasActive && !isOpen
                      ? 'text-primary-400'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <span className="text-sm">{group.icon}</span>
                  <span className="flex-1 text-left">{group.label}</span>
                  <span
                    className="text-slate-600 transition-transform duration-200"
                    style={{ transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)' }}
                  >
                    ▾
                  </span>
                </button>
              )}

              {/* Ítems del grupo */}
              <div
                className="overflow-hidden transition-all duration-300 ease-in-out"
                style={{ maxHeight: (collapsed || isOpen) ? '400px' : '0px', opacity: (collapsed || isOpen) ? 1 : 0 }}
              >
                <div className={`space-y-0.5 ${collapsed ? '' : 'ml-1'}`}>
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
            </div>
          );
        })}
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
