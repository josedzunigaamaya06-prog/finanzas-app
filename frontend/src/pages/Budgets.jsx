import { useEffect, useState } from 'react';
import { budgetsAPI, expensesAPI } from '../services/api';
import { formatCurrency, formatPercent, getMonthName } from '../utils/formatters';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';

export default function Budgets() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ categoryId: '', amount: '' });
  const [saving, setSaving] = useState(false);
  const { user } = useAuthStore();

  const load = async () => {
    try {
      const [budgetsRes, catsRes] = await Promise.all([
        budgetsAPI.getAll({ month, year }),
        expensesAPI.getCategories(),
      ]);
      setBudgets(budgetsRes.data);
      setCategories(catsRes.data.filter((c) => c.type === 'EXPENSE' || c.type === 'BOTH'));
    } catch { toast.error('Error al cargar presupuestos'); }
    finally { setLoading(false); }
  };

  useEffect(() => { setLoading(true); load(); }, [month, year]);

  const openCreate = () => { setEditing(null); setForm({ categoryId: '', amount: '' }); setModal(true); };
  const openEdit = (b) => { setEditing(b); setForm({ categoryId: b.categoryId, amount: String(b.amount) }); setModal(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, amount: parseFloat(form.amount), month, year };
      if (editing) { await budgetsAPI.update(editing.id, { amount: payload.amount }); toast.success('Presupuesto actualizado'); }
      else { await budgetsAPI.create(payload); toast.success('Presupuesto creado'); }
      setModal(false); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este presupuesto?')) return;
    try { await budgetsAPI.remove(id); toast.success('Eliminado'); load(); }
    catch { toast.error('Error al eliminar'); }
  };

  const totalBudget = budgets.reduce((s, b) => s + b.amount, 0);
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);
  const overBudget = budgets.filter((b) => b.percentage > 100).length;

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <select className="input-field w-auto" value={month} onChange={(e) => setMonth(parseInt(e.target.value))}>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>{getMonthName(m)}</option>
            ))}
          </select>
          <select className="input-field w-auto" value={year} onChange={(e) => setYear(parseInt(e.target.value))}>
            {[year - 1, year, year + 1].map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <Button onClick={openCreate} icon="+" variant="primary">Nuevo presupuesto</Button>
      </div>

      {budgets.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <Card className="text-center">
            <p className="text-xs text-slate-400 mb-1">Presupuesto total</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(totalBudget, user?.currency)}</p>
          </Card>
          <Card className="text-center">
            <p className="text-xs text-slate-400 mb-1">Gastado</p>
            <p className={`text-2xl font-bold ${totalSpent > totalBudget ? 'text-red-500' : 'text-emerald-500'}`}>{formatCurrency(totalSpent, user?.currency)}</p>
          </Card>
          <Card className="text-center">
            <p className="text-xs text-slate-400 mb-1">Categorías excedidas</p>
            <p className={`text-2xl font-bold ${overBudget > 0 ? 'text-red-500' : 'text-emerald-500'}`}>{overBudget}</p>
          </Card>
        </div>
      )}

      {budgets.length === 0 ? (
        <Card>
          <EmptyState icon="📊" title="Sin presupuestos" description={`Crea presupuestos para ${getMonthName(month)} ${year}`} action={openCreate} actionLabel="Crear presupuesto" />
        </Card>
      ) : (
        <div className="space-y-3">
          {budgets.map((budget) => {
            const pct = Math.min(budget.percentage, 100);
            const isOver = budget.percentage > 100;
            const isWarning = budget.percentage > 80 && !isOver;
            const barColor = isOver ? '#ef4444' : isWarning ? '#f59e0b' : '#10b981';

            return (
              <Card key={budget.id} className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0" style={{ backgroundColor: `${budget.category?.color}20` }}>
                    {budget.category?.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-900 dark:text-white">{budget.category?.name}</span>
                        {isOver && <Badge color="danger">Excedido</Badge>}
                        {isWarning && <Badge color="warning">Casi lleno</Badge>}
                      </div>
                      <span className="text-xs text-slate-400">
                        {formatCurrency(budget.spent, user?.currency)} / {formatCurrency(budget.amount, user?.currency)}
                      </span>
                    </div>
                    <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: barColor }} />
                    </div>
                    <div className="flex justify-between text-xs text-slate-400 mt-1">
                      <span>{formatPercent(budget.percentage)} usado</span>
                      <span>Disponible: {formatCurrency(Math.max(0, budget.remaining), user?.currency)}</span>
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => openEdit(budget)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-primary-500 text-xs transition-colors">✏️</button>
                    <button onClick={() => handleDelete(budget.id)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 text-xs transition-colors">×</button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal isOpen={modal} onClose={() => setModal(false)} title={editing ? 'Editar presupuesto' : 'Nuevo presupuesto'} size="sm">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Categoría</label>
            <select required className="input-field" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} disabled={!!editing}>
              <option value="">Selecciona una categoría</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Monto del presupuesto</label>
            <input required type="number" min="0" step="any" className="input-field" placeholder="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setModal(false)}>Cancelar</Button>
            <Button type="submit" className="flex-1" loading={saving}>Guardar</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
