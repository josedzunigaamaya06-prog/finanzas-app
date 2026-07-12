import { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';

const navGroups = [
  {
    id: 'general',
    items: [
      { to: '/dashboard', icon: '▦', label: 'Inicio' },
    ],
  },
  {
    id: 'dinero',
    label: 'Dinero',
    items: [
      { to: '/wallets',  icon: '◈', label: 'Billeteras' },
      { to: '/incomes',  icon: '↑', label: 'Ingresos' },
      { to: '/expenses', icon: '↓', label: 'Gastos' },
      { to: '/debts',    icon: '◎', label: 'Deudas' },
    ],
  },
  {
    id: 'planificacion',
    label: 'Planificación',
    items: [
      { to: '/budgets',   icon: '▤', label: 'Presupuestos' },
      { to: '/goals',     icon: '◎', label: 'Metas' },
      { to: '/calendar',  icon: '▦', label: 'Calendario' },
    ],
  },
  {
    id: 'analisis',
    label: 'Análisis',
    items: [
      { to: '/recommendations', icon: '◆', label: 'Sugerencias' },
      { to: '/score',           icon: '◎', label: 'Mi salud' },
      { to: '/reports',         icon: '▤', label: 'Reportes' },
    ],
  },
];

const DEFAULT_OPEN = { general: true, dinero: true, planificacion: true, analisis: true };

export default function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose, isDesktop }) {
  const { user, logout } = useAuthStore();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [open, setOpen] = useState(DEFAULT_OPEN);

  const toggle = (id) => setOpen((p) => ({ ...p, [id]: !p[id] }));

  const handleLogout = () => {
    logout();
    toast.success('Sesión cerrada');
    navigate('/login');
    onMobileClose?.();
  };

  const handleNavClick = () => onMobileClose?.();
  const groupHasActive = (items) => items.some((i) => location.pathname.startsWith(i.to));

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : 'U';

  return (
    <aside
      className={`fixed left-0 top-0 z-50 flex flex-col transition-all duration-300 ease-in-out overflow-hidden
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      style={{
        width: isDesktop ? (collapsed ? '4.5rem' : '15.5rem') : '17rem',
        height: '100dvh',
        background: '#111318',
        borderRight: '1px solid #1e2133',
      }}
    >
      {/* ── Logo ─────────────────────────────────────────────────────────── */}
      <div
        className={`flex items-center flex-shrink-0 pt-safe ${collapsed ? 'md:justify-center px-4' : 'px-5 gap-3'}`}
        style={{ height: '3.75rem', borderBottom: '1px solid #1e2133' }}
      >
        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', boxShadow: '0 2px 8px rgba(16,185,129,0.35)' }}>
          F
        </div>
        {!collapsed && (
          <>
            <span className="font-bold text-white text-[15px] tracking-tight">FinanzasPro</span>
            <button
              onClick={onMobileClose}
              className="md:hidden ml-auto w-7 h-7 flex items-center justify-center rounded-lg text-sidebar-muted hover:text-white transition-colors"
              style={{ background: 'rgba(139,147,167,0.1)' }}
            >
              ✕
            </button>
          </>
        )}
      </div>

      {/* ── Nav ──────────────────────────────────────────────────────────── */}
      <nav className="flex-1 min-h-0 overflow-y-auto py-3 px-3 space-y-0.5">
        {navGroups.map((group) => {
          const isOpen    = open[group.id] ?? true;
          const hasActive = groupHasActive(group.items);

          if (!group.label) {
            return (
              <div key={group.id} className="mb-2">
                {group.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={handleNavClick}
                    title={collapsed ? item.label : ''}
                    className={({ isActive }) =>
                      `nav-item ${isActive ? 'active' : ''} ${collapsed ? 'md:justify-center' : ''}`
                    }
                  >
                    <span className="text-[15px] flex-shrink-0 leading-none">{item.icon}</span>
                    {!collapsed && <span>{item.label}</span>}
                  </NavLink>
                ))}
              </div>
            );
          }

          return (
            <div key={group.id} className="mb-2">
              {!collapsed && (
                <button
                  onClick={() => toggle(group.id)}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.08em] transition-colors"
                  style={{ color: hasActive && !isOpen ? '#34d399' : '#4b5168' }}
                >
                  <span className="flex-1 text-left">{group.label}</span>
                  <span
                    className="transition-transform duration-200 text-[8px]"
                    style={{ transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)' }}
                  >▾</span>
                </button>
              )}
              {collapsed && <div className="mx-3 my-2" style={{ height: '1px', background: '#1e2133' }} />}

              <div
                className="overflow-hidden transition-all duration-250 ease-in-out"
                style={{ maxHeight: (collapsed || isOpen) ? '500px' : '0px', opacity: (collapsed || isOpen) ? 1 : 0 }}
              >
                <div className={collapsed ? '' : 'ml-0 space-y-0.5'}>
                  {group.items.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={handleNavClick}
                      title={collapsed ? item.label : ''}
                      className={({ isActive }) =>
                        `nav-item ${isActive ? 'active' : ''} ${collapsed ? 'md:justify-center' : ''}`
                      }
                    >
                      <span className="text-[15px] flex-shrink-0 leading-none">{item.icon}</span>
                      {!collapsed && <span>{item.label}</span>}
                    </NavLink>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </nav>

      {/* ── Usuario ───────────────────────────────────────────────────────── */}
      <div
        className="flex-shrink-0 px-3 py-3 space-y-1"
        style={{
          borderTop: '1px solid #1e2133',
          paddingBottom: 'calc(max(0.75rem, env(safe-area-inset-bottom)) + 4rem)',
        }}
      >
        <NavLink
          to="/profile"
          onClick={handleNavClick}
          className={({ isActive }) =>
            `nav-item ${isActive ? 'active' : ''} ${collapsed ? 'md:justify-center' : ''}`
          }
        >
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
          >
            {initials}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-white truncate leading-tight">{user?.name}</p>
              <p className="text-[11px] truncate leading-tight" style={{ color: '#4b5168' }}>{user?.email}</p>
            </div>
          )}
        </NavLink>

        <button
          onClick={handleLogout}
          className={`nav-item w-full ${collapsed ? 'md:justify-center' : ''}`}
          style={{ color: '#4b5168' }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#4b5168'; e.currentTarget.style.background = ''; }}
        >
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" className="flex-shrink-0">
            <path d="M3 1h6a1 1 0 011 1v2h-1V2H3v11h6v-2h1v2a1 1 0 01-1 1H3a1 1 0 01-1-1V2a1 1 0 011-1z" fill="currentColor"/>
            <path d="M11.5 5l2.5 2.5-2.5 2.5-.7-.7L12.6 8H6V7h6.6l-1.8-1.8.7-.7z" fill="currentColor"/>
          </svg>
          {!collapsed && <span>Cerrar sesión</span>}
        </button>

        <button
          onClick={onToggle}
          className={`hidden md:flex nav-item w-full ${collapsed ? 'md:justify-center' : ''}`}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" className="flex-shrink-0"
            style={{ transform: collapsed ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }}>
            <path d="M9 1L3 7l6 6" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {!collapsed && <span className="text-[12px]">Colapsar</span>}
        </button>
      </div>
    </aside>
  );
}
