import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-dark-800 border border-slate-700 rounded-xl p-3 shadow-xl text-sm">
      <p className="text-slate-300 font-medium mb-2">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }} className="text-xs">
          {p.name}: {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(p.value)}
        </p>
      ))}
    </div>
  );
};

export default function MonthlyChart({ data = [] }) {
  const formatted = data.map((d) => ({
    ...d,
    Ingresos: d.totalIncome,
    Gastos: d.totalExpenses,
    Ahorro: Math.max(0, d.netSavings),
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={formatted} margin={{ top: 5, right: 10, left: 10, bottom: 5 }} barSize={12} barGap={4}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" vertical={false} />
        <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis
          tick={{ fill: '#94a3b8', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`}
          width={45}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(148,163,184,0.05)' }} />
        <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
        <Bar dataKey="Ingresos" fill="#10b981" radius={[6, 6, 0, 0]} />
        <Bar dataKey="Gastos" fill="#ef4444" radius={[6, 6, 0, 0]} />
        <Bar dataKey="Ahorro" fill="#6366f1" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
