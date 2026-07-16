import { useEffect, useState } from 'react';
import { debtsAPI } from '../services/api';
import { formatCurrency, formatPercent, formatDate, toInputDate } from '../utils/formatters';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { SkStatCard, SkCard } from '../components/ui/Skeleton';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';

const DEBT_CATEGORIES = [
  { value: 'CREDIT_CARD',          label: 'Tarjeta de crédito',      icon: '💳' },
  { value: 'BANK_LOAN',            label: 'Crédito bancario',         icon: '🏦' },
  { value: 'VEHICLE',              label: 'Crédito vehículo',         icon: '🚗' },
  { value: 'MORTGAGE',             label: 'Hipoteca',                 icon: '🏠' },
  { value: 'STUDENT_LOAN',         label: 'Crédito educativo',        icon: '📚' },
  { value: 'STORE_CREDIT',         label: 'Crédito tienda',           icon: '🛍️' },
  { value: 'TELECOM',              label: 'Telefonía / Servicios',    icon: '📱' },
  { value: 'THIRD_PARTY',          label: 'Deuda con tercero (sin interés)', icon: '🤝' },
  { value: 'THIRD_PARTY_INTEREST', label: 'Tercero con interés fijo', icon: '📋' },
  { value: 'INFORMAL',             label: 'Gota a gota / informal',  icon: '⚠️' },
  { value: 'OTHER',                label: 'Otro',                     icon: '📂' },
];

const RISK_CONFIG = {
  CRITICAL: { label: 'Crítico',  color: 'bg-red-500/20 text-red-400 border-red-500/30' },
  HIGH:     { label: 'Alto',     color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  MEDIUM:   { label: 'Medio',    color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  LOW:      { label: 'Bajo',     color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
};

const CAT_MAP = Object.fromEntries(DEBT_CATEGORIES.map((d) => [d.value, d]));

const EMPTY_FORM = {
  name: '', entity: '', debtCategory: 'BANK_LOAN',
  totalAmount: '', currentBalance: '', interestRate: '',
  interestPeriod: 'ANNUAL', minimumPayment: '', dueDate: '15',
  interestType: 'COMPOUND', startDate: new Date().toISOString().split('T')[0],
  notes: '', isNegotiable: true,
};

const PAYMENT_FORM = { amount: '', date: new Date().toISOString().split('T')[0], note: '' };

export default function Debts() {
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [paymentModal, setPaymentModal] = useState(false);
  const [detailModal, setDetailModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [selectedDebt, setSelectedDebt] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [paymentForm, setPaymentForm] = useState(PAYMENT_FORM);
  const [saving, setSaving] = useState(false);
  const [strategies, setStrategies] = useState(null);
  const [activeTab, setActiveTab] = useState('debts'); // 'debts' | 'plan' | 'compare'
  const { user } = useAuthStore();

  const load = async () => {
    try {
      const [debtsRes, stratRes] = await Promise.all([debtsAPI.getAll(), debtsAPI.getStrategies(0)]);
      setDebts(debtsRes.data);
      setStrategies(stratRes.data);
    } catch { toast.error('Error al cargar deudas'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setModal(true); };
  const openEdit = (debt) => {
    setEditing(debt);
    // Solo copiamos los campos del modelo — nunca los campos calculados
    setForm({
      name:           debt.name,
      entity:         debt.entity,
      debtCategory:   debt.debtCategory   || 'OTHER',
      totalAmount:    String(debt.totalAmount),
      currentBalance: String(debt.currentBalance),
      interestRate:   String(Number(debt.interestRate) * 100),
      interestPeriod: debt.interestPeriod  || 'ANNUAL',
      minimumPayment: String(debt.minimumPayment),
      dueDate:        String(debt.dueDate  || '15'),
      interestType:   debt.interestType    || 'COMPOUND',
      startDate:      toInputDate(debt.startDate),
      notes:          debt.notes           || '',
      isNegotiable:   debt.isNegotiable !== false,
    });
    setModal(true);
  };

  const openDetail = (debt) => { setSelectedDebt(debt); setDetailModal(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Enviamos SOLO los campos válidos del modelo Debt
      const payload = {
        name:           form.name,
        entity:         form.entity,
        debtCategory:   form.debtCategory,
        totalAmount:    parseFloat(form.totalAmount),
        currentBalance: parseFloat(form.currentBalance),
        interestRate:   parseFloat(form.interestRate) / 100,
        interestPeriod: form.interestPeriod,
        minimumPayment: parseFloat(form.minimumPayment),
        dueDate:        parseInt(form.dueDate),
        interestType:   form.interestType,
        startDate:      form.startDate,
        notes:          form.notes || null,
        isNegotiable:   Boolean(form.isNegotiable),
      };
      if (editing) { await debtsAPI.update(editing.id, payload); toast.success('Deuda actualizada'); }
      else { await debtsAPI.create(payload); toast.success('Deuda registrada'); }
      setModal(false); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Error al guardar'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar esta deuda?')) return;
    try { await debtsAPI.remove(id); toast.success('Deuda eliminada'); load(); }
    catch { toast.error('Error al eliminar'); }
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await debtsAPI.addPayment(selectedDebt.id, { ...paymentForm, amount: parseFloat(paymentForm.amount) });
      toast.success('Pago registrado');
      setPaymentModal(false); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const totalBalance      = debts.reduce((s, d) => s + d.currentBalance, 0);
  const totalMinPayment   = debts.reduce((s, d) => s + d.minimumPayment, 0);
  const totalMonthlyInterest = debts.reduce((s, d) => s + (d.monthlyInterest || 0), 0);

  if (loading) return (
    <div className="space-y-4 animate-fade-in">
      <div className="grid grid-cols-3 gap-3">{[0,1,2].map(i => <SkStatCard key={i} />)}</div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[0,1,2,3].map(i => <div key={i} style={{ opacity: 1 - i * 0.2 }}><SkCard /></div>)}
      </div>
    </div>
  );

  const optimalPlan = strategies?.optimalPlan || [];

  return (
    <div className="space-y-4 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white">Gestión de Deudas</h2>
          <p className="text-xs text-slate-400">Estrategias inteligentes para liberarte de deudas</p>
        </div>
        <Button onClick={openCreate} icon="+" variant="primary" size="sm">
          <span className="hidden sm:inline">Nueva deuda</span>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card padding="p-4 md:p-5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-400 mb-1.5">Total deuda</p>
              <p className="text-xl md:text-2xl font-bold text-money text-amber-500 truncate">{formatCurrency(totalBalance, user?.currency)}</p>
              <p className="text-[11px] text-slate-400 mt-1">{debts.length} deuda{debts.length !== 1 ? 's' : ''}</p>
            </div>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-base" style={{ background: 'rgba(245,158,11,0.08)' }}>🏦</div>
          </div>
        </Card>
        <Card padding="p-4 md:p-5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-400 mb-1.5">Pago mín./mes</p>
              <p className="text-xl md:text-2xl font-bold text-money text-red-500 truncate">{formatCurrency(totalMinPayment, user?.currency)}</p>
            </div>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-base" style={{ background: 'rgba(239,68,68,0.08)' }}>📅</div>
          </div>
        </Card>
        <Card padding="p-4 md:p-5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-400 mb-1.5">Interés mensual</p>
              <p className="text-xl md:text-2xl font-bold text-money text-orange-500 truncate">{formatCurrency(totalMonthlyInterest, user?.currency)}</p>
              <p className="text-[11px] text-slate-400 mt-1">Costo de tener deudas</p>
            </div>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-base" style={{ background: 'rgba(249,115,22,0.08)' }}>📈</div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      {debts.length > 0 && (
        <div className="flex gap-1 bg-slate-100 dark:bg-dark-850 rounded-xl p-1">
          {[
            { key: 'debts', label: 'Mis deudas' },
            { key: 'plan', label: 'Plan óptimo' },
            { key: 'compare', label: 'Comparar estrategias' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-2 px-3 rounded-lg text-xs md:text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? 'bg-white dark:bg-dark-800 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Tab: Mis deudas */}
      {(activeTab === 'debts' || debts.length === 0) && (
        <>
          {debts.length === 0 ? (
            <Card>
              <EmptyState
                icon="🏦"
                title="Sin deudas registradas"
                description="Registra tus deudas para ver estrategias de pago inteligentes y recomendaciones de negociación"
                action={openCreate}
                actionLabel="Agregar deuda"
              />
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {debts.map((debt, idx) => {
                const progress = debt.totalAmount > 0 ? ((debt.totalAmount - debt.currentBalance) / debt.totalAmount) * 100 : 0;
                const catInfo  = CAT_MAP[debt.debtCategory] || { label: 'Otro', icon: '📂' };
                const risk     = debt.recommendation?.risk || debt.riskLevel;
                const riskCfg  = RISK_CONFIG[risk] || RISK_CONFIG.LOW;

                return (
                  <Card key={debt.id} className="animate-scale-in" style={{ animationDelay: `${idx * 50}ms` }}>
                    {/* Encabezado */}
                    <div className="flex items-start justify-between mb-3 gap-2">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <span className="text-2xl flex-shrink-0 mt-0.5">{catInfo.icon}</span>
                        <div className="min-w-0">
                          <h4 className="font-semibold text-slate-900 dark:text-white text-sm truncate">{debt.name}</h4>
                          <p className="text-xs text-slate-400">{debt.entity} · {catInfo.label}</p>
                        </div>
                      </div>
                      <div className={`flex-shrink-0 text-xs font-medium px-2 py-0.5 rounded-lg border ${riskCfg.color}`}>
                        {riskCfg.label}
                      </div>
                    </div>

                    {/* Info grid */}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-3 text-sm">
                      <div>
                        <p className="text-xs text-slate-400">Saldo pendiente</p>
                        <p className="font-bold text-amber-500">{formatCurrency(debt.currentBalance, user?.currency)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">
                          Tasa {debt.interestPeriod === 'MONTHLY' ? 'mensual → anual' : 'anual EA'}
                        </p>
                        <p className="font-bold text-orange-500">
                          {formatPercent(debt.recommendation?.annualRate ?? Number(debt.interestRate) * 100)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Cuota mínima</p>
                        <p className="font-semibold text-slate-700 dark:text-slate-200">{formatCurrency(debt.minimumPayment, user?.currency)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Interés mensual</p>
                        <p className="font-semibold text-red-400">{formatCurrency(debt.monthlyInterest || 0, user?.currency)}</p>
                      </div>
                    </div>

                    {/* Tiempo estimado — o alerta si la cuota no alcanza */}
                    {debt.payoff ? (
                      <p className="text-xs text-slate-400 mb-3">
                        Libre en <span className="text-slate-600 dark:text-slate-300 font-medium">{debt.payoff.years}a {debt.payoff.remainingMonths}m</span>
                        {' '} · Total real: <span className="text-red-400 font-medium">{formatCurrency(debt.payoff.totalPaid, user?.currency)}</span>
                      </p>
                    ) : debt.monthlyInterest > 0 && debt.minimumPayment <= debt.monthlyInterest ? (
                      <div className="rounded-xl p-2.5 mb-3 text-xs border border-red-500/30 bg-red-500/5 text-red-500 dark:text-red-400 leading-relaxed">
                        ⚠️ Tu cuota mínima ({formatCurrency(debt.minimumPayment, user?.currency)}) no cubre el interés mensual ({formatCurrency(debt.monthlyInterest, user?.currency)}): así la deuda <strong>crece</strong> cada mes en vez de bajar. Sube la cuota por encima del interés o renegocia la tasa.
                      </div>
                    ) : null}

                    {/* Progreso */}
                    <div className="mb-3">
                      <div className="flex justify-between text-xs text-slate-400 mb-1">
                        <span>Pagado</span><span>{progress.toFixed(0)}%</span>
                      </div>
                      <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary-500 to-emerald-500 rounded-full transition-all"
                          style={{ width: `${Math.min(100, progress)}%` }}
                        />
                      </div>
                    </div>

                    {/* Recomendación rápida */}
                    {debt.recommendation?.action && (
                      <div className={`rounded-xl p-2.5 mb-3 text-xs border ${riskCfg.color}`}>
                        <p className="font-medium mb-0.5">💡 {debt.recommendation.action.substring(0, 120)}{debt.recommendation.action.length > 120 ? '…' : ''}</p>
                      </div>
                    )}

                    {/* Acciones */}
                    <div className="flex gap-2">
                      <Button size="sm" variant="primary" className="flex-1" onClick={() => { setSelectedDebt(debt); setPaymentForm(PAYMENT_FORM); setPaymentModal(true); }}>
                        Pagar
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => openDetail(debt)}>
                        Detalle
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => openEdit(debt)}>
                        Editar
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(debt.id)} className="text-red-400 hover:text-red-500">×</Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Tab: Plan óptimo */}
      {activeTab === 'plan' && (
        <div className="space-y-3">
          <Card className="p-4">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-1">🧠 Plan de pago inteligente</h3>
            <p className="text-xs text-slate-400">Orden óptimo para pagar tus deudas según categoría e interés. Aplica el método "bola de nieve inteligente".</p>
          </Card>
          {optimalPlan.map((item, idx) => {
            const catInfo = CAT_MAP[item.debtCategory] || { icon: '📂', label: 'Otro' };
            return (
              <Card key={item.id} className={idx === 0 ? 'border-primary-500/30 bg-primary-500/5' : ''}>
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${idx === 0 ? 'bg-primary-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white text-sm">{catInfo.icon} {item.name}</p>
                        <p className="text-xs text-slate-400">{item.entity} · {catInfo.label}</p>
                      </div>
                      {item.isPriority && <Badge color="primary">Prioridad</Badge>}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs mt-2">
                      <div>
                        <p className="text-slate-400">Saldo</p>
                        <p className="font-medium text-amber-500">{formatCurrency(item.currentBalance, user?.currency)}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Tasa anual</p>
                        <p className="font-medium text-orange-400">{formatPercent(item.annualRate)}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Pago recomendado</p>
                        <p className="font-bold text-primary-400">{formatCurrency(item.recommendedPayment, user?.currency)}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Tiempo libre</p>
                        <p className="font-medium text-emerald-400">
                          {item.payoff ? `${item.payoff.years}a ${item.payoff.remainingMonths}m` : 'N/D'}
                        </p>
                      </div>
                    </div>
                    {item.recommendation?.negotiation && (
                      <p className="text-xs text-slate-400 mt-2 italic">💬 {item.recommendation.negotiation}</p>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Tab: Comparar estrategias */}
      {activeTab === 'compare' && strategies?.comparison && (
        <div className="space-y-4">
          <Card className="p-4">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-1">⚖️ Comparación de estrategias</h3>
            <p className="text-xs text-slate-400">Compara cuánto tiempo y dinero gastarías en intereses según cada estrategia de pago.</p>
          </Card>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { key: 'smart',     label: '🧠 Inteligente',  desc: 'Prioriza por tipo de deuda y tasa.', color: 'primary', badge: 'Recomendado' },
              { key: 'avalanche', label: '🏔️ Avalanche',    desc: 'Primero la de mayor interés.', color: 'blue' },
              { key: 'snowball',  label: '❄️ Snowball',     desc: 'Primero la de menor saldo.', color: 'violet' },
            ].map((s) => {
              const data = strategies.comparison[s.key];
              return (
                <Card key={s.key} className={s.key === 'smart' ? 'border-primary-500/30 bg-primary-500/5' : ''}>
                  <div className="flex items-center gap-2 mb-3">
                    <p className="font-semibold text-slate-900 dark:text-white">{s.label}</p>
                    {s.badge && <Badge color="primary">{s.badge}</Badge>}
                  </div>
                  <p className="text-xs text-slate-400 mb-4">{s.desc}</p>
                  {data?.unpayable ? (
                    <div className="rounded-xl p-3 text-xs border border-red-500/30 bg-red-500/5 text-red-500 dark:text-red-400 leading-relaxed">
                      ⚠️ <strong>Con las cuotas actuales esta deuda nunca se termina de pagar:</strong> el pago mensual no alcanza a cubrir ni los intereses, así que el saldo crece cada mes. Sube la cuota mínima o renegocia la tasa para ver una proyección real.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs text-slate-400">Tiempo total</p>
                        <p className="text-lg font-bold text-slate-900 dark:text-white">
                          {Math.floor(data.months / 12)}a {data.months % 12}m
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Total en intereses</p>
                        <p className="text-base font-bold text-red-400">{formatCurrency(data.totalInterest, user?.currency)}</p>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal crear/editar deuda */}
      <Modal isOpen={modal} onClose={() => setModal(false)} title={editing ? 'Editar deuda' : 'Nueva deuda'} size="lg">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="input-label">Nombre de la deuda</label>
              <input required className="input-field" placeholder="Tarjeta Visa" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="input-label">Entidad</label>
              <input required className="input-field" placeholder="Bancolombia" value={form.entity} onChange={(e) => setForm({ ...form, entity: e.target.value })} />
            </div>
          </div>

          <div>
            <label className="input-label">Tipo de deuda</label>
            <select className="input-field" value={form.debtCategory} onChange={(e) => setForm({ ...form, debtCategory: e.target.value })}>
              {DEBT_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.icon} {c.label}</option>)}
            </select>
            {['INFORMAL', 'THIRD_PARTY_INTEREST'].includes(form.debtCategory) && (
              <p className="text-xs text-red-400 mt-1">⚠️ Este tipo de deuda suele tener tasas muy altas. Busca refinanciarla con un banco lo antes posible.</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="input-label">Deuda original</label>
              <input required type="number" min="0" step="any" className="input-field" placeholder="0" value={form.totalAmount} onChange={(e) => setForm({ ...form, totalAmount: e.target.value })} />
            </div>
            <div>
              <label className="input-label">Saldo actual</label>
              <input required type="number" min="0" step="any" className="input-field" placeholder="0" value={form.currentBalance} onChange={(e) => setForm({ ...form, currentBalance: e.target.value })} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="input-label">
                Tasa ({form.interestPeriod === 'MONTHLY' ? 'mensual' : 'anual'} %)
              </label>
              <input required type="number" min="0" max="500" step="0.01" className="input-field" placeholder={form.interestPeriod === 'MONTHLY' ? '3.5' : '27.99'} value={form.interestRate} onChange={(e) => setForm({ ...form, interestRate: e.target.value })} />
            </div>
            <div>
              <label className="input-label">Período tasa</label>
              <select className="input-field" value={form.interestPeriod} onChange={(e) => setForm({ ...form, interestPeriod: e.target.value })}>
                <option value="ANNUAL">Anual (EA)</option>
                <option value="MONTHLY">Mensual</option>
              </select>
            </div>
            <div>
              <label className="input-label">Tipo interés</label>
              <select className="input-field" value={form.interestType} onChange={(e) => setForm({ ...form, interestType: e.target.value })}>
                <option value="COMPOUND">Compuesto</option>
                <option value="SIMPLE">Simple</option>
              </select>
            </div>
          </div>

          {form.interestPeriod === 'MONTHLY' && form.interestRate && (
            <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400">
              ℹ️ {form.interestRate}% mensual = {(Math.pow(1 + parseFloat(form.interestRate || 0) / 100, 12) - 1).toFixed(1)}% anual EA
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="input-label">Cuota mínima</label>
              <input required type="number" min="0" step="any" className="input-field" placeholder="0" value={form.minimumPayment} onChange={(e) => setForm({ ...form, minimumPayment: e.target.value })} />
            </div>
            <div>
              <label className="input-label">Día de pago</label>
              <input required type="number" min="1" max="31" className="input-field" placeholder="15" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
            </div>
            <div>
              <label className="input-label">Fecha inicio</label>
              <input required type="date" className="input-field" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input type="checkbox" id="negotiable" checked={form.isNegotiable} onChange={(e) => setForm({ ...form, isNegotiable: e.target.checked })} className="rounded" />
            <label htmlFor="negotiable" className="text-sm text-slate-700 dark:text-slate-300">¿Esta deuda es negociable (tasa o plazo)?</label>
          </div>

          <div>
            <label className="input-label">Notas</label>
            <textarea className="input-field" rows={2} placeholder="Información adicional..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setModal(false)}>Cancelar</Button>
            <Button type="submit" className="flex-1" loading={saving}>Guardar</Button>
          </div>
        </form>
      </Modal>

      {/* Modal detalle / recomendaciones */}
      <Modal isOpen={detailModal} onClose={() => setDetailModal(false)} title={`Análisis: ${selectedDebt?.name}`} size="lg">
        {selectedDebt && (
          <div className="space-y-4">
            {/* Risk banner */}
            {selectedDebt.recommendation?.risk && (
              <div className={`rounded-xl p-3 border text-sm ${RISK_CONFIG[selectedDebt.recommendation.risk]?.color}`}>
                <p className="font-semibold mb-0.5">Nivel de riesgo: {RISK_CONFIG[selectedDebt.recommendation.risk]?.label}</p>
                <p className="text-xs opacity-80">Tasa anual equivalente: {selectedDebt.recommendation?.annualRate?.toFixed(2)}%</p>
              </div>
            )}

            {/* Acción recomendada */}
            {selectedDebt.recommendation?.action && (
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Acción recomendada</p>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-dark-850/50 border border-slate-100 dark:border-slate-700/30 text-sm text-slate-700 dark:text-slate-300">
                  {selectedDebt.recommendation.action}
                </div>
              </div>
            )}

            {/* Consejo de negociación */}
            {selectedDebt.recommendation?.negotiation && selectedDebt.isNegotiable && (
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Guía de negociación</p>
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-sm text-emerald-300">
                  🤝 {selectedDebt.recommendation.negotiation}
                </div>
              </div>
            )}

            {/* Tasa óptima */}
            {selectedDebt.recommendation?.optimalRate !== null && selectedDebt.recommendation?.optimalRate !== undefined && (
              <div className="p-3 rounded-xl bg-primary-500/10 border border-primary-500/20">
                <p className="text-xs text-primary-400 font-semibold mb-0.5">Tasa de interés óptima objetivo</p>
                <p className="text-2xl font-bold text-primary-300">{selectedDebt.recommendation.optimalRate}% anual</p>
                {selectedDebt.recommendation.optimalRate < (selectedDebt.recommendation?.annualRate || 0) && (
                  <p className="text-xs text-slate-400 mt-1">
                    Ahorrarías {((selectedDebt.recommendation.annualRate || 0) - selectedDebt.recommendation.optimalRate).toFixed(1)} puntos porcentuales si negocias esta tasa.
                  </p>
                )}
              </div>
            )}

            {/* Historial de pagos */}
            {selectedDebt.payments?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Últimos pagos</p>
                <div className="space-y-1.5">
                  {selectedDebt.payments.slice(0, 5).map((p) => (
                    <div key={p.id} className="flex justify-between text-xs py-1.5 border-b border-slate-100 dark:border-slate-700/30">
                      <span className="text-slate-400">{formatDate(p.date)}</span>
                      <span className="font-medium text-emerald-400">+{formatCurrency(p.amount, user?.currency)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button variant="secondary" className="w-full" onClick={() => { setDetailModal(false); setPaymentModal(true); }}>
              Registrar nuevo pago
            </Button>
          </div>
        )}
      </Modal>

      {/* Modal pago */}
      <Modal isOpen={paymentModal} onClose={() => setPaymentModal(false)} title={`Pago: ${selectedDebt?.name}`} size="sm">
        <form onSubmit={handlePayment} className="space-y-4">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-dark-850/50 border border-slate-100 dark:border-slate-700/30 text-center">
            <p className="text-xs text-slate-400 mb-0.5">Saldo pendiente</p>
            <p className="text-xl font-bold text-amber-500">{formatCurrency(selectedDebt?.currentBalance, user?.currency)}</p>
            <p className="text-xs text-slate-400 mt-0.5">Cuota mínima: {formatCurrency(selectedDebt?.minimumPayment, user?.currency)}</p>
          </div>
          <div>
            <label className="input-label">Monto del pago</label>
            <input required type="number" min="0" step="any" className="input-field" placeholder="0" value={paymentForm.amount} onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })} />
          </div>
          <div>
            <label className="input-label">Fecha</label>
            <input required type="date" className="input-field" value={paymentForm.date} onChange={(e) => setPaymentForm({ ...paymentForm, date: e.target.value })} />
          </div>
          <div>
            <label className="input-label">Nota (opcional)</label>
            <input className="input-field" placeholder="Ej: Pago extra, abono" value={paymentForm.note} onChange={(e) => setPaymentForm({ ...paymentForm, note: e.target.value })} />
          </div>
          <div className="flex gap-3">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setPaymentModal(false)}>Cancelar</Button>
            <Button type="submit" className="flex-1" loading={saving}>Registrar pago</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
