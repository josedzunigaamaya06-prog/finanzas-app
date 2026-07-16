import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const STORAGE_KEY = 'finanzas_onboarded';

// ─── Pasos del tutorial ────────────────────────────────────────────────────────

const STEPS = [
  {
    id: 'welcome',
    emoji: '👋',
    title: '¡Bienvenido a FinanzasPro!',
    subtitle: 'Tu aliado para tomar control de tus finanzas personales',
    color: 'from-primary-500 to-primary-600',
    content: (
      <div className="space-y-3">
        <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
          En pocos minutos vas a aprender cómo usar todas las funciones de la app para que puedas:
        </p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { icon: '💰', text: 'Registrar ingresos y gastos' },
            { icon: '📊', text: 'Armar tu presupuesto mensual' },
            { icon: '🎯', text: 'Crear metas de ahorro' },
            { icon: '🔔', text: 'Recordar fechas de pago' },
          ].map((item) => (
            <div key={item.text} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
              <span className="text-xl">{item.icon}</span>
              <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">{item.text}</span>
            </div>
          ))}
        </div>
        <div className="bg-primary-50 dark:bg-primary-500/10 border border-primary-100 dark:border-primary-500/20 rounded-xl p-3">
          <p className="text-xs text-primary-700 dark:text-primary-400">
            💡 Esta guía tarda menos de 2 minutos y puedes volver a verla en cualquier momento desde tu <strong>Perfil</strong>.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 'incomes',
    emoji: '💰',
    title: 'Registra tus Ingresos',
    subtitle: 'Todo el dinero que entra a tu bolsillo',
    color: 'from-emerald-500 to-teal-600',
    content: (
      <div className="space-y-3">
        <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
          Registra <strong>todo el dinero que recibes</strong>, sin importar la fuente. Mientras más completo, más preciso será tu análisis.
        </p>

        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Ejemplos de ingresos</p>
          {[
            { icon: '🏢', title: 'Salario', desc: 'Tu sueldo mensual o quincenal' },
            { icon: '💻', title: 'Freelance / Rebusque', desc: 'Trabajos extras, ventas, servicios' },
            { icon: '🏠', title: 'Arriendo recibido', desc: 'Si tienes propiedades arrendadas' },
            { icon: '🎁', title: 'Bonificaciones', desc: 'Primas, comisiones, auxilios' },
          ].map((item) => (
            <div key={item.title} className="flex items-center gap-3 p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl">
              <span className="text-lg w-8 text-center">{item.icon}</span>
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-white">{item.title}</p>
                <p className="text-xs text-slate-400">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-xl p-3">
          <p className="text-xs text-emerald-700 dark:text-emerald-400">
            ✅ <strong>Tip:</strong> Activa la opción "Recurrente" en los ingresos fijos (como el salario) para que te recuerden registrarlos cada mes.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 'expenses',
    emoji: '💸',
    title: 'Controla tus Gastos',
    subtitle: 'Clasifícalos bien para entender en qué se va el dinero',
    color: 'from-red-500 to-rose-600',
    content: (
      <div className="space-y-3">
        <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
          Lo más importante es <strong>clasificar bien tus gastos</strong>. Hay dos tipos:
        </p>

        <div className="grid grid-cols-2 gap-2">
          <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-xl p-3">
            <p className="text-sm font-bold text-blue-700 dark:text-blue-400 mb-1">🔒 Fijos</p>
            <p className="text-xs text-blue-600 dark:text-blue-400 mb-2">Siempre son iguales cada mes</p>
            <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
              <li>• Arriendo</li>
              <li>• Internet / TV</li>
              <li>• Seguro médico</li>
              <li>• Cuota préstamo</li>
            </ul>
          </div>
          <div className="bg-orange-50 dark:bg-orange-500/10 border border-orange-100 dark:border-orange-500/20 rounded-xl p-3">
            <p className="text-sm font-bold text-orange-700 dark:text-orange-400 mb-1">🔓 Variables</p>
            <p className="text-xs text-orange-600 dark:text-orange-400 mb-2">Cambian cada mes</p>
            <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
              <li>• Mercado / Comida</li>
              <li>• Transporte</li>
              <li>• Entretenimiento</li>
              <li>• Ropa y compras</li>
            </ul>
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Categorías disponibles</p>
          <div className="flex flex-wrap gap-1.5">
            {['🍽️ Alimentación','🚗 Transporte','🏠 Vivienda','💊 Salud','🎬 Ocio','📚 Educación','👕 Ropa','💡 Servicios'].map(c => (
              <span key={c} className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-lg">{c}</span>
            ))}
          </div>
        </div>

        <div className="bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-xl p-3">
          <p className="text-xs text-red-700 dark:text-red-400">
            ✅ <strong>Tip:</strong> Registra también el <strong>método de pago</strong> (digital o efectivo) para ver en qué forma gastas más.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 'budget',
    emoji: '📊',
    title: 'Arma tu Presupuesto',
    subtitle: 'Planifica cuánto quieres gastar en cada área',
    color: 'from-blue-500 to-indigo-600',
    content: (
      <div className="space-y-3">
        <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
          Un presupuesto es simplemente <strong>decidir de antemano cuánto gastar</strong> en cada categoría durante el mes.
        </p>

        <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 space-y-2">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Ejemplo con $2.000.000 de ingreso</p>
          {[
            { cat: '🏠 Vivienda (arriendo)', pct: '30%', val: '$600.000' },
            { cat: '🍽️ Alimentación', pct: '20%', val: '$400.000' },
            { cat: '🚗 Transporte', pct: '10%', val: '$200.000' },
            { cat: '💡 Servicios', pct: '10%', val: '$200.000' },
            { cat: '🎯 Ahorro', pct: '20%', val: '$400.000' },
            { cat: '🎬 Ocio y extras', pct: '10%', val: '$200.000' },
          ].map((row) => (
            <div key={row.cat} className="flex items-center justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-300">{row.cat}</span>
              <div className="flex gap-2">
                <span className="text-slate-400">{row.pct}</span>
                <span className="font-semibold text-slate-700 dark:text-slate-200">{row.val}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-xl p-3">
          <p className="text-xs text-blue-700 dark:text-blue-400">
            ✅ <strong>Regla 50/30/20:</strong> 50% necesidades básicas · 30% deseos · 20% ahorro. ¡Es un buen punto de partida!
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 'savings',
    emoji: '🎯',
    title: 'Metas de Ahorro',
    subtitle: 'Ahorra con un objetivo claro en mente',
    color: 'from-amber-500 to-orange-600',
    content: (
      <div className="space-y-3">
        <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
          Ahorrar es más fácil cuando tienes <strong>una razón concreta</strong>. Define metas para lograrlo más rápido.
        </p>

        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Ejemplos de metas</p>
          {[
            { icon: '📱', title: 'Comprar un celular', desc: 'Meta: $1.500.000 · 3 meses' },
            { icon: '✈️', title: 'Viaje de vacaciones', desc: 'Meta: $3.000.000 · 6 meses' },
            { icon: '🚨', title: 'Fondo de emergencia', desc: 'Meta: 3 meses de gastos' },
            { icon: '🎓', title: 'Curso o estudio', desc: 'Meta: $800.000 · 2 meses' },
          ].map((item) => (
            <div key={item.title} className="flex items-center gap-3 p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl">
              <span className="text-xl">{item.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 dark:text-white">{item.title}</p>
                <p className="text-xs text-slate-400">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 rounded-xl p-3">
          <p className="text-xs text-amber-700 dark:text-amber-400">
            ✅ <strong>Tip:</strong> En <strong>Metas</strong> puedes registrar abonos parciales y ver una barra de progreso. ¡Cada peso cuenta!
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 'reminders',
    emoji: '📅',
    title: 'Recordatorios de Pago',
    subtitle: 'Nunca más olvides una fecha de vencimiento',
    color: 'from-violet-500 to-purple-600',
    content: (
      <div className="space-y-3">
        <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
          El <strong>Calendario</strong> te avisa antes de que venza cualquier pago para que no te cojan por sorpresa.
        </p>

        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">¿Qué puedes recordar?</p>
          {[
            { icon: '🏦', label: 'Cuotas de deudas y préstamos' },
            { icon: '📱', label: 'Suscripciones (Netflix, Spotify...)' },
            { icon: '💡', label: 'Servicios públicos' },
            { icon: '📋', label: 'Impuestos o pagos anuales' },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2.5 p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl">
              <span className="text-base w-7 text-center">{item.icon}</span>
              <p className="text-sm text-slate-600 dark:text-slate-300">{item.label}</p>
            </div>
          ))}
        </div>

        <div className="bg-violet-50 dark:bg-violet-500/10 border border-violet-100 dark:border-violet-500/20 rounded-xl p-3">
          <p className="text-xs text-violet-700 dark:text-violet-400">
            ✅ <strong>Tip:</strong> Activa los recordatorios <strong>recurrentes</strong> para pagos mensuales y se crean solos al marcarlos como pagados.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 'smart',
    emoji: '🤖',
    title: 'Funciones Inteligentes',
    subtitle: 'La app aprende contigo y te ayuda a decidir mejor',
    color: 'from-violet-500 to-fuchsia-600',
    content: (
      <div className="space-y-3">
        <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
          FinanzasPro tiene herramientas avanzadas que <strong>analizan tus datos automáticamente</strong>:
        </p>

        <div className="space-y-2">
          {[
            {
              icon: '⚡',
              title: 'Reglas automáticas',
              desc: 'Crea reglas como "si el gasto dice Netflix → categoría Suscripciones". La app lo categoriza sola.',
              where: 'Reglas auto',
            },
            {
              icon: '🤖',
              title: 'Sugerencia de categoría con IA',
              desc: 'Al escribir la descripción del gasto, la IA te sugiere la categoría correcta al instante.',
              where: 'Al agregar un gasto',
            },
            {
              icon: '🔍',
              title: 'Análisis de hábitos',
              desc: 'Detecta gastos hormiga (muchos pagos pequeños) y suscripciones olvidadas que drenan tu dinero.',
              where: 'Análisis',
            },
            {
              icon: '📈',
              title: 'Predicción de fin de mes',
              desc: 'Estima cuánto gastarás a fin de mes según tu ritmo actual e historial.',
              where: 'Predicción',
            },
            {
              icon: '🏆',
              title: 'Score de salud financiera',
              desc: 'Obtén un puntaje de 0 a 100 que mide tu ahorro, deudas, metas y control de presupuesto.',
              where: 'Mi salud',
            },
          ].map((item) => (
            <div key={item.title} className="flex items-start gap-3 p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl">
              <span className="text-xl flex-shrink-0 mt-0.5">{item.icon}</span>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-slate-800 dark:text-white">{item.title}</p>
                  <span className="text-xs bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400 px-1.5 py-0.5 rounded-md">{item.where}</span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: 'done',
    emoji: '🚀',
    title: '¡Todo listo!',
    subtitle: 'Ya sabes todo lo que necesitas para empezar',
    color: 'from-primary-500 to-primary-600',
    content: (
      <div className="space-y-4">
        <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed text-center">
          Ahora sí, ¡a tomar control de tus finanzas! Te recomendamos empezar así:
        </p>

        <div className="space-y-2">
          {[
            { num: '1', icon: '👛', text: 'Crea tus billeteras (Nequi, Bancolombia, Efectivo...)' },
            { num: '2', icon: '💰', text: 'Registra tu ingreso del mes actual' },
            { num: '3', icon: '💸', text: 'Agrega tus gastos fijos (arriendo, servicios...)' },
            { num: '4', icon: '📊', text: 'Crea un presupuesto por categoría' },
            { num: '5', icon: '📅', text: 'Añade recordatorios de tus fechas de pago' },
            { num: '6', icon: '🏆', text: 'Consulta tu Score de salud financiera en "Mi salud"' },
          ].map((step) => (
            <div key={step.num} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
              <div className="w-6 h-6 rounded-full bg-primary-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                {step.num}
              </div>
              <span className="text-lg">{step.icon}</span>
              <p className="text-sm text-slate-700 dark:text-slate-200">{step.text}</p>
            </div>
          ))}
        </div>

        <div className="bg-primary-50 dark:bg-primary-500/10 border border-primary-100 dark:border-primary-500/20 rounded-xl p-3 text-center">
          <p className="text-xs text-primary-700 dark:text-primary-400">
            🔁 Puedes ver esta guía de nuevo en <strong>Perfil → Guía de inicio</strong>
          </p>
        </div>
      </div>
    ),
  },
];

// ─── Componente principal ──────────────────────────────────────────────────────

export default function OnboardingModal() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    // Mostrar solo si el usuario nunca ha completado el onboarding
    const done = localStorage.getItem(STORAGE_KEY);
    if (!done) {
      // Pequeño delay para que el dashboard cargue primero
      const t = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(t);
    }
  }, []);

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const isFirst = step === 0;

  const finish = (goTo = null) => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setVisible(false);
    if (goTo) navigate(goTo);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative w-full sm:max-w-md bg-white dark:bg-dark-800 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">

        {/* Barra de progreso */}
        <div className="h-1 bg-slate-100 dark:bg-slate-700">
          <div
            className={`h-full bg-gradient-to-r ${current.color} transition-all duration-500`}
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        {/* Header del paso */}
        <div className={`bg-gradient-to-br ${current.color} px-6 py-5 flex-shrink-0`}>
          <div className="flex items-start justify-between">
            <div>
              <div className="text-4xl mb-2">{current.emoji}</div>
              <h2 className="text-lg font-bold text-white leading-tight">{current.title}</h2>
              <p className="text-sm text-white/80 mt-0.5">{current.subtitle}</p>
            </div>
            <button
              onClick={() => finish()}
              className="text-white/60 hover:text-white text-sm transition-colors ml-3 flex-shrink-0"
            >
              Saltar ✕
            </button>
          </div>

          {/* Paso X de Y */}
          <div className="flex gap-1 mt-4">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1 rounded-full flex-1 transition-all duration-300 ${i <= step ? 'bg-white' : 'bg-white/30'}`}
              />
            ))}
          </div>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {current.content}
        </div>

        {/* Footer con botones */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700 flex gap-3 flex-shrink-0 bg-white dark:bg-dark-800">
          {!isFirst && (
            <button
              onClick={() => setStep(s => s - 1)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
            >
              ← Atrás
            </button>
          )}

          {isLast ? (
            <button
              onClick={() => finish('/wallets')}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white text-sm font-bold transition-all hover:opacity-90 shadow-lg shadow-primary-500/30"
            >
              🚀 ¡Empezar ahora!
            </button>
          ) : (
            <button
              onClick={() => setStep(s => s + 1)}
              className={`flex-1 py-2.5 rounded-xl bg-gradient-to-r ${current.color} text-white text-sm font-semibold transition-all hover:opacity-90`}
            >
              Siguiente →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Hook para reabrir el onboarding desde el perfil
export function useOnboarding() {
  const reset = () => localStorage.removeItem(STORAGE_KEY);
  const isDone = () => !!localStorage.getItem(STORAGE_KEY);
  return { reset, isDone };
}
