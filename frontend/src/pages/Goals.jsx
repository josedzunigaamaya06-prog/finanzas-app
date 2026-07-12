import { useEffect, useState } from 'react';
import { goalsAPI } from '../services/api';
import { formatCurrency, formatDate, toInputDate, formatPercent } from '../utils/formatters';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { SkStatCard, SkCard } from '../components/ui/Skeleton';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';

const ICONS = ['🎯', '✈️', '🏠', '🚗', '💻', '📚', '🛡️', '💰', '🎓', '🏖️', '💍', '🎮'];
const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

const EMPTY_FORM = { name: '', description: '', targetAmount: '', deadline: '', color: '#6366f1', icon: '🎯' };
const CONTRIB_FORM = { amount: '', date: new Date().toISOString().split('T')[0], note: '' };

export default function Goals() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [contribModal, setContribModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [contribForm, setContribForm] = useState(CONTRIB_FORM);
  const [saving, setSaving] = useState(false);
  const { user } = useAuthStore();

  const load = async () => {
    try { const r = await goalsAPI.getAll(); setGoals(r.data); }
    catch { toast.error('Error al cargar metas'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setModal(true); };
  const openEdit = (g) => {
    setEditing(g);
    setForm({ name: g.name, description: g.description || '', targetAmount: String(g.targetAmount), deadline: g.deadline ? toInputDate(g.deadline) : '', color: g.color || '#6366f1', icon: g.icon || '🎯' });
    setModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, targetAmount: parseFloat(form.targetAmount) };
      if (!payload.deadline) delete payload.deadline;
      if (editing) { await goalsAPI.update(editing.id, payload); toast.success('Meta actualizada'); }
      else { await goalsAPI.create(payload); toast.success('Meta creada'); }
      setModal(false); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar esta meta?')) return;
    try { await goalsAPI.remove(id); toast.success('Meta eliminada'); load(); }
    catch { toast.error('Error al eliminar'); }
  };

  const handleContrib = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await goalsAPI.addContribution(selectedGoal.id, { ...contribForm, amount: parseFloat(contribForm.amount) });
      toast.success('Contribución registrada');
      setContribModal(false); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const totalSaved = goals.reduce((s, g) => s + g.currentAmount, 0);
  const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0);

  if (loading) return (
    <div className="space-y-5 animate-fade-in">
      <div className="grid grid-cols-3 gap-3">{[0,1,2].map(i => <SkStatCard key={i} />)}</div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[0,1,2,3,4,5].map(i => <div key={i} style={{ opacity: 1 - i * 0.14 }}><SkCard /></div>)}
      </div>
    </div>
  );

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex justify-end">
        <Button onClick={openCreate} icon="+" variant="primary">Nueva meta</Button>
      </div>

      {goals.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <Card padding="p-4 md:p-5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-400 mb-1.5">Total ahorrado</p>
                <p className="text-xl md:text-2xl font-bold text-money text-emerald-500 truncate">{formatCurrency(totalSaved, user?.currency)}</p>
              </div>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-base" style={{ background: 'rgba(16,185,129,0.08)' }}>🏦</div>
            </div>
          </Card>
          <Card padding="p-4 md:p-5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-400 mb-1.5">Total objetivo</p>
                <p className="text-xl md:text-2xl font-bold text-money text-slate-900 dark:text-white truncate">{formatCurrency(totalTarget, user?.currency)}</p>
              </div>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-base" style={{ background: 'rgba(100,116,139,0.08)' }}>🎯</div>
            </div>
          </Card>
          <Card padding="p-4 md:p-5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-400 mb-1.5">Progreso global</p>
                <p className="text-xl md:text-2xl font-bold text-money text-primary-500">{totalTarget > 0 ? formatPercent((totalSaved / totalTarget) * 100) : '0%'}</p>
              </div>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-base" style={{ background: 'rgba(16,185,129,0.08)' }}>📊</div>
            </div>
          </Card>
        </div>
      )}

      {goals.length === 0 ? (
        <Card>
          <EmptyState icon="🎯" title="Sin metas definidas" description="Crea tu primera meta financiera y comienza a ahorrar hacia ella" action={openCreate} actionLabel="Crear meta" />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map((goal, idx) => (
            <div key={goal.id} className="card relative overflow-hidden p-0 animate-scale-in" style={{ animationDelay: `${idx * 50}ms` }}>
              {/* Banda de color superior */}
              <div className="h-1.5 w-full" style={{ backgroundColor: goal.color }} />
              <div className="p-5">
                {goal.isCompleted && (
                  <div className="absolute top-4 right-4">
                    <Badge color="success">Completada ✓</Badge>
                  </div>
                )}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl flex-shrink-0" style={{ backgroundColor: `${goal.color}18` }}>
                    {goal.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-slate-900 dark:text-white truncate text-[15px]">{goal.name}</h4>
                    {goal.description && <p className="text-xs text-slate-400 truncate mt-0.5">{goal.description}</p>}
                  </div>
                </div>

                <div className="mb-3">
                  <div className="flex justify-between items-baseline mb-1.5">
                    <span className="text-base font-bold text-money" style={{ color: goal.color }}>{formatCurrency(goal.currentAmount, user?.currency)}</span>
                    <span className="text-xs text-slate-400">de {formatCurrency(goal.targetAmount, user?.currency)}</span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-700/60 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, goal.progress)}%`, backgroundColor: goal.color }} />
                  </div>
                  <p className="text-[11px] font-semibold mt-1" style={{ color: goal.color }}>{formatPercent(goal.progress)} completado</p>
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-0.5 mb-4 text-xs text-slate-400">
                  {goal.deadline && (
                    <span>Límite: <span className="text-slate-600 dark:text-slate-300 font-medium">{formatDate(goal.deadline)}</span></span>
                  )}
                  {!goal.isCompleted && (
                    <span>Faltan: <span className="font-semibold" style={{ color: goal.color }}>{formatCurrency(goal.targetAmount - goal.currentAmount, user?.currency)}</span></span>
                  )}
                </div>

                <div className="flex gap-2">
                  {!goal.isCompleted && (
                    <Button size="sm" variant="primary" className="flex-1" onClick={() => { setSelectedGoal(goal); setContribForm(CONTRIB_FORM); setContribModal(true); }}>
                      + Contribuir
                    </Button>
                  )}
                  <button onClick={() => openEdit(goal)} className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors text-slate-300 hover:text-primary-500 hover:bg-primary-50 flex-shrink-0" title="Editar">
                    <svg width="13" height="13" viewBox="0 0 12 12" fill="none"><path d="M8.5 1L11 3.5L3.5 11H1V8.5L8.5 1Z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                  <button onClick={() => handleDelete(goal.id)} className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors text-slate-300 hover:text-red-500 hover:bg-red-50 flex-shrink-0" title="Eliminar">
                    <svg width="13" height="13" viewBox="0 0 12 12" fill="none"><path d="M1.5 3H10.5M4 3V2C4 1.6 4.3 1 5 1H7C7.7 1 8 1.6 8 2V3M5 5.5V9M7 5.5V9M2.5 3L3 10.5H9L9.5 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={modal} onClose={() => setModal(false)} title={editing ? 'Editar meta' : 'Nueva meta financiera'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="input-label">Nombre de la meta</label>
            <input required className="input-field" placeholder="Ej: Fondo de emergencia" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="input-label">Descripción (opcional)</label>
            <input className="input-field" placeholder="Describe tu meta" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="input-label">Monto objetivo</label>
              <input required type="number" min="0" step="any" className="input-field" placeholder="0" value={form.targetAmount} onChange={(e) => setForm({ ...form, targetAmount: e.target.value })} />
            </div>
            <div>
              <label className="input-label">Fecha límite</label>
              <input type="date" className="input-field" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="input-label" style={{ marginBottom: '0.5rem' }}>Ícono</label>
            <div className="flex flex-wrap gap-2">
              {ICONS.map((icon) => (
                <button type="button" key={icon} onClick={() => setForm({ ...form, icon })} className={`w-10 h-10 text-xl rounded-xl flex items-center justify-center transition-all ${form.icon === icon ? 'bg-primary-500/20 ring-2 ring-primary-500' : 'hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
                  {icon}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="input-label" style={{ marginBottom: '0.5rem' }}>Color</label>
            <div className="flex gap-2">
              {COLORS.map((color) => (
                <button type="button" key={color} onClick={() => setForm({ ...form, color })} className={`w-7 h-7 rounded-full transition-all ${form.color === color ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-dark-800 ring-current scale-110' : ''}`} style={{ backgroundColor: color }} />
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setModal(false)}>Cancelar</Button>
            <Button type="submit" className="flex-1" loading={saving}>Guardar</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={contribModal} onClose={() => setContribModal(false)} title={`Contribuir a: ${selectedGoal?.name}`} size="sm">
        <form onSubmit={handleContrib} className="space-y-4">
          <div>
            <label className="input-label">Monto</label>
            <input required type="number" min="0" step="any" className="input-field" placeholder="0" value={contribForm.amount} onChange={(e) => setContribForm({ ...contribForm, amount: e.target.value })} />
          </div>
          <div>
            <label className="input-label">Fecha</label>
            <input required type="date" className="input-field" value={contribForm.date} onChange={(e) => setContribForm({ ...contribForm, date: e.target.value })} />
          </div>
          <div>
            <label className="input-label">Nota</label>
            <input className="input-field" placeholder="Opcional" value={contribForm.note} onChange={(e) => setContribForm({ ...contribForm, note: e.target.value })} />
          </div>
          <div className="flex gap-3">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setContribModal(false)}>Cancelar</Button>
            <Button type="submit" className="flex-1" loading={saving}>Guardar</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
