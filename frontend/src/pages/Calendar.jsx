import { useState, useEffect } from 'react';
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval, getDay,
  addMonths, subMonths, isSameDay, isToday, differenceInDays, parseISO,
} from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { remindersAPI } from '../services/api';

// ─── Constantes ──────────────────────────────────────────────────────────────

const TYPE_OPTIONS = [
  { value: 'DEBT',         label: 'Deuda',        icon: '🏦' },
  { value: 'SUBSCRIPTION', label: 'Suscripción',  icon: '📱' },
  { value: 'LOAN',         label: 'Préstamo',     icon: '💳' },
  { value: 'SERVICE',      label: 'Servicio',     icon: '🔧' },
  { value: 'TAX',          label: 'Impuesto',     icon: '📋' },
  { value: 'CUSTOM',       label: 'Personalizado',icon: '📌' },
];

const FREQ_OPTIONS = [
  { value: 'DAILY',    label: 'Diario' },
  { value: 'WEEKLY',   label: 'Semanal' },
  { value: 'BIWEEKLY', label: 'Quincenal' },
  { value: 'MONTHLY',  label: 'Mensual' },
  { value: 'YEARLY',   label: 'Anual' },
];

const COLOR_OPTIONS = [
  '#6366f1','#8b5cf6','#ec4899','#ef4444',
  '#f59e0b','#10b981','#3b82f6','#64748b',
];

const TYPE_MAP = Object.fromEntries(TYPE_OPTIONS.map(t => [t.value, t]));

const DAYS_ES = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];

const formatCOP = (n) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

const EMPTY_FORM = {
  title: '', description: '', amount: '', dueDate: '', type: 'SUBSCRIPTION',
  isRecurring: false, frequency: 'MONTHLY', color: '#6366f1',
};

// ─── Componente principal ─────────────────────────────────────────────────────

export default function Calendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [reminders, setReminders]       = useState([]);
  const [loading, setLoading]           = useState(true);
  const [selectedDay, setSelectedDay]   = useState(null);
  const [showModal, setShowModal]       = useState(false);
  const [editItem, setEditItem]         = useState(null);
  const [form, setForm]                 = useState(EMPTY_FORM);
  const [saving, setSaving]             = useState(false);
  const [view, setView]                 = useState('month'); // 'month' | 'list'

  // Cargar recordatorios del mes actual
  const load = async (date = currentMonth) => {
    setLoading(true);
    try {
      const m = date.getMonth() + 1;
      const y = date.getFullYear();
      // Traer este mes y el siguiente para tener contexto
      const [r1, r2] = await Promise.all([
        remindersAPI.getAll({ month: m, year: y }),
        remindersAPI.getAll({ month: m === 12 ? 1 : m + 1, year: m === 12 ? y + 1 : y }),
      ]);
      setReminders([...(r1.data.data || []), ...(r2.data.data || [])]);
    } catch {
      toast.error('Error cargando recordatorios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(currentMonth); }, [currentMonth]);

  // ── Calendario ──────────────────────────────────────────────────────────────

  const monthStart = startOfMonth(currentMonth);
  const monthEnd   = endOfMonth(currentMonth);
  const days       = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPad   = getDay(monthStart); // día de semana del 1 del mes (0=Dom)

  const remindersForDay = (day) =>
    reminders.filter(r => isSameDay(parseISO(r.dueDate), day));

  // ── Formulario ──────────────────────────────────────────────────────────────

  const openNew = (day = null) => {
    setEditItem(null);
    setForm({
      ...EMPTY_FORM,
      dueDate: day ? format(day, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
    });
    setShowModal(true);
  };

  const openEdit = (r) => {
    setEditItem(r);
    setForm({
      title:       r.title,
      description: r.description || '',
      amount:      r.amount != null ? String(r.amount) : '',
      dueDate:     format(parseISO(r.dueDate), 'yyyy-MM-dd'),
      type:        r.type,
      isRecurring: r.isRecurring,
      frequency:   r.frequency || 'MONTHLY',
      color:       r.color || '#6366f1',
    });
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditItem(null); setForm(EMPTY_FORM); };

  const handleSave = async () => {
    if (!form.title.trim()) return toast.error('El título es requerido');
    if (!form.dueDate)       return toast.error('La fecha es requerida');

    setSaving(true);
    try {
      const payload = {
        title:       form.title.trim(),
        description: form.description.trim() || null,
        amount:      form.amount ? parseFloat(form.amount) : null,
        dueDate:     new Date(form.dueDate + 'T12:00:00').toISOString(),
        type:        form.type,
        isRecurring: form.isRecurring,
        frequency:   form.isRecurring ? form.frequency : null,
        color:       form.color,
      };

      if (editItem) {
        await remindersAPI.update(editItem.id, payload);
        toast.success('Recordatorio actualizado');
      } else {
        await remindersAPI.create(payload);
        toast.success('Recordatorio creado');
      }

      closeModal();
      await load(currentMonth);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este recordatorio?')) return;
    try {
      await remindersAPI.remove(id);
      toast.success('Eliminado');
      setSelectedDay(null);
      await load(currentMonth);
    } catch {
      toast.error('Error al eliminar');
    }
  };

  const handleMarkPaid = async (r) => {
    try {
      await remindersAPI.markPaid(r.id, !r.isPaid);
      toast.success(r.isPaid ? 'Marcado como pendiente' : '¡Pagado! ✅');
      await load(currentMonth);
      // Actualizar selectedDay
      if (selectedDay) {
        const updated = reminders.map(x => x.id === r.id ? { ...x, isPaid: !x.isPaid } : x);
        setReminders(updated);
      }
    } catch {
      toast.error('Error');
    }
  };

  // ── Vista lista: todos los recordatorios ordenados ──────────────────────────

  const monthReminders = reminders
    .filter(r => {
      const d = parseISO(r.dueDate);
      return d.getMonth() === currentMonth.getMonth() && d.getFullYear() === currentMonth.getFullYear();
    })
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

  const pending = monthReminders.filter(r => !r.isPaid);
  const paid    = monthReminders.filter(r => r.isPaid);
  const totalPending = pending.reduce((s, r) => s + (r.amount || 0), 0);

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="p-4 md:p-6 space-y-4 pb-20 md:pb-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            📅 Calendario de pagos
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Gestiona tus recordatorios y fechas de pago
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Toggle vista */}
          <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1 text-sm">
            <button
              onClick={() => setView('month')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${view === 'month' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'}`}
            >
              📅 Mes
            </button>
            <button
              onClick={() => setView('list')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${view === 'list' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'}`}
            >
              📋 Lista
            </button>
          </div>
          <button
            onClick={() => openNew()}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-xl transition-colors"
          >
            <span>+</span> Nuevo
          </button>
        </div>
      </div>

      {/* Resumen del mes */}
      {totalPending > 0 && (
        <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-2xl p-4 flex items-center gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-400">
              {pending.length} pago{pending.length !== 1 ? 's' : ''} pendiente{pending.length !== 1 ? 's' : ''} este mes
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5">
              Total: <strong>{formatCOP(totalPending)}</strong>
            </p>
          </div>
        </div>
      )}

      {/* Navegación de mes */}
      <div className="flex items-center justify-between bg-white dark:bg-dark-800 rounded-2xl px-4 py-3 border border-slate-100 dark:border-slate-700/50">
        <button
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors text-lg"
        >
          ‹
        </button>
        <h3 className="font-semibold text-slate-900 dark:text-white capitalize">
          {format(currentMonth, 'MMMM yyyy', { locale: es })}
        </h3>
        <button
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors text-lg"
        >
          ›
        </button>
      </div>

      {/* ── Vista mensual ── */}
      {view === 'month' && (
        <div className="bg-white dark:bg-dark-800 rounded-2xl border border-slate-100 dark:border-slate-700/50 overflow-hidden">
          {/* Cabecera días */}
          <div className="grid grid-cols-7 border-b border-slate-100 dark:border-slate-700/50">
            {DAYS_ES.map(d => (
              <div key={d} className="py-2 text-center text-xs font-semibold text-slate-400 dark:text-slate-500">
                {d}
              </div>
            ))}
          </div>

          {/* Días del mes */}
          <div className="grid grid-cols-7">
            {/* Padding inicial */}
            {Array.from({ length: startPad }).map((_, i) => (
              <div key={`pad-${i}`} className="h-16 md:h-20 border-b border-r border-slate-50 dark:border-slate-700/30" />
            ))}

            {days.map((day) => {
              const dayReminders = remindersForDay(day);
              const isSelected = selectedDay && isSameDay(day, selectedDay);
              const today = isToday(day);
              const hasOverdue = dayReminders.some(r => !r.isPaid && differenceInDays(day, new Date()) < 0);
              const hasToday = today && dayReminders.some(r => !r.isPaid);

              return (
                <div
                  key={day.toISOString()}
                  onClick={() => setSelectedDay(isSameDay(day, selectedDay) ? null : day)}
                  className={`
                    h-16 md:h-20 border-b border-r border-slate-50 dark:border-slate-700/30
                    p-1 cursor-pointer transition-colors relative
                    ${isSelected ? 'bg-primary-50 dark:bg-primary-500/10' : 'hover:bg-slate-50 dark:hover:bg-slate-700/20'}
                  `}
                >
                  <div className={`
                    w-6 h-6 flex items-center justify-center rounded-full text-xs font-semibold mb-1
                    ${today ? 'bg-primary-600 text-white' : 'text-slate-700 dark:text-slate-300'}
                  `}>
                    {format(day, 'd')}
                  </div>

                  {/* Dots de recordatorios */}
                  <div className="flex flex-wrap gap-0.5">
                    {dayReminders.slice(0, 3).map((r) => (
                      <div
                        key={r.id}
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${r.isPaid ? 'opacity-40' : ''}`}
                        style={{ backgroundColor: r.color || '#6366f1' }}
                        title={r.title}
                      />
                    ))}
                    {dayReminders.length > 3 && (
                      <span className="text-[9px] text-slate-400 leading-none">+{dayReminders.length - 3}</span>
                    )}
                  </div>

                  {(hasOverdue || hasToday) && (
                    <div className={`absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full ${hasOverdue ? 'bg-red-500' : 'bg-amber-500'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Panel de día seleccionado */}
      {view === 'month' && selectedDay && (
        <div className="bg-white dark:bg-dark-800 rounded-2xl border border-slate-100 dark:border-slate-700/50 p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-slate-900 dark:text-white capitalize">
              {format(selectedDay, "EEEE d 'de' MMMM", { locale: es })}
            </h4>
            <button
              onClick={() => openNew(selectedDay)}
              className="text-xs px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
            >
              + Agregar
            </button>
          </div>

          {remindersForDay(selectedDay).length === 0 ? (
            <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-4">
              Sin recordatorios para este día
            </p>
          ) : (
            <div className="space-y-2">
              {remindersForDay(selectedDay).map(r => (
                <ReminderCard
                  key={r.id}
                  reminder={r}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                  onTogglePaid={handleMarkPaid}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Vista lista ── */}
      {view === 'list' && (
        <div className="space-y-4">
          {/* Pendientes */}
          <div>
            <h4 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">
              Pendientes ({pending.length})
            </h4>
            {pending.length === 0 ? (
              <div className="bg-white dark:bg-dark-800 rounded-2xl border border-slate-100 dark:border-slate-700/50 p-6 text-center">
                <p className="text-2xl mb-1">🎉</p>
                <p className="text-sm text-slate-500">¡Sin pagos pendientes este mes!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {pending.map(r => (
                  <ReminderCard
                    key={r.id}
                    reminder={r}
                    onEdit={openEdit}
                    onDelete={handleDelete}
                    onTogglePaid={handleMarkPaid}
                    showDate
                  />
                ))}
              </div>
            )}
          </div>

          {/* Pagados */}
          {paid.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">
                Pagados ({paid.length})
              </h4>
              <div className="space-y-2">
                {paid.map(r => (
                  <ReminderCard
                    key={r.id}
                    reminder={r}
                    onEdit={openEdit}
                    onDelete={handleDelete}
                    onTogglePaid={handleMarkPaid}
                    showDate
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Modal crear/editar ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/50" onClick={closeModal} />
          <div className="relative w-full sm:max-w-lg bg-white dark:bg-dark-800 rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-dark-800 px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between z-10 rounded-t-3xl sm:rounded-t-2xl">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                {editItem ? 'Editar recordatorio' : 'Nuevo recordatorio'}
              </h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-2xl leading-none">✕</button>
            </div>

            <div className="p-5 space-y-4">
              {/* Tipo */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-2">Tipo</label>
                <div className="grid grid-cols-3 gap-2">
                  {TYPE_OPTIONS.map(t => (
                    <button
                      key={t.value}
                      onClick={() => setForm(f => ({ ...f, type: t.value }))}
                      className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 text-xs font-medium transition-colors ${
                        form.type === t.value
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-400'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                      }`}
                    >
                      <span className="text-xl">{t.icon}</span>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Título */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Título *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Ej: Netflix, Cuota préstamo..."
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                />
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Descripción (opcional)</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Notas adicionales..."
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                />
              </div>

              {/* Monto y Fecha */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Monto (opcional)</label>
                  <input
                    type="number"
                    value={form.amount}
                    onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                    placeholder="0"
                    min="0"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Fecha *</label>
                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>

              {/* Recurrente */}
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <input
                  type="checkbox"
                  id="recurring"
                  checked={form.isRecurring}
                  onChange={e => setForm(f => ({ ...f, isRecurring: e.target.checked }))}
                  className="w-4 h-4 accent-primary-600 rounded"
                />
                <label htmlFor="recurring" className="text-sm text-slate-700 dark:text-slate-300 font-medium cursor-pointer flex-1">
                  🔄 Recordatorio recurrente
                </label>
                {form.isRecurring && (
                  <select
                    value={form.frequency}
                    onChange={e => setForm(f => ({ ...f, frequency: e.target.value }))}
                    className="px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-primary-500 outline-none"
                  >
                    {FREQ_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Color */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-2">Color</label>
                <div className="flex gap-2 flex-wrap">
                  {COLOR_OPTIONS.map(c => (
                    <button
                      key={c}
                      onClick={() => setForm(f => ({ ...f, color: c }))}
                      className={`w-7 h-7 rounded-full transition-transform ${form.color === c ? 'scale-125 ring-2 ring-offset-2 ring-slate-400' : 'hover:scale-110'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white dark:bg-dark-800 px-5 py-4 border-t border-slate-100 dark:border-slate-700 flex gap-3">
              <button
                onClick={closeModal}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 px-4 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
              >
                {saving ? 'Guardando...' : editItem ? 'Actualizar' : 'Crear recordatorio'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tarjeta de recordatorio ──────────────────────────────────────────────────

function ReminderCard({ reminder: r, onEdit, onDelete, onTogglePaid, showDate = false }) {
  const days = differenceInDays(parseISO(r.dueDate), new Date());
  const urgency = r.isPaid ? null : days < 0 ? 'overdue' : days === 0 ? 'today' : days <= 2 ? 'soon' : 'ok';

  const urgencyBadge = {
    overdue: { label: `Venció hace ${Math.abs(days)}d`, cls: 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400' },
    today:   { label: '¡Vence hoy!',                    cls: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' },
    soon:    { label: `En ${days} día(s)`,               cls: 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400' },
    ok:      { label: `En ${days} días`,                 cls: 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400' },
  }[urgency] || null;

  const typeInfo = TYPE_MAP[r.type] || { icon: '📌', label: r.type };

  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
      r.isPaid
        ? 'bg-slate-50 dark:bg-slate-800/30 border-slate-100 dark:border-slate-700/30 opacity-60'
        : urgency === 'overdue'
          ? 'bg-red-50 dark:bg-red-500/5 border-red-100 dark:border-red-500/20'
          : urgency === 'today'
            ? 'bg-amber-50 dark:bg-amber-500/5 border-amber-100 dark:border-amber-500/20'
            : 'bg-white dark:bg-dark-800 border-slate-100 dark:border-slate-700/50'
    }`}>
      {/* Color indicator */}
      <div
        className="w-1 self-stretch rounded-full flex-shrink-0"
        style={{ backgroundColor: r.isPaid ? '#94a3b8' : (r.color || '#6366f1') }}
      />

      {/* Icon */}
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
        style={{ backgroundColor: (r.color || '#6366f1') + '20' }}
      >
        {typeInfo.icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold truncate ${r.isPaid ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white'}`}>
          {r.title}
        </p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {r.amount != null && (
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
              {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(r.amount)}
            </span>
          )}
          {showDate && (
            <span className="text-xs text-slate-400">
              {format(parseISO(r.dueDate), "d MMM", { locale: es })}
            </span>
          )}
          {urgencyBadge && (
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${urgencyBadge.cls}`}>
              {urgencyBadge.label}
            </span>
          )}
          {r.isRecurring && (
            <span className="text-[10px] text-slate-400">🔄 Recurrente</span>
          )}
          {r.isPaid && (
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400">
              ✅ Pagado
            </span>
          )}
        </div>
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={() => onTogglePaid(r)}
          className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors text-sm ${
            r.isPaid
              ? 'bg-slate-100 dark:bg-slate-700 text-slate-400 hover:bg-slate-200'
              : 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400 hover:bg-green-200'
          }`}
          title={r.isPaid ? 'Desmarcar' : 'Marcar como pagado'}
        >
          {r.isPaid ? '↩' : '✓'}
        </button>
        <button
          onClick={() => onEdit(r)}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors text-sm"
          title="Editar"
        >
          ✏️
        </button>
        <button
          onClick={() => onDelete(r.id)}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition-colors text-sm"
          title="Eliminar"
        >
          🗑️
        </button>
      </div>
    </div>
  );
}
