import { NavLink } from 'react-router-dom';

const items = [
  { to: '/dashboard', icon: '⊞', label: 'Inicio' },
  { to: '/wallets',   icon: '👛', label: 'Billeteras' },
  { to: '/incomes',   icon: '↑',  label: 'Ingresos' },
  { to: '/expenses',  icon: '↓',  label: 'Gastos' },
  { to: '/debts',     icon: '🏦', label: 'Deudas' },
];

export default function BottomNav() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-dark-900 border-t border-slate-700/50 flex items-center justify-around px-1 h-16 safe-bottom">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center gap-0.5 flex-1 h-full py-2 rounded-xl transition-colors ${
              isActive ? 'text-primary-400' : 'text-slate-500 hover:text-slate-300'
            }`
          }
        >
          <span className="text-xl leading-none">{item.icon}</span>
          <span className="text-[10px] font-medium">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
