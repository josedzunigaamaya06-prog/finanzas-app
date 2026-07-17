import { NavLink } from 'react-router-dom';

// Íconos de línea consistentes (usan currentColor para heredar el estado activo)
const IconHome = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
    <rect x="2.5" y="2.5" width="6.5" height="6.5" rx="2" />
    <rect x="11" y="2.5" width="6.5" height="6.5" rx="2" />
    <rect x="2.5" y="11" width="6.5" height="6.5" rx="2" />
    <rect x="11" y="11" width="6.5" height="6.5" rx="2" />
  </svg>
);

const IconIncome = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 16.5V4M10 4L5.5 8.5M10 4l4.5 4.5" />
  </svg>
);

const IconCalendar = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2.75" y="4.5" width="14.5" height="13" rx="3" />
    <path d="M2.75 8.5h14.5M6.75 2.5v4M13.25 2.5v4" />
  </svg>
);

const IconExpense = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 3.5V16M10 16l-4.5-4.5M10 16l4.5-4.5" />
  </svg>
);

const IconBank = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2.5 7.75L10 3.25l7.5 4.5M4.75 8.5v7M15.25 8.5v7M8.25 8.5v7M11.75 8.5v7M2.25 16.5h15.5" />
  </svg>
);

const items = [
  { to: '/dashboard', Icon: IconHome,     label: 'Inicio' },
  { to: '/incomes',   Icon: IconIncome,   label: 'Ingresos' },
  { to: '/calendar',  Icon: IconCalendar, label: 'Pagos' },
  { to: '/expenses',  Icon: IconExpense,  label: 'Gastos' },
  { to: '/debts',     Icon: IconBank,     label: 'Deudas' },
];

export default function BottomNav() {
  return (
    // Cápsula flotante: no toca los bordes y se apoya sobre el área segura del iPhone.
    // El <nav> no captura toques (pointer-events-none) para no bloquear el contenido
    // que queda a los lados de la píldora; solo la píldora es interactiva.
    <nav
      className="md:hidden fixed left-0 right-0 z-40 flex justify-center px-4 pointer-events-none"
      style={{ bottom: 'calc(0.625rem + env(safe-area-inset-bottom, 0px))' }}
    >
      <div
        className="pointer-events-auto flex items-center w-full max-w-md p-1.5 rounded-full"
        style={{
          background: 'rgba(22, 24, 30, 0.78)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          border: '1px solid rgba(255,255,255,0.09)',
          boxShadow: '0 10px 40px rgba(0,0,0,0.45), 0 2px 10px rgba(0,0,0,0.3)',
        }}
      >
        {items.map(({ to, Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className="relative flex flex-col items-center justify-center gap-1 flex-1 min-w-0 py-2 rounded-full transition-transform duration-150 active:scale-90"
          >
            {({ isActive }) => (
              <>
                {/* Píldora del ítem activo: crece y aparece con transición */}
                <span
                  aria-hidden
                  className="absolute inset-0 rounded-full transition-all duration-300 ease-out"
                  style={{
                    background: 'rgba(255,255,255,0.10)',
                    opacity: isActive ? 1 : 0,
                    transform: isActive ? 'scale(1)' : 'scale(0.75)',
                  }}
                />
                <span
                  className="relative flex items-center justify-center transition-all duration-300 ease-out"
                  style={{
                    color: isActive ? '#34d399' : '#d1d5db',
                    transform: isActive ? 'translateY(-1px)' : 'none',
                  }}
                >
                  <Icon />
                </span>
                <span
                  className="relative text-[9px] font-semibold tracking-wide truncate max-w-full px-0.5 transition-colors duration-300"
                  style={{ color: isActive ? '#34d399' : '#9ca3af' }}
                >
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
