import { useState, useEffect } from 'react';
import { scoreAPI } from '../services/api';
import Card from '../components/ui/Card';

const COLOR_MAP = {
  green: { text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500', ring: 'ring-emerald-500/30', badge: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400' },
  blue:  { text: 'text-blue-600 dark:text-blue-400',       bg: 'bg-blue-500',    ring: 'ring-blue-500/30',    badge: 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400' },
  amber: { text: 'text-amber-600 dark:text-amber-400',     bg: 'bg-amber-500',   ring: 'ring-amber-500/30',   badge: 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400' },
  red:   { text: 'text-red-600 dark:text-red-400',         bg: 'bg-red-500',     ring: 'ring-red-500/30',     badge: 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400' },
};

const BAR_COLOR = {
  green: 'bg-emerald-500',
  blue:  'bg-blue-500',
  amber: 'bg-amber-500',
  red:   'bg-red-500',
};

function ScoreGauge({ score, label, color }) {
  const clr  = COLOR_MAP[color] || COLOR_MAP.blue;
  const pct  = Math.min(Math.max(score, 0), 100);
  // SVG arc gauge
  const r    = 70;
  const cx   = 90;
  const cy   = 90;
  const full = Math.PI * r;           // half-circle arc length
  const dash = (pct / 100) * full;

  return (
    <div className="flex flex-col items-center">
      <svg width="180" height="100" viewBox="0 0 180 100">
        {/* Track */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="14"
          className="text-slate-200 dark:text-slate-700"
          strokeLinecap="round"
        />
        {/* Fill */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="14"
          className={clr.text}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${full}`}
          style={{ transition: 'stroke-dasharray 1s ease' }}
        />
        {/* Score text */}
        <text x={cx} y={cy - 10} textAnchor="middle" className="fill-current" style={{ fontSize: 28, fontWeight: 700 }}>
          {score}
        </text>
        <text x={cx} y={cy + 10} textAnchor="middle" style={{ fontSize: 11, fill: '#94a3b8' }}>
          / 100
        </text>
      </svg>
      <span className={`mt-1 px-3 py-1 rounded-full text-sm font-bold ${clr.badge}`}>{label}</span>
    </div>
  );
}

function ComponentBar({ label, score, max, value, tip, icon, color }) {
  const pct = max > 0 ? (score / max) * 100 : 0;
  const barColor = pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-blue-500' : pct >= 30 ? 'bg-amber-500' : 'bg-red-500';

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm text-slate-700 dark:text-slate-300 flex items-center gap-2 min-w-0">
          <span className="flex-shrink-0">{icon}</span>
          <span className="truncate">{label}</span>
        </span>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs text-slate-400">{value}</span>
          <span className="text-xs font-bold text-slate-900 dark:text-white w-14 text-right">{score}/{max} pts</span>
        </div>
      </div>
      <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-slate-400 leading-relaxed">{tip}</p>
    </div>
  );
}

export default function Score() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    scoreAPI.get()
      .then((res) => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex justify-center items-center py-20">
      <div className="text-center">
        <p className="text-3xl mb-2 animate-pulse">🏆</p>
        <p className="text-slate-400 text-sm">Calculando tu score financiero...</p>
      </div>
    </div>
  );

  if (!data) return (
    <div className="text-center py-20 text-slate-400">No se pudo cargar el score</div>
  );

  const { score, label, color, components, recommendations } = data;
  const clr = COLOR_MAP[color] || COLOR_MAP.blue;

  return (
    <div className="space-y-4 animate-fade-in max-w-lg mx-auto">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">🏆 Score de salud financiera</h1>
        <p className="text-sm text-slate-400 mt-0.5">Evaluación basada en tus datos del último mes</p>
      </div>

      {/* Gauge principal */}
      <Card className="p-6 flex flex-col items-center gap-3">
        <ScoreGauge score={score} label={label} color={color} />
        <p className="text-xs text-slate-400 text-center max-w-xs">
          Tu puntuación combina ahorro, presupuestos, metas y deudas
        </p>
        {/* Mini escala */}
        <div className="flex gap-2 flex-wrap justify-center mt-1">
          {[
            { range: '0–39',  lbl: 'Crítico',   c: 'bg-red-500'     },
            { range: '40–59', lbl: 'Regular',   c: 'bg-amber-500'   },
            { range: '60–79', lbl: 'Bueno',     c: 'bg-blue-500'    },
            { range: '80–100',lbl: 'Excelente', c: 'bg-emerald-500' },
          ].map((s) => (
            <div key={s.lbl} className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${s.c}`}/>
              <span className="text-xs text-slate-400">{s.lbl} <span className="text-slate-500">({s.range})</span></span>
            </div>
          ))}
        </div>
      </Card>

      {/* Desglose por componente */}
      <Card className="p-4">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Desglose por categoría</p>
        <div className="space-y-5">
          {components.map((c) => (
            <ComponentBar key={c.label} {...c} color={color} />
          ))}
        </div>
      </Card>

      {/* Top recomendaciones */}
      {recommendations.length > 0 && (
        <Card className="p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Áreas a mejorar</p>
          <div className="space-y-3">
            {recommendations.map((r, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
                <span className="text-xl flex-shrink-0">{r.icon}</span>
                <div>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">{r.label}</p>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{r.tip}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Pie de página */}
      <p className="text-xs text-slate-400 text-center pb-2">
        El score se recalcula automáticamente con cada visita
      </p>
    </div>
  );
}
