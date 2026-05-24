import { NavLink } from 'react-router-dom';

const items = [
  { to: '/dashboard', icon: '⊞', label: 'Inicio' },
  { to: '/incomes',   icon: '↑',  label: 'Ingresos' },
  { to: '/calendar',  icon: '📅', label: 'Pagos' },
  { to: '/expenses',  icon: '↓',  label: 'Gastos' },
  { to: '/debts',     icon: '🏦', label: 'Deudas' },
];

export default function BottomNav() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-dark-900/95 backdrop-blur-md border-t border-slate-700/50 flex items-stretch justify-around px-2 h-[60px] safe-bottom">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center gap-1 flex-1 py-2 mx-0.5 rounded-xl transition-all duration-200 ${
              isActive
                ? 'text-primary-400 bg-primary-500/10'
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <span className={`text-lg leading-none transition-transform duration-200 ${isActive ? 'scale-110' : ''}`}>
                {item.icon}
              </span>
              <span className={`text-[9px] font-semibold tracking-wide transition-colors ${isActive ? 'text-primary-400' : 'text-slate-500'}`}>
                {item.label}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
