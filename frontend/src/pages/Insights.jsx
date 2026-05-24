import { useState, useEffect } from 'react';
import { insightsAPI } from '../services/api';
import Card from '../components/ui/Card';
import useAuthStore from '../store/authStore';

const formatCurrency = (n, currency = 'COP') =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n);

const formatDate = (d) =>
  new Date(d).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });

export default function Insights() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const { user }              = useAuthStore();

  useEffect(() => {
    insightsAPI.get()
      .then((res) => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex justify-center items-center py-20">
      <div className="text-center">
        <p className="text-3xl mb-2 animate-pulse">🔍</p>
        <p className="text-slate-400 text-sm">Analizando tus gastos...</p>
      </div>
    </div>
  );

  const { hormiga = [], subscriptions = [], totalSpending = 0 } = data || {};

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">🔍 Análisis inteligente</h1>
        <p className="text-sm text-slate-400 mt-0.5">
          Últimos 30 días · Gasto total: <strong className="text-slate-600 dark:text-slate-300">{formatCurrency(totalSpending, user?.currency)}</strong>
        </p>
      </div>

      {/* ── GASTOS HORMIGA ──────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl">🐜</span>
          <h2 className="font-semibold text-slate-800 dark:text-white">Gastos hormiga</h2>
          <span className="text-xs bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full font-medium">
            {hormiga.length} detectados
          </span>
        </div>
        <p className="text-xs text-slate-400 mb-3">
          Categorías con muchas transacciones pequeñas que juntas representan un gasto importante.
        </p>

        {hormiga.length === 0 ? (
          <Card className="p-6 text-center">
            <p className="text-2xl mb-1">✅</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">No se detectaron gastos hormiga</p>
            <p className="text-xs text-slate-400 mt-1">Tus gastos frecuentes están bajo control</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {hormiga.map((g, i) => (
              <Card key={i} className="p-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                    style={{ backgroundColor: (g.categoryColor || '#6366f1') + '20' }}
                  >
                    {g.categoryIcon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-slate-800 dark:text-white text-sm">{g.categoryName}</p>
                      <p className="text-sm font-bold text-amber-600 dark:text-amber-400 flex-shrink-0">
                        {formatCurrency(g.total, user?.currency)}
                      </p>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {g.count} transacciones · Promedio {formatCurrency(g.avg, user?.currency)} c/u
                    </p>
                    {/* Barra de porcentaje */}
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-full h-1.5">
                        <div
                          className="h-1.5 rounded-full bg-amber-400"
                          style={{ width: `${Math.min(g.percentage, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 flex-shrink-0">
                        {g.percentage}% del total
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-3 bg-amber-50 dark:bg-amber-500/10 rounded-lg px-3 py-2">
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    💡 Si reduces esta categoría un 30%, ahorrarías <strong>{formatCurrency(Math.round(g.total * 0.3), user?.currency)}</strong> este mes.
                  </p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* ── SUSCRIPCIONES OLVIDADAS ─────────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl">📱</span>
          <h2 className="font-semibold text-slate-800 dark:text-white">Posibles suscripciones olvidadas</h2>
          <span className="text-xs bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-400 px-2 py-0.5 rounded-full font-medium">
            {subscriptions.length} detectadas
          </span>
        </div>
        <p className="text-xs text-slate-400 mb-3">
          Pagos que se repiten mes a mes con montos similares. ¿Siguen siendo necesarios?
        </p>

        {subscriptions.length === 0 ? (
          <Card className="p-6 text-center">
            <p className="text-2xl mb-1">✅</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">No se detectaron suscripciones olvidadas</p>
            <p className="text-xs text-slate-400 mt-1">Todos tus pagos recurrentes parecen estar bajo control</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {subscriptions.map((s, i) => (
              <Card key={i} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-500/20 flex items-center justify-center text-base flex-shrink-0">
                      📱
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">
                        {s.description}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Aparece {s.monthCount} meses · {s.occurrences} veces · Último: {formatDate(s.lastDate)}
                      </p>
                      <p className="text-xs text-violet-600 dark:text-violet-400 mt-0.5 font-medium">
                        Total pagado: {formatCurrency(s.totalSpent, user?.currency)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                      {formatCurrency(s.avgAmount, user?.currency)}
                    </p>
                    <p className="text-xs text-slate-400">por pago</p>
                  </div>
                </div>
                <div className="mt-2 bg-violet-50 dark:bg-violet-500/10 rounded-lg px-3 py-1.5">
                  <p className="text-xs text-violet-700 dark:text-violet-300">
                    ❓ ¿Sigues usando este servicio? Si no, cancelarlo te ahorraría <strong>{formatCurrency(s.avgAmount * 12, user?.currency)}</strong> al año.
                  </p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <Card className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
        <p className="text-xs text-slate-400 text-center">
          🔄 El análisis se actualiza automáticamente con tus últimos gastos · Basado en los últimos 30-90 días
        </p>
      </Card>
    </div>
  );
}
