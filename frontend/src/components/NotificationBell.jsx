import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { remindersAPI } from '../services/api';
import { differenceInDays, format } from 'date-fns';
import { es } from 'date-fns/locale';

const TYPE_ICONS = {
  DEBT: '🏦', SUBSCRIPTION: '📱', LOAN: '💳',
  SERVICE: '🔧', TAX: '📋', CUSTOM: '📌',
};

const formatCOP = (n) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

export default function NotificationBell() {
  const [upcoming, setUpcoming] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const load = async () => {
    try {
      const { data } = await remindersAPI.getUpcoming();
      setUpcoming(data.data || []);
    } catch {}
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 5 * 60 * 1000); // refresh cada 5 min
    return () => clearInterval(interval);
  }, []);

  // Cerrar al hacer click fuera
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const count = upcoming.length;

  const urgencyColor = (dueDate) => {
    const days = differenceInDays(new Date(dueDate), new Date());
    if (days <= 0) return 'text-red-500';
    if (days <= 2) return 'text-amber-500';
    return 'text-blue-500';
  };

  const urgencyLabel = (dueDate) => {
    const days = differenceInDays(new Date(dueDate), new Date());
    if (days <= 0) return '¡Vence hoy!';
    if (days === 1) return 'Mañana';
    return `En ${days} días`;
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700/50 text-slate-500 dark:text-slate-400 transition-colors"
        title="Recordatorios"
      >
        🔔
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 w-80 bg-white dark:bg-dark-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700">
            <h3 className="font-semibold text-sm text-slate-900 dark:text-white">
              Próximos recordatorios
            </h3>
            {count > 0 && (
              <span className="text-xs bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400 font-medium px-2 py-0.5 rounded-full">
                {count} pendiente{count !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Lista */}
          <div className="max-h-72 overflow-y-auto">
            {count === 0 ? (
              <div className="p-6 text-center">
                <p className="text-2xl mb-1">✅</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Sin pagos próximos</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">¡Todo al día!</p>
              </div>
            ) : (
              upcoming.map((r) => (
                <div key={r.id} className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors border-b border-slate-50 dark:border-slate-700/30 last:border-0">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: (r.color || '#6366f1') + '20' }}
                  >
                    {TYPE_ICONS[r.type] || '📌'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{r.title}</p>
                    <div className="flex items-center justify-between mt-0.5">
                      {r.amount ? (
                        <span className="text-xs text-slate-500 dark:text-slate-400">{formatCOP(r.amount)}</span>
                      ) : (
                        <span className="text-xs text-slate-400">Sin monto</span>
                      )}
                      <span className={`text-xs font-semibold ${urgencyColor(r.dueDate)}`}>
                        {urgencyLabel(r.dueDate)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                      {format(new Date(r.dueDate), "d 'de' MMM", { locale: es })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
            <Link
              to="/calendar"
              onClick={() => setOpen(false)}
              className="block text-center text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline"
            >
              Ver calendario completo →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
