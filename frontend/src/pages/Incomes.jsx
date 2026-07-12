import { useEffect, useState } from 'react';
import { incomesAPI, expensesAPI, walletsAPI } from '../services/api';
import { formatCurrency, formatDate, toInputDate } from '../utils/formatters';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { Sk, SkStatCard, SkTableRow, SkMobileRow } from '../components/ui/Skeleton';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';

const PAYMENT_METHOD_LABELS = { DIGITAL: { label: 'Digital', icon: '📱', color: 'primary' }, CASH: { label: 'Efectivo', icon: '💵', color: 'success' } };

const EMPTY_FORM = {
  description: '', amount: '', date: new Date().toISOString().split('T')[0],
  categoryId: '', isRecurring: false, frequency: '', tags: '',
  paymentMethod: 'DIGITAL', walletId: '',
};

export default function Incomes() {
  const [incomes, setIncomes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const { user } = useAuthStore();

  const load = async () => {
    try {
      const [incomesRes, catsRes, walletsRes] = await Promise.all([
        incomesAPI.getAll({ page, limit: 15, search }),
        expensesAPI.getCategories(),
        walletsAPI.getAll(),
      ]);
      setIncomes(incomesRes.data.data);
      setMeta(incomesRes.data.meta);
      setCategories(catsRes.data.filter((c) => ['INCOME', 'BOTH'].includes(c.type)));
      const wData = walletsRes.data;
      setWallets(wData.wallets || wData);
    } catch { toast.error('Error al cargar ingresos'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [page, search]);

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setModal(true); };
  const openEdit = (income) => {
    setEditing(income);
    setForm({ ...income, amount: String(income.amount), date: toInputDate(income.date), tags: income.tags?.join(', ') || '', paymentMethod: income.paymentMethod || 'DIGITAL', walletId: income.walletId || '' });
    setModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, amount: parseFloat(form.amount), tags: form.tags ? form.tags.split(',').map((t) => t.trim()) : [] };
      if (editing) { await incomesAPI.update(editing.id, payload); toast.success('Ingreso actualizado'); }
      else { await incomesAPI.create(payload); toast.success('Ingreso registrado'); }
      setModal(false); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Error al guardar'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este ingreso?')) return;
    try { await incomesAPI.remove(id); toast.success('Eliminado'); load(); }
    catch { toast.error('Error al eliminar'); }
  };

  const total = incomes.reduce((s, i) => s + i.amount, 0);

  if (loading) return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex gap-2">
        <Sk className="h-10 flex-1 !rounded-xl" />
        <Sk className="h-10 w-24 !rounded-xl" />
      </div>
      <div className="grid grid-cols-3 gap-3">{[0,1,2].map(i => <SkStatCard key={i} />)}</div>
      <div className="card p-0 overflow-hidden hidden md:block">
        {[0,1,2,3,4,5].map(i => <div key={i} style={{ opacity: 1 - i * 0.12 }}><SkTableRow cols={6} /></div>)}
      </div>
      <div className="md:hidden space-y-2">
        {[0,1,2,3].map(i => <div key={i} style={{ opacity: 1 - i * 0.18 }}><SkMobileRow /></div>)}
      </div>
    </div>
  );

  return (
    <div className="space-y-4 animate-fade-in">

      {/* Barra de acciones */}
      <div className="flex gap-2">
        <input
          className="input-field flex-1 min-w-0"
          placeholder="Buscar ingresos..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
        <Button onClick={openCreate} icon="+" variant="primary" size="sm" className="flex-shrink-0">
          <span className="hidden sm:inline">Nuevo</span>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card padding="p-4 md:p-5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-400 mb-1.5">Total ingresos</p>
              <p className="text-xl md:text-2xl font-bold text-money text-emerald-500 truncate">{formatCurrency(total, user?.currency)}</p>
            </div>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-base" style={{ background: 'rgba(16,185,129,0.08)' }}>💰</div>
          </div>
        </Card>
        <Card padding="p-4 md:p-5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-400 mb-1.5">Registros</p>
              <p className="text-xl md:text-2xl font-bold text-money text-slate-900 dark:text-white">{meta.total || 0}</p>
            </div>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-base" style={{ background: 'rgba(100,116,139,0.08)' }}>📋</div>
          </div>
        </Card>
        <Card padding="p-4 md:p-5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-400 mb-1.5">Promedio</p>
              <p className="text-xl md:text-2xl font-bold text-money text-slate-900 dark:text-white truncate">
                {incomes.length ? formatCurrency(total / incomes.length, user?.currency) : '—'}
              </p>
            </div>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-base" style={{ background: 'rgba(16,185,129,0.08)' }}>📈</div>
          </div>
        </Card>
      </div>

      {incomes.length === 0 ? (
        <Card>
          <EmptyState icon="💰" title="Sin ingresos" description="Registra tu primer ingreso" action={openCreate} actionLabel="Agregar" />
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
                      <th key={h} className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-[0.06em] text-slate-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/30">
                  {incomes.map((income, idx) => (
                    <tr key={income.id} className="hover:bg-slate-50 dark:hover:bg-dark-850/50 transition-colors animate-fade-in" style={{ animationDelay: `${idx * 30}ms` }}>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-slate-900 dark:text-white">{income.description}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {income.category?.icon} {income.category?.name || '-'}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400">{formatDate(income.date)}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          {income.isRecurring && <Badge color="primary">Recurrente</Badge>}
                          {income.paymentMethod && (
                            <Badge color={income.paymentMethod === 'DIGITAL' ? 'info' : 'success'}>
                              {PAYMENT_METHOD_LABELS[income.paymentMethod]?.icon} {PAYMENT_METHOD_LABELS[income.paymentMethod]?.label}
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-semibold text-emerald-500">+{formatCurrency(income.amount, user?.currency)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button onClick={() => openEdit(income)} className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors text-slate-300 hover:text-primary-500 hover:bg-primary-50" title="Editar">
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M8.5 1L11 3.5L3.5 11H1V8.5L8.5 1Z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          </button>
                          <button onClick={() => handleDelete(income.id)} className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors text-slate-300 hover:text-red-500 hover:bg-red-50" title="Eliminar">
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1.5 3H10.5M4 3V2C4 1.6 4.3 1 5 1H7C7.7 1 8 1.6 8 2V3M5 5.5V9M7 5.5V9M2.5 3L3 10.5H9L9.5 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          </button>
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
            {incomes.map((income, idx) => (
              <Card key={income.id} className="p-4 animate-fade-in" style={{ animationDelay: `${idx * 40}ms` }}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{income.description}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {income.category?.icon} {income.category?.name || 'Sin categoría'} · {formatDate(income.date)}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {income.isRecurring && <Badge color="primary">Recurrente</Badge>}
                      {income.paymentMethod && (
                        <Badge color={income.paymentMethod === 'DIGITAL' ? 'info' : 'success'}>
                          {PAYMENT_METHOD_LABELS[income.paymentMethod]?.icon} {PAYMENT_METHOD_LABELS[income.paymentMethod]?.label}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-base font-bold text-emerald-500">+{formatCurrency(income.amount, user?.currency)}</p>
                    <div className="flex gap-1 mt-1 justify-end">
                      <button onClick={() => openEdit(income)} className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors text-slate-300 hover:text-primary-500 hover:bg-primary-50" title="Editar">
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M8.5 1L11 3.5L3.5 11H1V8.5L8.5 1Z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </button>
                      <button onClick={() => handleDelete(income.id)} className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors text-slate-300 hover:text-red-500 hover:bg-red-50" title="Eliminar">
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1.5 3H10.5M4 3V2C4 1.6 4.3 1 5 1H7C7.7 1 8 1.6 8 2V3M5 5.5V9M7 5.5V9M2.5 3L3 10.5H9L9.5 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </button>
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
      <Modal isOpen={modal} onClose={() => setModal(false)} title={editing ? 'Editar ingreso' : 'Nuevo ingreso'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="input-label">Descripción</label>
            <input required className="input-field" placeholder="Ej: Salario mensual" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="input-label">Monto</label>
              <input required type="number" min="0" step="any" className="input-field" placeholder="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            </div>
            <div>
              <label className="input-label">Fecha</label>
              <input required type="date" className="input-field" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="input-label">Categoría</label>
              <select className="input-field" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
                <option value="">Sin categoría</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="input-label">Método de pago</label>
              <select className="input-field" value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}>
                <option value="DIGITAL">📱 Digital</option>
                <option value="CASH">💵 Efectivo</option>
              </select>
            </div>
          </div>
          {wallets.length > 0 && (
            <div>
              <label className="input-label">Billetera de destino (opcional)</label>
              <select className="input-field" value={form.walletId} onChange={(e) => setForm({ ...form, walletId: e.target.value })}>
                <option value="">Sin billetera asociada</option>
                {wallets.map((w) => <option key={w.id} value={w.id}>{w.icon} {w.name}</option>)}
              </select>
            </div>
          )}
          <div className="flex items-center gap-3">
            <input type="checkbox" id="recurring" checked={form.isRecurring} onChange={(e) => setForm({ ...form, isRecurring: e.target.checked })} className="rounded" />
            <label htmlFor="recurring" className="text-sm text-slate-700 dark:text-slate-300">Ingreso recurrente</label>
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
            <label className="input-label">Etiquetas (separadas por coma)</label>
            <input className="input-field" placeholder="trabajo, extra, bono" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
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
