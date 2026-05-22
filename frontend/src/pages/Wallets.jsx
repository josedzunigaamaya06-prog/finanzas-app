import { useEffect, useState } from 'react';
import { walletsAPI } from '../services/api';
import { formatCurrency } from '../utils/formatters';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';

const WALLET_TYPES = [
  { value: 'SAVINGS_ACCOUNT', label: 'Cuenta de Ahorros', icon: '🏦' },
  { value: 'CHECKING_ACCOUNT', label: 'Cuenta Corriente', icon: '🏧' },
  { value: 'DIGITAL_WALLET', label: 'Billetera Digital', icon: '📱' },
  { value: 'CASH', label: 'Efectivo', icon: '💵' },
  { value: 'INVESTMENT', label: 'Inversión', icon: '📈' },
  { value: 'OTHER', label: 'Otro', icon: '💼' },
];

const WALLET_COLORS = [
  '#6366f1', '#8B5CF6', '#E31837', '#FFCD00', '#10B981',
  '#F59E0B', '#3B82F6', '#820AD1', '#EF4444', '#14B8A6',
];

const TYPE_LABELS = Object.fromEntries(WALLET_TYPES.map((t) => [t.value, t]));

const EMPTY_FORM = {
  name: '', type: 'DIGITAL_WALLET', balance: '0',
  color: '#6366f1', icon: '💳', description: '',
};

const ADJUST_FORM = { amount: '', type: 'add', note: '' };

export default function Wallets() {
  const [wallets, setWallets] = useState([]);
  const [summary, setSummary] = useState({ totalDigital: 0, totalCash: 0, totalOverall: 0 });
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [adjustModal, setAdjustModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [adjustForm, setAdjustForm] = useState(ADJUST_FORM);
  const [saving, setSaving] = useState(false);
  const { user } = useAuthStore();

  const load = async () => {
    try {
      const res = await walletsAPI.getAll();
      const data = res.data;
      setWallets(data.wallets || data);
      if (data.summary) setSummary(data.summary);
      else {
        // compute locally if backend returns flat array
        const ws = data.wallets || data;
        const totalDigital = ws.filter((w) => w.type !== 'CASH').reduce((s, w) => s + w.balance, 0);
        const totalCash    = ws.filter((w) => w.type === 'CASH').reduce((s, w) => s + w.balance, 0);
        setSummary({ totalDigital, totalCash, totalOverall: totalDigital + totalCash });
      }
    } catch { toast.error('Error al cargar billeteras'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setModal(true); };
  const openEdit = (w) => {
    setEditing(w);
    setForm({ name: w.name, type: w.type, balance: String(w.balance), color: w.color || '#6366f1', icon: w.icon || '💳', description: w.description || '' });
    setModal(true);
  };

  const openAdjust = (w) => { setSelectedWallet(w); setAdjustForm(ADJUST_FORM); setAdjustModal(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, balance: parseFloat(form.balance) || 0 };
      if (editing) { await walletsAPI.update(editing.id, payload); toast.success('Billetera actualizada'); }
      else { await walletsAPI.create(payload); toast.success('Billetera creada'); }
      setModal(false); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Error al guardar'); }
    finally { setSaving(false); }
  };

  const handleAdjust = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await walletsAPI.adjustBalance(selectedWallet.id, {
        amount: parseFloat(adjustForm.amount),
        type: adjustForm.type,
        note: adjustForm.note,
      });
      toast.success('Saldo actualizado');
      setAdjustModal(false); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar esta billetera?')) return;
    try { await walletsAPI.remove(id); toast.success('Eliminada'); load(); }
    catch { toast.error('Error al eliminar'); }
  };

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="space-y-4 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white">Mis Billeteras</h2>
          <p className="text-xs text-slate-400">Gestiona tu dinero digital y efectivo</p>
        </div>
        <Button onClick={openCreate} icon="+" variant="primary" size="sm">
          <span className="hidden sm:inline">Nueva billetera</span>
        </Button>
      </div>

      {/* Resumen total */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="text-center p-3 md:p-5">
          <div className="text-xl md:text-2xl mb-1">💰</div>
          <p className="text-xs text-slate-400 mb-1">Total general</p>
          <p className="text-sm md:text-xl font-bold text-slate-900 dark:text-white truncate">
            {formatCurrency(summary.totalOverall, user?.currency)}
          </p>
        </Card>
        <Card className="text-center p-3 md:p-5">
          <div className="text-xl md:text-2xl mb-1">📱</div>
          <p className="text-xs text-slate-400 mb-1">Digital</p>
          <p className="text-sm md:text-xl font-bold text-primary-500 truncate">
            {formatCurrency(summary.totalDigital, user?.currency)}
          </p>
        </Card>
        <Card className="text-center p-3 md:p-5">
          <div className="text-xl md:text-2xl mb-1">💵</div>
          <p className="text-xs text-slate-400 mb-1">Efectivo</p>
          <p className="text-sm md:text-xl font-bold text-emerald-500 truncate">
            {formatCurrency(summary.totalCash, user?.currency)}
          </p>
        </Card>
      </div>

      {/* Lista de billeteras */}
      {wallets.length === 0 ? (
        <Card>
          <EmptyState
            icon="👛"
            title="Sin billeteras registradas"
            description="Agrega tus cuentas bancarias, billeteras digitales (Nequi, Daviplata, Nu) y efectivo"
            action={openCreate}
            actionLabel="Agregar billetera"
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {wallets.map((wallet) => {
            const typeInfo = TYPE_LABELS[wallet.type] || { label: 'Otro', icon: '💼' };
            return (
              <Card key={wallet.id} className="relative overflow-hidden">
                {/* Stripe de color */}
                <div
                  className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
                  style={{ backgroundColor: wallet.color || '#6366f1' }}
                />
                <div className="pt-2">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                        style={{ backgroundColor: `${wallet.color || '#6366f1'}20` }}
                      >
                        {wallet.icon || typeInfo.icon}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 dark:text-white text-sm truncate">{wallet.name}</p>
                        <p className="text-xs text-slate-400">{typeInfo.label}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-xs text-slate-400 mb-0.5">Saldo disponible</p>
                    <p className="text-xl md:text-2xl font-bold" style={{ color: wallet.color || '#6366f1' }}>
                      {formatCurrency(wallet.balance, user?.currency)}
                    </p>
                  </div>

                  {wallet.description && (
                    <p className="text-xs text-slate-400 mb-3 truncate">{wallet.description}</p>
                  )}

                  <div className="flex gap-2">
                    <Button size="sm" variant="primary" className="flex-1" onClick={() => openAdjust(wallet)}>
                      Ajustar
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => openEdit(wallet)}>
                      Editar
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(wallet.id)} className="text-red-400 hover:text-red-500">
                      ×
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal crear/editar */}
      <Modal isOpen={modal} onClose={() => setModal(false)} title={editing ? 'Editar billetera' : 'Nueva billetera'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Nombre</label>
            <input
              required className="input-field"
              placeholder="Ej: Nequi, Daviplata, Efectivo..."
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Tipo</label>
              <select
                className="input-field"
                value={form.type}
                onChange={(e) => {
                  const t = WALLET_TYPES.find((x) => x.value === e.target.value);
                  setForm({ ...form, type: e.target.value, icon: t?.icon || '💳' });
                }}
              >
                {WALLET_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.icon} {t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                {editing ? 'Ícono' : 'Saldo inicial'}
              </label>
              {editing ? (
                <input
                  className="input-field"
                  placeholder="💳"
                  value={form.icon}
                  onChange={(e) => setForm({ ...form, icon: e.target.value })}
                />
              ) : (
                <input
                  type="number" min="0" step="any"
                  className="input-field" placeholder="0"
                  value={form.balance}
                  onChange={(e) => setForm({ ...form, balance: e.target.value })}
                />
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Color</label>
            <div className="flex gap-2 flex-wrap">
              {WALLET_COLORS.map((c) => (
                <button
                  key={c} type="button"
                  onClick={() => setForm({ ...form, color: c })}
                  className={`w-7 h-7 rounded-full border-2 transition-transform ${form.color === c ? 'border-white scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Descripción (opcional)</label>
            <input
              className="input-field"
              placeholder="Ej: Cuenta de ahorros principal"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setModal(false)}>Cancelar</Button>
            <Button type="submit" className="flex-1" loading={saving}>Guardar</Button>
          </div>
        </form>
      </Modal>

      {/* Modal ajustar saldo */}
      <Modal isOpen={adjustModal} onClose={() => setAdjustModal(false)} title={`Ajustar saldo: ${selectedWallet?.name}`} size="sm">
        <div className="mb-4 p-3 rounded-xl bg-slate-50 dark:bg-dark-850/50 border border-slate-100 dark:border-slate-700/30 text-center">
          <p className="text-xs text-slate-400 mb-0.5">Saldo actual</p>
          <p className="text-xl font-bold text-slate-900 dark:text-white">
            {formatCurrency(selectedWallet?.balance, user?.currency)}
          </p>
        </div>
        <form onSubmit={handleAdjust} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Tipo de ajuste</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'add', label: '+ Agregar', color: 'emerald' },
                { value: 'subtract', label: '− Restar', color: 'red' },
                { value: 'set', label: '= Fijar', color: 'blue' },
              ].map((opt) => (
                <button
                  key={opt.value} type="button"
                  onClick={() => setAdjustForm({ ...adjustForm, type: opt.value })}
                  className={`py-2 px-3 rounded-xl text-xs font-medium border transition-all ${
                    adjustForm.type === opt.value
                      ? `border-${opt.color}-500/50 bg-${opt.color}-500/10 text-${opt.color}-400`
                      : 'border-slate-200 dark:border-slate-700 text-slate-400 hover:border-slate-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              {adjustForm.type === 'set' ? 'Nuevo saldo' : 'Monto'}
            </label>
            <input
              required type="number" min="0" step="any"
              className="input-field" placeholder="0"
              value={adjustForm.amount}
              onChange={(e) => setAdjustForm({ ...adjustForm, amount: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Nota (opcional)</label>
            <input
              className="input-field" placeholder="Ej: Recarga Nequi"
              value={adjustForm.note}
              onChange={(e) => setAdjustForm({ ...adjustForm, note: e.target.value })}
            />
          </div>
          <div className="flex gap-3">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setAdjustModal(false)}>Cancelar</Button>
            <Button type="submit" className="flex-1" loading={saving}>Aplicar</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
