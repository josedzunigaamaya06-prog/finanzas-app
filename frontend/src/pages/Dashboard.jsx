import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { differenceInDays, parseISO, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { dashboardAPI, remindersAPI, streakAPI } from '../services/api';
import { formatCurrency, formatPercent, formatDate, priorityColor, priorityLabel } from '../utils/formatters';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import MonthlyChart from '../components/charts/MonthlyChart';
import CategoryChart from '../components/charts/CategoryChart';
import CashFlowChart from '../components/charts/CashFlowChart';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import useAuthStore from '../store/authStore';

const gradeColors = {
  A: { text: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  B: { text: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
  C: { text: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  D: { text: '#f97316', bg: 'rgba(249,115,22,0.1)' },
  F: { text: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
};

const statAccent = {
  green: { icon: '#10b981', iconBg: 'rgba(16,185,129,0.1)', value: '#10b981' },
  red:   { icon: '#ef4444', iconBg: 'rgba(239,68,68,0.1)',  value: '#ef4444' },
  blue:  { icon: '#6366f1', iconBg: 'rgba(99,102,241,0.1)', value: '#1e293b' },
  amber: { icon: '#f59e0b', iconBg: 'rgba(245,158,11,0.1)', value: '#1e293b' },
};

const StatCard = ({ label, value, sub, icon, color = 'blue', trend }) => {
  const accent = statAccent[color] || statAccent.blue;
  return (
    <div className="card-hover p-4 md:p-5">
      <div className="flex items-start justify-between mb-3">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">{label}</p>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm flex-shrink-0"
          style={{ background: accent.iconBg, color: accent.icon }}>
          {icon}
        </div>
      </div>
      <p className={`text-xl md:text-2xl font-bold leading-tight text-money ${color !== 'green' && color !== 'red' ? 'text-slate-900 dark:text-white' : ''}`}
        style={color === 'green' || color === 'red' ? { color: accent.value } : {}}
      >
        {value}
      </p>
      {sub && (
        <p className={`text-xs mt-1.5 font-medium ${
          trend === 'up' ? 'text-primary-500' : trend === 'down' ? 'text-red-500' : 'text-slate-400'
        }`}>
          {trend === 'up' ? '↑ ' : trend === 'down' ? '↓ ' : ''}{sub}
        </p>
      )}
    </div>
  );
};

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [upcomingReminders, setUpcomingReminders] = useState([]);
  const [streak, setStreak] = useState(null);
  const { user } = useAuthStore();

  useEffect(() => {
    dashboardAPI.get()
      .then((r) => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
    remindersAPI.getUpcoming()
      .then((r) => setUpcomingReminders(r.data.data || []))
      .catch(() => {});
    streakAPI.get()
      .then((r) => setStreak(r.data))
      .catch(() => {});
  }, []);

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>;
  if (!data) return null;

  const { monthly, trend, expensesByCategory, debtSummary, financialScore, recentTransactions, recommendations, paymentMethodStats, walletSummary } = data;

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in">

      {/* Bienvenida + Score */}
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-0.5">
            {new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Hola, {user?.name?.split(' ')[0]}
          </h2>
        </div>
        {financialScore && (
          <div className="flex items-center gap-1 flex-shrink-0 card px-3 py-2.5">
            <div className="text-center px-2">
              <p className="text-2xl font-black leading-none"
                style={{ color: gradeColors[financialScore.grade]?.text || '#94a3b8' }}>
                {financialScore.grade || '—'}
              </p>
              <p className="text-[10px] mt-0.5 font-medium"
                style={{ color: gradeColors[financialScore.grade]?.text || '#94a3b8' }}>
                {financialScore.gradeLabel || 'Salud'}
              </p>
            </div>
            <div className="w-px h-8 bg-surface-200 mx-1" />
            <div className="text-center px-2">
              <p className="text-xl font-bold text-slate-900 dark:text-white leading-none">{financialScore.score || 0}</p>
              <p className="text-[10px] text-slate-400 mt-0.5 font-medium">/ 100</p>
            </div>
          </div>
        )}
      </div>

      {/* Racha de días */}
      {streak && streak.currentStreak > 0 && (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border ${
          streak.currentStreak >= 7
            ? 'bg-amber-500/10 border-amber-500/30'
            : 'bg-primary-500/10 border-primary-500/30'
        }`}>
          <span className="text-2xl">{streak.currentStreak >= 14 ? '🔥' : streak.currentStreak >= 7 ? '⚡' : '✨'}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-900 dark:text-white">
              {streak.currentStreak} día{streak.currentStreak > 1 ? 's' : ''} registrando gastos
            </p>
            <p className="text-xs text-slate-400">Racha actual · Récord: {streak.maxStreak} días</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-xs text-slate-400">{streak.daysThisMonth} días</p>
            <p className="text-xs text-slate-400">este mes</p>
          </div>
        </div>
      )}

      {/* KPI Cards — 2 columnas en móvil, 4 en desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard
          label="Ingresos del mes"
          value={formatCurrency(monthly.totalIncome, user?.currency)}
          icon="↑" color="green"
          sub={`${monthly.incomeCount} registros`}
        />
        <StatCard
          label="Gastos del mes"
          value={formatCurrency(monthly.totalExpenses, user?.currency)}
          icon="↓" color="red"
          sub={`${monthly.expenseCount} registros`}
        />
        <StatCard
          label="Ahorro neto"
          value={formatCurrency(monthly.netSavings, user?.currency)}
          icon="💰"
          color={monthly.netSavings >= 0 ? 'blue' : 'red'}
          sub={`Tasa: ${formatPercent(monthly.savingsRate)}`}
          trend={monthly.netSavings >= 0 ? 'up' : 'down'}
        />
        <StatCard
          label="Total deudas"
          value={formatCurrency(debtSummary.totalBalance, user?.currency)}
          icon="🏦" color="amber"
          sub={`${debtSummary.count} activas`}
        />
      </div>

      {/* Billeteras + Equilibrio de pago */}
      {(walletSummary || paymentMethodStats) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Widget: Billeteras */}
          {walletSummary && (
            <Card className="p-4 md:p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm md:text-base font-semibold text-slate-900 dark:text-white">💰 Mis billeteras</h3>
                <Link to="/wallets" className="text-xs text-primary-400 hover:text-primary-300">Ver todo →</Link>
              </div>
              <div className="flex gap-3 mb-3">
                <div className="flex-1 p-2.5 rounded-xl bg-primary-500/10 text-center">
                  <p className="text-xs text-slate-400 mb-0.5">Digital</p>
                  <p className="text-sm font-bold text-primary-400 truncate">{formatCurrency(walletSummary.totalDigital, user?.currency)}</p>
                </div>
                <div className="flex-1 p-2.5 rounded-xl bg-emerald-500/10 text-center">
                  <p className="text-xs text-slate-400 mb-0.5">Efectivo</p>
                  <p className="text-sm font-bold text-emerald-400 truncate">{formatCurrency(walletSummary.totalCash, user?.currency)}</p>
                </div>
              </div>
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {(walletSummary.wallets || []).map((w) => (
                  <div key={w.id} className="flex items-center justify-between gap-2 py-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-base flex-shrink-0">{w.icon || '💳'}</span>
                      <p className="text-xs text-slate-600 dark:text-slate-300 truncate">{w.name}</p>
                    </div>
                    <p className="text-xs font-semibold text-slate-900 dark:text-white flex-shrink-0">
                      {formatCurrency(w.balance, user?.currency)}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/30 flex justify-between">
                <span className="text-xs text-slate-400">Total disponible</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">{formatCurrency(walletSummary.totalOverall, user?.currency)}</span>
              </div>
            </Card>
          )}

          {/* Widget: Equilibrio digital vs efectivo */}
          {paymentMethodStats && (
            <Card className="p-4 md:p-5">
              <h3 className="text-sm md:text-base font-semibold text-slate-900 dark:text-white mb-3">📊 Equilibrio de pagos</h3>

              {/* Ingresos */}
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-400">Ingresos</span>
                  <span className="text-emerald-400 font-medium">
                    Digital {paymentMethodStats.income.digitalPct?.toFixed(0)}% · Efectivo {paymentMethodStats.income.cashPct?.toFixed(0)}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden flex">
                  <div className="h-full bg-primary-500 transition-all" style={{ width: `${paymentMethodStats.income.digitalPct || 0}%` }} />
                  <div className="h-full bg-emerald-500 transition-all" style={{ width: `${paymentMethodStats.income.cashPct || 0}%` }} />
                </div>
                <div className="flex justify-between text-xs mt-1 text-slate-500">
                  <span>📱 {formatCurrency(paymentMethodStats.income.digital, user?.currency)}</span>
                  <span>💵 {formatCurrency(paymentMethodStats.income.cash, user?.currency)}</span>
                </div>
              </div>

              {/* Gastos */}
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-400">Gastos</span>
                  <span className="text-red-400 font-medium">
                    Digital {paymentMethodStats.expenses.digitalPct?.toFixed(0)}% · Efectivo {paymentMethodStats.expenses.cashPct?.toFixed(0)}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden flex">
                  <div className="h-full bg-primary-500 transition-all" style={{ width: `${paymentMethodStats.expenses.digitalPct || 0}%` }} />
                  <div className="h-full bg-red-500 transition-all" style={{ width: `${paymentMethodStats.expenses.cashPct || 0}%` }} />
                </div>
                <div className="flex justify-between text-xs mt-1 text-slate-500">
                  <span>📱 {formatCurrency(paymentMethodStats.expenses.digital, user?.currency)}</span>
                  <span>💵 {formatCurrency(paymentMethodStats.expenses.cash, user?.currency)}</span>
                </div>
              </div>

              {/* Equilibrio */}
              <div className={`rounded-xl p-3 text-center mt-2 ${
                paymentMethodStats.equilibrium >= 20
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : paymentMethodStats.equilibrium >= 0
                  ? 'bg-amber-500/10 text-amber-400'
                  : 'bg-red-500/10 text-red-400'
              }`}>
                <p className="text-xs font-medium">
                  {paymentMethodStats.equilibrium >= 20
                    ? '✅ Equilibrio financiero saludable'
                    : paymentMethodStats.equilibrium >= 0
                    ? '⚠️ Equilibrio ajustado este mes'
                    : '❌ Gastas más de lo que ingresas'
                  }
                </p>
                <p className="text-xs mt-0.5 opacity-80">
                  Margen: {paymentMethodStats.equilibrium?.toFixed(1)}% de tus ingresos
                </p>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Gráficos — apilados en móvil, lado a lado en desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 p-4 md:p-6">
          <h3 className="text-sm md:text-base font-semibold text-slate-900 dark:text-white mb-4">
            Ingresos vs Gastos (6 meses)
          </h3>
          <MonthlyChart data={trend} />
        </Card>
        <Card className="p-4 md:p-6">
          <h3 className="text-sm md:text-base font-semibold text-slate-900 dark:text-white mb-4">
            Gastos por categoría
          </h3>
          <CategoryChart data={expensesByCategory} />
        </Card>
      </div>

      {/* Flujo de caja + Sugerencias */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-4 md:p-6">
          <h3 className="text-sm md:text-base font-semibold text-slate-900 dark:text-white mb-4">
            Flujo de caja
          </h3>
          <CashFlowChart data={trend} />
        </Card>

        <Card className="p-4 md:p-6">
          <h3 className="text-sm md:text-base font-semibold text-slate-900 dark:text-white mb-4">
            Sugerencias inteligentes
          </h3>
          {recommendations.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">
              <p className="text-2xl mb-2">✨</p>
              ¡Tus finanzas van bien!
            </div>
          ) : (
            <div className="space-y-2.5">
              {recommendations.map((r) => (
                <div key={r.id} className="flex gap-3 p-3 rounded-xl bg-slate-50 dark:bg-dark-850/50 border border-slate-100 dark:border-slate-700/30">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="text-xs md:text-sm font-medium text-slate-900 dark:text-white">{r.title}</p>
                      <Badge color={priorityColor(r.priority)}>{priorityLabel(r.priority)}</Badge>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-2">{r.message}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Últimas transacciones */}
      <Card className="p-4 md:p-6">
        <h3 className="text-sm md:text-base font-semibold text-slate-900 dark:text-white mb-4">
          Últimas transacciones
        </h3>
        {recentTransactions.length === 0 ? (
          <p className="text-sm text-slate-400 py-4 text-center">No hay transacciones recientes</p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700/30">
            {recentTransactions.map((t) => (
              <div key={`${t.transactionType}-${t.id}`} className="flex items-center gap-3 py-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm flex-shrink-0 ${
                  t.transactionType === 'income'
                    ? 'bg-emerald-500/10 text-emerald-500'
                    : 'bg-red-500/10 text-red-500'
                }`}>
                  {t.category?.icon || (t.transactionType === 'income' ? '↑' : '↓')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{t.description}</p>
                  <p className="text-xs text-slate-400 truncate">
                    {t.category?.name || '-'} · {formatDate(t.date)}
                  </p>
                </div>
                <p className={`text-sm font-semibold flex-shrink-0 ${
                  t.transactionType === 'income' ? 'text-emerald-500' : 'text-red-500'
                }`}>
                  {t.transactionType === 'income' ? '+' : '-'}
                  {formatCurrency(t.amount, user?.currency)}
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Próximos pagos */}
      {upcomingReminders.length > 0 && (
        <Card className="p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm md:text-base font-semibold text-slate-900 dark:text-white">
              🔔 Próximos pagos
            </h3>
            <Link to="/calendar" className="text-xs text-primary-600 dark:text-primary-400 hover:underline font-medium">
              Ver calendario →
            </Link>
          </div>
          <div className="space-y-2">
            {upcomingReminders.slice(0, 5).map((r) => {
              const days = differenceInDays(parseISO(r.dueDate), new Date());
              const urgencyColor = days <= 0 ? 'text-red-500' : days <= 2 ? 'text-amber-500' : 'text-blue-500';
              const urgencyLabel = days <= 0 ? '¡Hoy!' : days === 1 ? 'Mañana' : `${days}d`;
              const TYPE_ICONS = { DEBT:'🏦', SUBSCRIPTION:'📱', LOAN:'💳', SERVICE:'🔧', TAX:'📋', CUSTOM:'📌' };
              return (
                <div key={r.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0" style={{ backgroundColor: (r.color || '#6366f1') + '20' }}>
                    {TYPE_ICONS[r.type] || '📌'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{r.title}</p>
                    {r.amount != null && (
                      <p className="text-xs text-slate-400">
                        {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(r.amount)}
                      </p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`text-xs font-bold ${urgencyColor}`}>{urgencyLabel}</p>
                    <p className="text-xs text-slate-400">{format(parseISO(r.dueDate), "d MMM", { locale: es })}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Score insights */}
      {financialScore?.insights?.length > 0 && (
        <Card className="p-4 md:p-6">
          <h3 className="text-sm md:text-base font-semibold text-slate-900 dark:text-white mb-4">
            Análisis de tu score
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {financialScore.insights.map((insight, i) => {
              const colors = {
                critical: 'border-red-500/30 bg-red-500/5 text-red-400',
                warning:  'border-amber-500/30 bg-amber-500/5 text-amber-400',
                info:     'border-blue-500/30 bg-blue-500/5 text-blue-400',
              };
              return (
                <div key={i} className={`border rounded-xl p-3 text-xs md:text-sm ${colors[insight.type] || colors.info}`}>
                  {insight.message}
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
