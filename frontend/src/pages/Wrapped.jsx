import { useState, useEffect } from 'react';
import { wrappedAPI } from '../services/api';
import { exportToPDF, formatCurrencyRaw } from '../utils/exportUtils';
import Card from '../components/ui/Card';
import useAuthStore from '../store/authStore';
import { formatCurrency } from '../utils/formatters';
import toast from 'react-hot-toast';

const now = new Date();
const CY  = now.getFullYear();

const Stat = ({ icon, label, value, sub, color = 'text-slate-900 dark:text-white', big = false }) => (
  <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
    <span className="text-2xl flex-shrink-0">{icon}</span>
    <div className="min-w-0">
      <p className="text-xs text-slate-400">{label}</p>
      <p className={`font-bold leading-tight mt-0.5 ${big ? 'text-xl' : 'text-base'} ${color}`}>{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

export default function Wrapped() {
  const { user } = useAuthStore();
  const [year, setYear]   = useState(CY);
  const [data, setData]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    wrappedAPI.get(year)
      .then((r) => setData(r.data))
      .catch(() => toast.error('Error al cargar resumen'))
      .finally(() => setLoading(false));
  }, [year]);

  const handleExportPDF = () => {
    if (!data) return;
    exportToPDF({
      title: `Resumen Financiero ${data.year}`,
      subtitle: `Tu año en números — FinanzasPro`,
      columns: ['Categoría', 'Valor'],
      rows: [
        ['Total ingresos', formatCurrencyRaw(data.totalIncome)],
        ['Total gastos', formatCurrencyRaw(data.totalExpenses)],
        ['Ahorro total', formatCurrencyRaw(data.totalSavings)],
        ['Tasa de ahorro', `${data.savingsRate?.toFixed(1)}%`],
        ['Mejor mes', data.bestMonth?.label],
        ['Mes de mayor gasto', data.worstMonth?.label],
        ['Meses con ahorro positivo', `${data.posMonths} de 12`],
        ['Categoría favorita', data.favoriteCategory?.name || '-'],
        ['Día más activo', data.busiestDay],
        ['Total transacciones', data.totalTransactions],
        ['Metas completadas', `${data.completedGoals} de ${data.totalGoals}`],
      ],
      filename: `finanzas-wrapped-${data.year}`,
    });
    toast.success('PDF descargado');
  };

  const YEARS = [CY - 2, CY - 1, CY];

  return (
    <div className="space-y-4 animate-fade-in max-w-lg mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">🎵 Wrapped Financiero</h1>
          <p className="text-sm text-slate-400 mt-0.5">Tu año en números, al estilo Spotify</p>
        </div>
        <div className="flex items-center gap-2">
          <select className="input-field w-auto" value={year} onChange={(e) => setYear(+e.target.value)}>
            {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={handleExportPDF} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-colors">
            📄 PDF
          </button>
        </div>
      </div>

      {loading && (
        <div className="text-center py-20">
          <p className="text-3xl mb-2 animate-bounce">🎵</p>
          <p className="text-slate-400 text-sm">Preparando tu resumen {year}...</p>
        </div>
      )}

      {!loading && data && (
        <>
          {/* Hero card */}
          <div className="rounded-2xl bg-gradient-to-br from-primary-600 via-violet-600 to-fuchsia-600 p-6 text-white text-center space-y-2 shadow-xl shadow-primary-500/30">
            <p className="text-sm font-medium opacity-80">Tu año {data.year} en números</p>
            <p className="text-4xl font-black">{formatCurrency(data.totalIncome, user?.currency)}</p>
            <p className="text-sm opacity-80">Total ingresado</p>
            <div className="flex justify-center gap-6 pt-2 border-t border-white/20">
              <div>
                <p className="text-lg font-bold">{formatCurrency(data.totalExpenses, user?.currency)}</p>
                <p className="text-xs opacity-70">Gastado</p>
              </div>
              <div className="w-px bg-white/20"/>
              <div>
                <p className={`text-lg font-bold ${data.totalSavings >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                  {formatCurrency(data.totalSavings, user?.currency)}
                </p>
                <p className="text-xs opacity-70">Ahorrado</p>
              </div>
              <div className="w-px bg-white/20"/>
              <div>
                <p className="text-lg font-bold">{data.savingsRate?.toFixed(1)}%</p>
                <p className="text-xs opacity-70">Tasa ahorro</p>
              </div>
            </div>
          </div>

          {/* Highlights */}
          <Card className="p-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Highlights del año</p>
            <div className="grid grid-cols-2 gap-2">
              <Stat icon="🏆" label="Mejor mes" value={data.bestMonth?.label} sub={`+${formatCurrency(data.bestMonth?.netSavings || 0, user?.currency)}`} color="text-emerald-500" />
              <Stat icon="😅" label="Mes más caro" value={data.worstMonth?.label} sub={formatCurrency(data.worstMonth?.totalExpenses || 0, user?.currency)} color="text-red-500" />
              <Stat icon="✅" label="Meses con ahorro" value={`${data.posMonths} de 12`} color={data.posMonths >= 9 ? 'text-emerald-500' : data.posMonths >= 6 ? 'text-amber-500' : 'text-red-500'} />
              <Stat icon="🔥" label="Racha máxima" value={`${data.maxPositiveStreak} mes(es)`} sub="de ahorro positivo" />
            </div>
          </Card>

          {/* Categoría favorita */}
          {data.favoriteCategory && (
            <Card className="p-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">¿Dónde fue el dinero?</p>
              <div className="space-y-2">
                {data.topCategories.map((cat, i) => {
                  const pct = data.totalExpenses > 0 ? (cat.total / data.totalExpenses) * 100 : 0;
                  return (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <span>{cat.icon}</span> {cat.name}
                          {i === 0 && <span className="text-xs bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 px-1.5 rounded-md">favorita</span>}
                        </span>
                        <div className="text-right">
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{formatCurrency(cat.total, user?.currency)}</span>
                          <span className="text-xs text-slate-400 ml-1">({pct.toFixed(1)}%)</span>
                        </div>
                      </div>
                      <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-primary-500 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Datos curiosos */}
          <Card className="p-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Datos curiosos</p>
            <div className="grid grid-cols-2 gap-2">
              <Stat icon="📅" label="Día más activo" value={data.busiestDay} sub="más gastos registrados" />
              <Stat icon="🧾" label="Transacciones" value={data.totalTransactions} sub="en el año" />
              <Stat icon="📊" label="Gasto mensual prom." value={formatCurrency(data.avgMonthlyExpense, user?.currency)} />
              <Stat icon="💸" label="Ingreso mensual prom." value={formatCurrency(data.avgMonthlyIncome, user?.currency)} />
            </div>
          </Card>

          {/* Gasto más grande */}
          {data.biggestExpense && (
            <Card className="p-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Tu gasto más grande</p>
              <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-500/10 rounded-xl border border-red-200 dark:border-red-500/20">
                <span className="text-2xl">💸</span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{data.biggestExpense.description}</p>
                  <p className="text-xs text-slate-400">{data.biggestExpense.category} · {new Date(data.biggestExpense.date).toLocaleDateString('es-CO')}</p>
                </div>
                <p className="text-base font-bold text-red-500 flex-shrink-0">{formatCurrency(data.biggestExpense.amount, user?.currency)}</p>
              </div>
            </Card>
          )}

          {/* Metas */}
          {data.totalGoals > 0 && (
            <Card className="p-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Metas de ahorro</p>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <p className="text-2xl font-black text-slate-900 dark:text-white">{data.totalGoals}</p>
                  <p className="text-xs text-slate-400">Total metas</p>
                </div>
                <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl">
                  <p className="text-2xl font-black text-emerald-500">{data.completedGoals}</p>
                  <p className="text-xs text-slate-400">Completadas</p>
                </div>
                <div className="p-3 bg-primary-50 dark:bg-primary-500/10 rounded-xl">
                  <p className="text-2xl font-black text-primary-500">{Math.round(data.avgGoalProgress)}%</p>
                  <p className="text-xs text-slate-400">Progreso prom.</p>
                </div>
              </div>
            </Card>
          )}

          <p className="text-xs text-slate-400 text-center pb-2">
            🎵 FinanzasPro Wrapped {data.year} · Generado el {new Date().toLocaleDateString('es-CO')}
          </p>
        </>
      )}
    </div>
  );
}
