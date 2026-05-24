import { useState, useEffect } from 'react';
import { predictionAPI } from '../services/api';
import Card from '../components/ui/Card';
import useAuthStore from '../store/authStore';

const fmt = (n, currency = 'COP') =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n);

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

export default function Prediction() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const { user }              = useAuthStore();
  const currency              = user?.currency || 'COP';
  const currentMonth          = MONTHS[new Date().getMonth()];

  useEffect(() => {
    predictionAPI.get()
      .then((res) => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex justify-center items-center py-20">
      <div className="text-center">
        <p className="text-3xl mb-2 animate-pulse">📈</p>
        <p className="text-slate-400 text-sm">Calculando predicción...</p>
      </div>
    </div>
  );

  if (!data) return (
    <div className="text-center py-20 text-slate-400">No se pudo cargar la predicción</div>
  );

  const {
    currentSpending, predictedTotal, predictedAdditional,
    currentIncome, projectedBalance, monthlyHistAvg,
    dailyRate, daysPassed, daysInMonth, daysRemaining,
    monthProgress, vsHistorical, topCategories, alert,
  } = data;

  const isDeficit  = projectedBalance < 0;
  const isSurplus  = projectedBalance > 0;
  const isAboveAvg = vsHistorical > 10;
  const isBelowAvg = vsHistorical < -10;

  return (
    <div className="space-y-4 animate-fade-in">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">📈 Predicción de fin de mes</h1>
        <p className="text-sm text-slate-400 mt-0.5">{currentMonth} · Día {daysPassed} de {daysInMonth} · Faltan {daysRemaining} días</p>
      </div>

      {/* Alerta de déficit */}
      {alert && (
        <Card className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30">
          <div className="flex items-start gap-3">
            <span className="text-xl">🚨</span>
            <div>
              <p className="font-semibold text-red-700 dark:text-red-400 text-sm">Posible déficit este mes</p>
              <p className="text-xs text-red-600 dark:text-red-300 mt-0.5">
                Al ritmo actual, tus gastos proyectados superarán tus ingresos registrados. Considera reducir gastos variables.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Tarjeta principal — predicción */}
      <Card className="p-5">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Proyección total del mes</p>

        <div className="flex items-end justify-between mb-3">
          <div>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">{fmt(predictedTotal, currency)}</p>
            <p className="text-xs text-slate-400 mt-0.5">gasto proyectado a fin de mes</p>
          </div>
          <div className="text-right">
            {isAboveAvg && <span className="text-xs bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full font-medium">+{vsHistorical}% vs promedio</span>}
            {isBelowAvg && <span className="text-xs bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full font-medium">{vsHistorical}% vs promedio</span>}
            {!isAboveAvg && !isBelowAvg && <span className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-500 px-2 py-0.5 rounded-full font-medium">Similar al promedio</span>}
          </div>
        </div>

        {/* Barra de progreso del mes */}
        <div className="space-y-1.5 mb-4">
          <div className="flex justify-between text-xs text-slate-400">
            <span>Inicio del mes</span>
            <span>Hoy (día {daysPassed})</span>
            <span>Fin del mes</span>
          </div>
          <div className="relative h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            {/* Gasto actual */}
            <div
              className="absolute left-0 top-0 h-full bg-primary-500 rounded-full transition-all"
              style={{ width: `${Math.min((currentSpending / predictedTotal) * 100, 100)}%` }}
            />
            {/* Marcador de hoy */}
            <div
              className="absolute top-0 h-full w-0.5 bg-slate-400 dark:bg-slate-300"
              style={{ left: `${monthProgress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-primary-600 dark:text-primary-400 font-medium">{fmt(currentSpending, currency)} gastado</span>
            <span className="text-slate-400">+{fmt(predictedAdditional, currency)} proyectado</span>
          </div>
        </div>

        {/* Stats rápidas */}
        <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-100 dark:border-slate-700">
          <div className="text-center">
            <p className="text-xs text-slate-400">Ritmo diario</p>
            <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{fmt(dailyRate, currency)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-400">Promedio 3 meses</p>
            <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{fmt(monthlyHistAvg, currency)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-400">Días restantes</p>
            <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{daysRemaining}</p>
          </div>
        </div>
      </Card>

      {/* Ingresos vs Gastos proyectados */}
      <Card className="p-4">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Balance proyectado</p>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600 dark:text-slate-300 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400 inline-block"/>
              Ingresos registrados
            </span>
            <span className="text-sm font-semibold text-green-600 dark:text-green-400">+{fmt(currentIncome, currency)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600 dark:text-slate-300 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-400 inline-block"/>
              Gastos proyectados
            </span>
            <span className="text-sm font-semibold text-red-500">-{fmt(predictedTotal, currency)}</span>
          </div>
          <div className="h-px bg-slate-100 dark:bg-slate-700 my-1"/>
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Balance proyectado</span>
            <span className={`text-base font-bold ${isSurplus ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
              {isSurplus ? '+' : ''}{fmt(projectedBalance, currency)}
            </span>
          </div>
        </div>
        {currentIncome === 0 && (
          <p className="text-xs text-slate-400 mt-2 bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2">
            💡 Registra tus ingresos del mes para ver el balance real
          </p>
        )}
      </Card>

      {/* Top categorías proyectadas */}
      {topCategories.length > 0 && (
        <Card className="p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Proyección por categoría</p>
          <div className="space-y-3">
            {topCategories.map((cat, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <span>{cat.categoryIcon}</span>
                    <span className="truncate">{cat.categoryName}</span>
                  </span>
                  <div className="text-right flex-shrink-0 ml-2">
                    <span className="text-xs text-slate-400">{fmt(cat.total, currency)}</span>
                    <span className="text-xs text-slate-300 dark:text-slate-600"> → </span>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{fmt(cat.projected, currency)}</span>
                  </div>
                </div>
                <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min((cat.total / (topCategories[0]?.projected || 1)) * 100, 100)}%`,
                      backgroundColor: cat.categoryColor || '#6366f1',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-3">
            El valor proyectado asume el mismo ritmo de gasto hasta fin de mes
          </p>
        </Card>
      )}

    </div>
  );
}
