import { useState, useEffect } from 'react';
import { comparisonAPI } from '../services/api';
import { exportToExcel, exportToPDF, formatCurrencyRaw } from '../utils/exportUtils';
import Card from '../components/ui/Card';
import useAuthStore from '../store/authStore';
import { formatCurrency, getMonthName } from '../utils/formatters';
import toast from 'react-hot-toast';

const now = new Date();
const CY = now.getFullYear();
const CM = now.getMonth() + 1;

const DeltaBadge = ({ a, b, invert = false }) => {
  const diff = b - a;
  const pct  = a !== 0 ? ((diff / Math.abs(a)) * 100).toFixed(1) : null;
  if (diff === 0) return <span className="text-xs text-slate-400 ml-1">Sin cambio</span>;
  const isGood = invert ? diff < 0 : diff > 0;
  return (
    <span className={`text-xs ml-1 font-medium ${isGood ? 'text-emerald-500' : 'text-red-500'}`}>
      {diff > 0 ? '▲' : '▼'} {pct ? `${Math.abs(pct)}%` : ''}
    </span>
  );
};

export default function Comparison() {
  const { user } = useAuthStore();
  const [type, setType]     = useState('month');
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(false);

  // Month vs month
  const [y1, setY1] = useState(CY);
  const [m1, setM1] = useState(CM - 1 === 0 ? 12 : CM - 1);
  const [y2, setY2] = useState(CY);
  const [m2, setM2] = useState(CM);

  // Year vs year
  const [yA, setYA] = useState(CY - 1);
  const [yB, setYB] = useState(CY);

  const load = async () => {
    setLoading(true);
    try {
      const params = type === 'month'
        ? { type: 'month', year1: y1, month1: m1, year2: y2, month2: m2 }
        : { type: 'year', yearA: yA, yearB: yB };
      const res = await comparisonAPI.get(params);
      setData(res.data);
    } catch { toast.error('Error al cargar comparativa'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [type, y1, m1, y2, m2, yA, yB]);

  const YEARS = [CY - 2, CY - 1, CY];
  const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

  const handleExportExcel = () => {
    if (!data) return;
    const rows = [
      { Métrica: 'Ingresos', [data.labelA]: data.periodA.totalIncome, [data.labelB]: data.periodB.totalIncome },
      { Métrica: 'Gastos',   [data.labelA]: data.periodA.totalExpenses, [data.labelB]: data.periodB.totalExpenses },
      { Métrica: 'Ahorro',   [data.labelA]: data.periodA.netSavings,    [data.labelB]: data.periodB.netSavings },
    ];
    exportToExcel(rows, `comparativa-${data.labelA}-vs-${data.labelB}`, 'Comparativa');
    toast.success('Excel descargado');
  };

  const handleExportPDF = () => {
    if (!data) return;
    exportToPDF({
      title: `Comparativa: ${data.labelA} vs ${data.labelB}`,
      subtitle: 'Análisis comparativo de períodos financieros',
      columns: ['Métrica', data.labelA, data.labelB, 'Diferencia'],
      rows: [
        ['Ingresos', formatCurrencyRaw(data.periodA.totalIncome), formatCurrencyRaw(data.periodB.totalIncome), formatCurrencyRaw(data.periodB.totalIncome - data.periodA.totalIncome)],
        ['Gastos',   formatCurrencyRaw(data.periodA.totalExpenses), formatCurrencyRaw(data.periodB.totalExpenses), formatCurrencyRaw(data.periodB.totalExpenses - data.periodA.totalExpenses)],
        ['Ahorro',   formatCurrencyRaw(data.periodA.netSavings), formatCurrencyRaw(data.periodB.netSavings), formatCurrencyRaw(data.periodB.netSavings - data.periodA.netSavings)],
      ],
      filename: `comparativa-${data.labelA}-vs-${data.labelB}`,
    });
    toast.success('PDF descargado');
  };

  const CompCard = ({ label, a, b, color = '', invert = false }) => (
    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-2">
      <p className="text-xs text-slate-400 font-medium">{label}</p>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[10px] text-slate-400 mb-0.5">{data?.labelA}</p>
          <p className={`text-base font-bold ${color || 'text-slate-900 dark:text-white'}`}>{formatCurrency(a, user?.currency)}</p>
        </div>
        <div className="text-slate-300 dark:text-slate-600 text-lg">→</div>
        <div className="text-right">
          <p className="text-[10px] text-slate-400 mb-0.5">{data?.labelB}</p>
          <p className={`text-base font-bold ${color || 'text-slate-900 dark:text-white'}`}>{formatCurrency(b, user?.currency)}</p>
        </div>
      </div>
      <div className="flex items-center justify-end">
        <DeltaBadge a={a} b={b} invert={invert} />
      </div>
    </div>
  );

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">📊 Comparativa</h1>
          <p className="text-sm text-slate-400 mt-0.5">Compara períodos para ver tu evolución</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExportExcel} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 transition-colors">
            📊 Excel
          </button>
          <button onClick={handleExportPDF} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-colors">
            📄 PDF
          </button>
        </div>
      </div>

      {/* Tipo de comparativa */}
      <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1 w-fit">
        {[['month','Mes vs Mes'],['year','Año vs Año']].map(([v, l]) => (
          <button key={v} onClick={() => setType(v)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${type === v ? 'bg-white dark:bg-dark-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
            {l}
          </button>
        ))}
      </div>

      {/* Selectores */}
      <Card className="p-4">
        {type === 'month' ? (
          <div className="flex flex-wrap gap-4 items-center">
            <div>
              <p className="text-xs text-slate-400 mb-1">Período A</p>
              <div className="flex gap-2">
                <select className="input-field w-auto" value={m1} onChange={(e) => setM1(+e.target.value)}>
                  {MONTHS.map((m) => <option key={m} value={m}>{getMonthName(m)}</option>)}
                </select>
                <select className="input-field w-auto" value={y1} onChange={(e) => setY1(+e.target.value)}>
                  {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>
            <span className="text-slate-400 text-lg mt-4">vs</span>
            <div>
              <p className="text-xs text-slate-400 mb-1">Período B</p>
              <div className="flex gap-2">
                <select className="input-field w-auto" value={m2} onChange={(e) => setM2(+e.target.value)}>
                  {MONTHS.map((m) => <option key={m} value={m}>{getMonthName(m)}</option>)}
                </select>
                <select className="input-field w-auto" value={y2} onChange={(e) => setY2(+e.target.value)}>
                  {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-4 items-center">
            <div>
              <p className="text-xs text-slate-400 mb-1">Año A</p>
              <select className="input-field w-auto" value={yA} onChange={(e) => setYA(+e.target.value)}>
                {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <span className="text-slate-400 text-lg mt-4">vs</span>
            <div>
              <p className="text-xs text-slate-400 mb-1">Año B</p>
              <select className="input-field w-auto" value={yB} onChange={(e) => setYB(+e.target.value)}>
                {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
        )}
      </Card>

      {loading && <div className="text-center py-10 text-slate-400">Cargando...</div>}

      {!loading && data && (
        <>
          <Card className="p-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
              {data.labelA} vs {data.labelB}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <CompCard label="💰 Ingresos"  a={data.periodA.totalIncome}    b={data.periodB.totalIncome}    color="text-emerald-500" />
              <CompCard label="💸 Gastos"    a={data.periodA.totalExpenses}  b={data.periodB.totalExpenses}  color="text-red-500" invert />
              <CompCard label="🏦 Ahorro neto" a={data.periodA.netSavings}  b={data.periodB.netSavings}     color="text-primary-500" />
            </div>
          </Card>

          {/* Barra visual de diferencia */}
          {['totalIncome','totalExpenses','netSavings'].map((key, i) => {
            const labels = ['Ingresos','Gastos','Ahorro'];
            const colors = ['bg-emerald-500','bg-red-500','bg-primary-500'];
            const vA = data.periodA[key] || 0;
            const vB = data.periodB[key] || 0;
            const max = Math.max(vA, vB, 1);
            return (
              <Card key={key} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{labels[i]}</p>
                  <DeltaBadge a={vA} b={vB} invert={i === 1} />
                </div>
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>{data.labelA}</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300">{formatCurrency(vA, user?.currency)}</span>
                    </div>
                    <div className="h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${colors[i]} opacity-60`} style={{ width: `${(vA / max) * 100}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>{data.labelB}</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300">{formatCurrency(vB, user?.currency)}</span>
                    </div>
                    <div className="h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${colors[i]}`} style={{ width: `${(vB / max) * 100}%` }} />
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </>
      )}
    </div>
  );
}
