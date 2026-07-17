import { useRef, useLayoutEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';

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

// Padding interno de la cápsula (px). La píldora se ajusta a él por arriba y abajo.
const PAD = 6;

// Curva con leve rebote al final: es lo que da la sensación "spring" de iOS.
const EASE = 'cubic-bezier(0.34, 1.4, 0.64, 1)';
const TRANSITION = `transform 450ms ${EASE}, width 450ms ${EASE}, opacity 250ms ease`;

export default function BottomNav() {
  const { pathname } = useLocation();
  const itemRefs = useRef([]);
  const pillRef = useRef(null);
  const positioned = useRef(false);

  const activeIndex = items.findIndex((i) => pathname.startsWith(i.to));

  // La píldora se posiciona midiendo el ítem activo y se anima por estilo directo.
  // Se hace de forma imperativa (no por estado de React) porque el estado no
  // garantiza el orden entre "colocar sin animar" y "habilitar la animación",
  // y la píldora terminaba saltando en vez de deslizarse.
  useLayoutEffect(() => {
    const pill = pillRef.current;
    if (!pill) return;

    const place = () => {
      const el = itemRefs.current[activeIndex];
      // Ruta fuera del nav (perfil, metas…): se oculta sin mover nada.
      if (!el) {
        pill.style.opacity = '0';
        return;
      }

      // La primera colocación va sin transición; si no, al abrir la app la
      // píldora entraría deslizándose desde el borde izquierdo.
      if (!positioned.current) pill.style.transition = 'none';

      pill.style.transform = `translate3d(${el.offsetLeft}px, 0, 0)`;
      pill.style.width = `${el.offsetWidth}px`;
      pill.style.opacity = '1';

      if (!positioned.current) {
        void pill.offsetWidth; // fuerza el reflow antes de habilitar la animación
        pill.style.transition = TRANSITION;
        positioned.current = true;
      }
    };

    place();
    window.addEventListener('resize', place);
    return () => window.removeEventListener('resize', place);
  }, [activeIndex]);

  return (
    // Cápsula flotante: no toca los bordes y se apoya sobre el área segura del iPhone.
    // El <nav> no captura toques para no bloquear el contenido a los lados de la píldora.
    <nav
      className="md:hidden fixed left-0 right-0 z-40 flex justify-center px-4 pointer-events-none"
      style={{ bottom: 'calc(0.625rem + env(safe-area-inset-bottom, 0px))' }}
    >
      <div
        className="pointer-events-auto relative flex items-center w-full max-w-md rounded-full"
        style={{
          padding: PAD,
          background: 'rgba(22, 24, 30, 0.78)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          border: '1px solid rgba(255,255,255,0.09)',
          boxShadow: '0 10px 40px rgba(0,0,0,0.45), 0 2px 10px rgba(0,0,0,0.3)',
        }}
      >
        {/* Píldora ÚNICA que se desliza hasta el ítem activo */}
        <span
          ref={pillRef}
          aria-hidden
          className="absolute rounded-full"
          style={{
            left: 0,
            top: PAD,
            bottom: PAD,
            width: 0,
            opacity: 0,
            background: 'rgba(255,255,255,0.10)',
            transition: TRANSITION,
          }}
        />

        {items.map(({ to, Icon, label }, i) => (
          <NavLink
            key={to}
            to={to}
            ref={(el) => (itemRefs.current[i] = el)}
            className="relative z-10 flex flex-col items-center justify-center gap-1 flex-1 min-w-0 py-2 rounded-full transition-transform duration-150 active:scale-90"
          >
            {({ isActive }) => (
              <>
                <span
                  className="flex items-center justify-center transition-all duration-300 ease-out"
                  style={{
                    color: isActive ? '#34d399' : '#d1d5db',
                    transform: isActive ? 'translateY(-1px)' : 'none',
                  }}
                >
                  <Icon />
                </span>
                <span
                  className="text-[9px] font-semibold tracking-wide truncate max-w-full px-0.5 transition-colors duration-300"
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
