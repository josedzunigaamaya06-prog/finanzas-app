import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-dark-800 border border-slate-700 rounded-xl p-3 shadow-xl text-sm">
      <p className="text-slate-300 font-medium mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }} className="text-xs">
          {p.name}: {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(p.value)}
        </p>
      ))}
    </div>
  );
};

export default function CashFlowChart({ data = [] }) {
  const formatted = data.map((d) => ({
    ...d,
    'Flujo neto': d.netSavings,
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={formatted} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
        <defs>
          <linearGradient id="cashFlowGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" vertical={false} />
        <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis
          tick={{ fill: '#94a3b8', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`}
          width={45}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="Flujo neto"
          stroke="#6366f1"
          strokeWidth={2}
          fill="url(#cashFlowGradient)"
          dot={{ fill: '#6366f1', strokeWidth: 0, r: 4 }}
          activeDot={{ r: 6, fill: '#6366f1' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
