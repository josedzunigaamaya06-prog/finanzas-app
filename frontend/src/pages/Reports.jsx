import { useEffect, useState } from 'react';
import { reportsAPI } from '../services/api';
import { formatCurrency, formatPercent, getMonthName } from '../utils/formatters';
import Card from '../components/ui/Card';
import CategoryChart from '../components/charts/CategoryChart';
import MonthlyChart from '../components/charts/MonthlyChart';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';

export default function Reports() {
  const now = new Date();
  const [tab, setTab] = useState('monthly');
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [monthlyData, setMonthlyData] = useState(null);
  const [annualData, setAnnualData] = useState(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuthStore();

  const loadMonthly = async () => {
    setLoading(true);
    try { const r = await reportsAPI.getMonthly({ month, year }); setMonthlyData(r.data); }
    catch { toast.error('Error al cargar reporte'); }
    finally { setLoading(false); }
  };

  const loadAnnual = async () => {
    setLoading(true);
    try { const r = await reportsAPI.getAnnual({ year }); setAnnualData(r.data); }
    catch { toast.error('Error al cargar reporte'); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (tab === 'monthly') loadMonthly(); else loadAnnual(); }, [tab, month, year]);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
          {['monthly', 'annual'].map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t ? 'bg-white dark:bg-dark-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
              {t === 'monthly' ? 'Mensual' : 'Anual'}
            </button>
          ))}
        </div>

        {tab === 'monthly' && (
          <div className="flex gap-2">
            <select className="input-field w-auto" value={month} onChange={(e) => setMonth(parseInt(e.target.value))}>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>{getMonthName(m)}</option>
              ))}
            </select>
            <select className="input-field w-auto" value={year} onChange={(e) => setYear(parseInt(e.target.value))}>
              {[year - 2, year - 1, year].map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        )}
        {tab === 'annual' && (
          <select className="input-field w-auto" value={year} onChange={(e) => setYear(parseInt(e.target.value))}>
            {[year - 2, year - 1, year].map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        )}
      </div>

      {loading && <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>}

      {!loading && tab === 'monthly' && monthlyData && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="text-center">
              <p className="text-xs text-slate-400 mb-1">Ingresos</p>
              <p className="text-xl font-bold text-emerald-500">{formatCurrency(monthlyData.totals.totalIncome, user?.currency)}</p>
            </Card>
            <Card className="text-center">
              <p className="text-xs text-slate-400 mb-1">Gastos</p>
              <p className="text-xl font-bold text-red-500">{formatCurrency(monthlyData.totals.totalExpenses, user?.currency)}</p>
            </Card>
            <Card className="text-center">
              <p className="text-xs text-slate-400 mb-1">Ahorro neto</p>
              <p className={`text-xl font-bold ${monthlyData.totals.netSavings >= 0 ? 'text-primary-500' : 'text-red-500'}`}>{formatCurrency(monthlyData.totals.netSavings, user?.currency)}</p>
            </Card>
            <Card className="text-center">
              <p className="text-xs text-slate-400 mb-1">Tasa de ahorro</p>
              <p className={`text-xl font-bold ${monthlyData.totals.savingsRate >= 20 ? 'text-emerald-500' : monthlyData.totals.savingsRate >= 10 ? 'text-amber-500' : 'text-red-500'}`}>{formatPercent(monthlyData.totals.savingsRate)}</p>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4">Gastos por categoría</h3>
              <CategoryChart data={monthlyData.expensesByCategory} />
            </Card>
            <Card>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4">Top 10 gastos</h3>
              <div className="space-y-2">
                {monthlyData.topExpenses.map((e) => (
                  <div key={e.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <span>{e.category?.icon}</span>
                      <span className="text-slate-600 dark:text-slate-300 truncate">{e.description}</span>
                    </div>
                    <span className="font-medium text-red-500 flex-shrink-0 ml-2">-{formatCurrency(e.amount, user?.currency)}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {!loading && tab === 'annual' && annualData && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <Card className="text-center">
              <p className="text-xs text-slate-400 mb-1">Ingresos {annualData.year}</p>
              <p className="text-xl font-bold text-emerald-500">{formatCurrency(annualData.annual.totalIncome, user?.currency)}</p>
            </Card>
            <Card className="text-center">
              <p className="text-xs text-slate-400 mb-1">Gastos {annualData.year}</p>
              <p className="text-xl font-bold text-red-500">{formatCurrency(annualData.annual.totalExpenses, user?.currency)}</p>
            </Card>
            <Card className="text-center">
              <p className="text-xs text-slate-400 mb-1">Ahorro anual</p>
              <p className={`text-xl font-bold ${annualData.annual.netSavings >= 0 ? 'text-primary-500' : 'text-red-500'}`}>{formatCurrency(annualData.annual.netSavings, user?.currency)}</p>
            </Card>
          </div>
          <Card>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4">Tendencia anual {annualData.year}</h3>
            <MonthlyChart data={annualData.months} />
          </Card>
          <Card>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4">Resumen por mes</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700/50">
                    {['Mes', 'Ingresos', 'Gastos', 'Ahorro', 'Tasa'].map((h) => (
                      <th key={h} className="text-left text-xs font-medium text-slate-400 pb-3 pr-4">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/30">
                  {annualData.months.map((m) => (
                    <tr key={m.month}>
                      <td className="py-2.5 pr-4 text-slate-600 dark:text-slate-300 font-medium">{m.label}</td>
                      <td className="py-2.5 pr-4 text-emerald-500 font-medium">{formatCurrency(m.totalIncome, user?.currency)}</td>
                      <td className="py-2.5 pr-4 text-red-500 font-medium">{formatCurrency(m.totalExpenses, user?.currency)}</td>
                      <td className={`py-2.5 pr-4 font-medium ${m.netSavings >= 0 ? 'text-primary-500' : 'text-red-500'}`}>{formatCurrency(m.netSavings, user?.currency)}</td>
                      <td className={`py-2.5 text-xs font-medium ${m.savingsRate >= 20 ? 'text-emerald-500' : m.savingsRate >= 10 ? 'text-amber-500' : 'text-red-500'}`}>{formatPercent(m.savingsRate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
