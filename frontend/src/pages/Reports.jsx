import { useEffect, useState } from 'react';
import { reportsAPI } from '../services/api';
import { formatCurrency, formatPercent, getMonthName } from '../utils/formatters';
import { exportToExcel, exportToPDF, formatCurrencyRaw } from '../utils/exportUtils';
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

  const handleExportMonthlyExcel = () => {
    if (!monthlyData) return;
    const rows = monthlyData.topExpenses.map((e) => ({
      Fecha: new Date(e.date).toLocaleDateString('es-CO', { timeZone: 'UTC' }),
      Descripción: e.description,
      Categoría: e.category?.name || '-',
      Monto: Number(e.amount),
      Tipo: e.type === 'FIXED' ? 'Fijo' : 'Variable',
    }));
    exportToExcel(rows, `reporte-mensual-${year}-${month}`, 'Gastos');
    toast.success('Excel descargado');
  };

  const handleExportMonthlyPDF = () => {
    if (!monthlyData) return;
    exportToPDF({
      title: `Reporte Mensual — ${getMonthName(month)} ${year}`,
      subtitle: `Ingresos: ${formatCurrencyRaw(monthlyData.totals.totalIncome)}  |  Gastos: ${formatCurrencyRaw(monthlyData.totals.totalExpenses)}  |  Ahorro: ${formatCurrencyRaw(monthlyData.totals.netSavings)}`,
      columns: ['Fecha', 'Descripción', 'Categoría', 'Monto', 'Tipo'],
      rows: monthlyData.topExpenses.map((e) => [
        new Date(e.date).toLocaleDateString('es-CO', { timeZone: 'UTC' }),
        e.description,
        e.category?.name || '-',
        formatCurrencyRaw(e.amount),
        e.type === 'FIXED' ? 'Fijo' : 'Variable',
      ]),
      filename: `reporte-mensual-${year}-${month}`,
    });
    toast.success('PDF descargado');
  };

  const handleExportAnnualExcel = () => {
    if (!annualData) return;
    const rows = annualData.months.map((m) => ({
      Mes: m.label,
      Ingresos: m.totalIncome,
      Gastos: m.totalExpenses,
      Ahorro: m.netSavings,
      'Tasa ahorro (%)': m.savingsRate?.toFixed(1),
    }));
    exportToExcel(rows, `reporte-anual-${year}`, 'Resumen Anual');
    toast.success('Excel descargado');
  };

  const handleExportAnnualPDF = () => {
    if (!annualData) return;
    exportToPDF({
      title: `Reporte Anual ${year}`,
      subtitle: `Total ingresos: ${formatCurrencyRaw(annualData.annual.totalIncome)}  |  Total gastos: ${formatCurrencyRaw(annualData.annual.totalExpenses)}`,
      columns: ['Mes', 'Ingresos', 'Gastos', 'Ahorro', 'Tasa %'],
      rows: annualData.months.map((m) => [
        m.label,
        formatCurrencyRaw(m.totalIncome),
        formatCurrencyRaw(m.totalExpenses),
        formatCurrencyRaw(m.netSavings),
        `${m.savingsRate?.toFixed(1)}%`,
      ]),
      filename: `reporte-anual-${year}`,
    });
    toast.success('PDF descargado');
  };

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
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">📈 Reportes</h1>
        <p className="text-sm text-slate-400 mt-0.5">Análisis detallado de tus finanzas</p>
      </div>

      <div className="flex items-center gap-3 flex-wrap justify-between">
        <div className="flex items-center gap-3 flex-wrap">
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
                {[now.getFullYear() - 2, now.getFullYear() - 1, now.getFullYear()].map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          )}
          {tab === 'annual' && (
            <select className="input-field w-auto" value={year} onChange={(e) => setYear(parseInt(e.target.value))}>
              {[now.getFullYear() - 2, now.getFullYear() - 1, now.getFullYear()].map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          )}
        </div>

        {/* Botones de exportación */}
        <div className="flex gap-2">
          <button
            onClick={tab === 'monthly' ? handleExportMonthlyExcel : handleExportAnnualExcel}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors border border-emerald-500/20"
          >
            <span>📊</span> Excel
          </button>
          <button
            onClick={tab === 'monthly' ? handleExportMonthlyPDF : handleExportAnnualPDF}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 transition-colors border border-red-500/20"
          >
            <span>📄</span> PDF
          </button>
        </div>
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
