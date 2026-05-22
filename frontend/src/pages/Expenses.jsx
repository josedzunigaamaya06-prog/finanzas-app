import { useEffect, useState } from 'react';
import { expensesAPI, walletsAPI } from '../services/api';
import { formatCurrency, formatDate, toInputDate } from '../utils/formatters';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';

const PAYMENT_METHOD_LABELS = { DIGITAL: { label: 'Digital', icon: '📱', color: 'info' }, CASH: { label: 'Efectivo', icon: '💵', color: 'success' } };

const EMPTY_FORM = {
  description: '', amount: '', date: new Date().toISOString().split('T')[0],
  categoryId: '', type: 'VARIABLE', isRecurring: false, frequency: '', tags: '',
  paymentMethod: 'DIGITAL', walletId: '',
};

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ search: '', categoryId: '', type: '' });
  const { user } = useAuthStore();

  const load = async () => {
    try {
      const [expRes, catsRes, walletsRes] = await Promise.all([
        expensesAPI.getAll({ page, limit: 15, ...filters }),
        expensesAPI.getCategories(),
        walletsAPI.getAll(),
      ]);
      setExpenses(expRes.data.data);
      setMeta(expRes.data.meta);
      setCategories(catsRes.data);
      const wData = walletsRes.data;
      setWallets(wData.wallets || wData);
    } catch { toast.error('Error al cargar gastos'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [page, filters]);

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setModal(true); };
  const openEdit = (expense) => {
    setEditing(expense);
    setForm({ ...expense, amount: String(expense.amount), date: toInputDate(expense.date), tags: expense.tags?.join(', ') || '', paymentMethod: expense.paymentMethod || 'DIGITAL', walletId: expense.walletId || '' });
    setModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, amount: parseFloat(form.amount), tags: form.tags ? form.tags.split(',').map((t) => t.trim()) : [] };
      if (editing) { await expensesAPI.update(editing.id, payload); toast.success('Gasto actualizado'); }
      else { await expensesAPI.create(payload); toast.success('Gasto registrado'); }
      setModal(false); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Error al guardar'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este gasto?')) return;
    try { await expensesAPI.remove(id); toast.success('Eliminado'); load(); }
    catch { toast.error('Error al eliminar'); }
  };

  const total = expenses.reduce((s, e) => s + e.amount, 0);

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="space-y-4 animate-fade-in">

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          className="input-field flex-1"
          placeholder="Buscar gastos..."
          value={filters.search}
          onChange={(e) => { setFilters({ ...filters, search: e.target.value }); setPage(1); }}
        />
        <div className="flex gap-2">
          <select
            className="input-field flex-1 sm:w-auto"
            value={filters.categoryId}
            onChange={(e) => { setFilters({ ...filters, categoryId: e.target.value }); setPage(1); }}
          >
            <option value="">Todas</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
          </select>
          <select
            className="input-field w-28"
            value={filters.type}
            onChange={(e) => { setFilters({ ...filters, type: e.target.value }); setPage(1); }}
          >
            <option value="">Tipo</option>
            <option value="FIXED">Fijo</option>
            <option value="VARIABLE">Variable</option>
          </select>
          <Button onClick={openCreate} icon="+" variant="primary" size="sm" className="flex-shrink-0">
            <span className="hidden sm:inline">Nuevo</span>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="text-center p-3 md:p-6">
          <p className="text-xs text-slate-400 mb-1">Total</p>
          <p className="text-base md:text-2xl font-bold text-red-500 truncate">{formatCurrency(total, user?.currency)}</p>
        </Card>
        <Card className="text-center p-3 md:p-6">
          <p className="text-xs text-slate-400 mb-1">Registros</p>
          <p className="text-base md:text-2xl font-bold text-slate-900 dark:text-white">{meta.total || 0}</p>
        </Card>
        <Card className="text-center p-3 md:p-6">
          <p className="text-xs text-slate-400 mb-1">Promedio</p>
          <p className="text-base md:text-2xl font-bold text-slate-900 dark:text-white truncate">
            {expenses.length ? formatCurrency(total / expenses.length, user?.currency) : '-'}
          </p>
        </Card>
      </div>

      {expenses.length === 0 ? (
        <Card>
          <EmptyState icon="🛍️" title="Sin gastos" description="Registra tu primer gasto" action={openCreate} actionLabel="Agregar" />
        </Card>
      ) : (
        <>
          {/* Vista escritorio: tabla */}
          <Card className="p-0 overflow-hidden hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700/50">
                    {['Descripción', 'Categoría', 'Fecha', 'Tipo', 'Monto', ''].map((h) => (
                      <th key={h} className="text-left text-xs font-medium text-slate-400 px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/30">
                  {expenses.map((expense) => (
                    <tr key={expense.id} className="hover:bg-slate-50 dark:hover:bg-dark-850/50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-slate-900 dark:text-white">{expense.description}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs" style={{ color: expense.category?.color }}>
                          {expense.category?.icon} {expense.category?.name || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400">{formatDate(expense.date)}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <Badge color={expense.type === 'FIXED' ? 'info' : 'default'}>
                            {expense.type === 'FIXED' ? 'Fijo' : 'Variable'}
                          </Badge>
                          {expense.paymentMethod && (
                            <Badge color={expense.paymentMethod === 'DIGITAL' ? 'primary' : 'success'}>
                              {PAYMENT_METHOD_LABELS[expense.paymentMethod]?.icon} {PAYMENT_METHOD_LABELS[expense.paymentMethod]?.label}
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-semibold text-red-500">-{formatCurrency(expense.amount, user?.currency)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button onClick={() => openEdit(expense)} className="text-xs text-slate-400 hover:text-primary-500 transition-colors">Editar</button>
                          <button onClick={() => handleDelete(expense.id)} className="text-xs text-slate-400 hover:text-red-500 transition-colors">Eliminar</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Vista móvil: tarjetas */}
          <div className="md:hidden space-y-2">
            {expenses.map((expense) => (
              <Card key={expense.id} className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0 mt-0.5"
                      style={{ backgroundColor: `${expense.category?.color}20`, color: expense.category?.color }}
                    >
                      {expense.category?.icon || '🛍️'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{expense.description}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {expense.category?.name || 'Sin categoría'} · {formatDate(expense.date)}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        <Badge color={expense.type === 'FIXED' ? 'info' : 'default'}>
                          {expense.type === 'FIXED' ? 'Fijo' : 'Variable'}
                        </Badge>
                        {expense.paymentMethod && (
                          <Badge color={expense.paymentMethod === 'DIGITAL' ? 'primary' : 'success'}>
                            {PAYMENT_METHOD_LABELS[expense.paymentMethod]?.icon} {PAYMENT_METHOD_LABELS[expense.paymentMethod]?.label}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-base font-bold text-red-500">-{formatCurrency(expense.amount, user?.currency)}</p>
                    <div className="flex gap-2 mt-1 justify-end">
                      <button onClick={() => openEdit(expense)} className="text-xs text-slate-400 hover:text-primary-500">Editar</button>
                      <button onClick={() => handleDelete(expense.id)} className="text-xs text-slate-400 hover:text-red-500">Eliminar</button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Paginación */}
      {meta.pages > 1 && (
        <div className="flex justify-center gap-2">
          <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Ant.</Button>
          <span className="flex items-center text-sm text-slate-400">{page} / {meta.pages}</span>
          <Button variant="secondary" size="sm" disabled={page === meta.pages} onClick={() => setPage(p => p + 1)}>Sig. →</Button>
        </div>
      )}

      {/* Modal */}
      <Modal isOpen={modal} onClose={() => setModal(false)} title={editing ? 'Editar gasto' : 'Nuevo gasto'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Descripción</label>
            <input required className="input-field" placeholder="Ej: Supermercado" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Monto</label>
              <input required type="number" min="0" step="any" className="input-field" placeholder="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Fecha</label>
              <input required type="date" className="input-field" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Categoría</label>
              <select className="input-field" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
                <option value="">Sin categoría</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Tipo</label>
              <select className="input-field" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="VARIABLE">Variable</option>
                <option value="FIXED">Fijo</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Método de pago</label>
              <select className="input-field" value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}>
                <option value="DIGITAL">📱 Digital</option>
                <option value="CASH">💵 Efectivo</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Billetera (opcional)</label>
              <select className="input-field" value={form.walletId} onChange={(e) => setForm({ ...form, walletId: e.target.value })}>
                <option value="">Sin billetera</option>
                {wallets.map((w) => <option key={w.id} value={w.id}>{w.icon} {w.name}</option>)}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <input type="checkbox" id="recExp" checked={form.isRecurring} onChange={(e) => setForm({ ...form, isRecurring: e.target.checked })} className="rounded" />
            <label htmlFor="recExp" className="text-sm text-slate-700 dark:text-slate-300">Gasto recurrente</label>
          </div>
          {form.isRecurring && (
            <select className="input-field" value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })}>
              <option value="MONTHLY">Mensual</option>
              <option value="BIWEEKLY">Quincenal</option>
              <option value="WEEKLY">Semanal</option>
              <option value="ANNUALLY">Anual</option>
            </select>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Etiquetas</label>
            <input className="input-field" placeholder="comida, salida, urgente" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
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
