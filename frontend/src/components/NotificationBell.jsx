import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { remindersAPI, recommendationsAPI } from '../services/api';
import { differenceInDays, format } from 'date-fns';
import { es } from 'date-fns/locale';

const TYPE_ICONS = {
  DEBT: '🏦', SUBSCRIPTION: '📱', LOAN: '💳',
  SERVICE: '🔧', TAX: '📋', CUSTOM: '📌',
};

const formatCOP = (n) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

export default function NotificationBell() {
  const [upcoming, setUpcoming]         = useState([]);
  const [budgetAlerts, setBudgetAlerts] = useState([]);
  const [open, setOpen]                 = useState(false);
  const ref = useRef(null);

  const load = async () => {
    try {
      const [remRes, recRes] = await Promise.all([
        remindersAPI.getUpcoming(),
        recommendationsAPI.getAll(),
      ]);
      setUpcoming(remRes.data.data || []);
      // Solo alertas de presupuesto no leídas y no descartadas
      const alerts = (recRes.data || []).filter(
        (r) => ['BUDGET_EXCEEDED', 'SPENDING_ALERT'].includes(r.type) && !r.isRead && !r.isDismissed
      );
      setBudgetAlerts(alerts);
    } catch {}
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 3 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleDismissAlert = async (e, id) => {
    e.stopPropagation();
    try {
      await recommendationsAPI.dismiss(id);
      setBudgetAlerts((prev) => prev.filter((a) => a.id !== id));
    } catch {}
  };

  const totalCount = upcoming.length + budgetAlerts.length;

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
        className="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700/50 text-slate-500 dark:text-slate-400 transition-colors active:scale-95"
        title="Notificaciones"
      >
        🔔
        {totalCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {totalCount > 9 ? '9+' : totalCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 w-80 bg-white dark:bg-dark-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 z-50 overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700">
            <h3 className="font-semibold text-sm text-slate-900 dark:text-white">Notificaciones</h3>
            {totalCount > 0 && (
              <span className="text-xs bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400 font-medium px-2 py-0.5 rounded-full">
                {totalCount}
              </span>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">

            {/* ── Alertas de presupuesto ── */}
            {budgetAlerts.length > 0 && (
              <div>
                <p className="px-4 pt-2 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Alertas de presupuesto
                </p>
                {budgetAlerts.map((alert) => {
                  const isCritical = alert.type === 'BUDGET_EXCEEDED';
                  const d = alert.data || {};
                  return (
                    <div key={alert.id} className={`flex items-start gap-3 px-4 py-3 border-b border-slate-50 dark:border-slate-700/30 ${
                      isCritical ? 'bg-red-50 dark:bg-red-500/5' : 'bg-amber-50 dark:bg-amber-500/5'
                    }`}>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0 mt-0.5 ${
                        isCritical ? 'bg-red-100 dark:bg-red-500/20' : 'bg-amber-100 dark:bg-amber-500/20'
                      }`}>
                        {isCritical ? '🚨' : '⚠️'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{alert.title}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{alert.message}</p>
                        {d.percentage && (
                          <div className="mt-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full ${isCritical ? 'bg-red-500' : 'bg-amber-500'}`}
                              style={{ width: `${Math.min(d.percentage, 100)}%` }}
                            />
                          </div>
                        )}
                      </div>
                      <button
                        onClick={(e) => handleDismissAlert(e, alert.id)}
                        className="text-slate-300 hover:text-slate-500 dark:hover:text-slate-300 text-lg leading-none flex-shrink-0 mt-0.5"
                        title="Descartar"
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── Recordatorios próximos ── */}
            {upcoming.length > 0 && (
              <div>
                <p className="px-4 pt-2 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Pagos próximos (7 días)
                </p>
                {upcoming.map((r) => (
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
                ))}
              </div>
            )}

            {/* Vacío */}
            {totalCount === 0 && (
              <div className="p-6 text-center">
                <p className="text-2xl mb-1">✅</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Sin notificaciones</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">¡Todo bajo control!</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex gap-3">
            <Link to="/calendar" onClick={() => setOpen(false)}
              className="flex-1 text-center text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline">
              📅 Calendario
            </Link>
            <div className="w-px bg-slate-200 dark:bg-slate-700" />
            <Link to="/budgets" onClick={() => setOpen(false)}
              className="flex-1 text-center text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline">
              📊 Presupuestos
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
