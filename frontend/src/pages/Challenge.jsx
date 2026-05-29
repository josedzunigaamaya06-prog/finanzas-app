import { useState, useEffect } from 'react';
import { challengesAPI } from '../services/api';
import Card from '../components/ui/Card';
import useAuthStore from '../store/authStore';
import { formatCurrency } from '../utils/formatters';
import toast from 'react-hot-toast';

const EMOJIS = ['🎯','💪','🚀','💰','🏆','🌟','🔥','💎','🎪','🎁'];
const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const now = new Date();

export default function Challenge() {
  const { user } = useAuthStore();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year,  setYear]  = useState(now.getFullYear());
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [progressModal, setProgressModal] = useState(null); // challenge
  const [progressAmount, setProgressAmount] = useState('');
  const [form, setForm] = useState({ title: '', description: '', targetAmount: '', emoji: '🎯' });

  const load = async () => {
    setLoading(true);
    try {
      const res = await challengesAPI.getAll({ month, year });
      setChallenges(res.data);
    } catch { toast.error('Error al cargar retos'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [month, year]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title || !form.targetAmount) return toast.error('Completa todos los campos');
    try {
      await challengesAPI.create({ ...form, month, year, targetAmount: parseFloat(form.targetAmount) });
      toast.success('¡Reto creado!');
      setShowForm(false);
      setForm({ title: '', description: '', targetAmount: '', emoji: '🎯' });
      load();
    } catch { toast.error('Error al crear reto'); }
  };

  const handleProgress = async () => {
    if (!progressAmount || isNaN(progressAmount) || +progressAmount <= 0) return toast.error('Ingresa un monto válido');
    try {
      const res = await challengesAPI.addProgress(progressModal.id, parseFloat(progressAmount));
      if (res.data.justCompleted) toast.success('🏆 ¡Reto completado! ¡Felicitaciones!');
      else toast.success('Progreso registrado');
      setProgressModal(null);
      setProgressAmount('');
      load();
    } catch { toast.error('Error al registrar progreso'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este reto?')) return;
    try { await challengesAPI.remove(id); toast.success('Reto eliminado'); load(); }
    catch { toast.error('Error al eliminar'); }
  };

  const YEARS = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1];

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">💪 Retos de ahorro</h1>
          <p className="text-sm text-slate-400 mt-0.5">Ponle metas divertidas a tu ahorro mensual</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 rounded-xl bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors"
        >
          + Nuevo reto
        </button>
      </div>

      {/* Selector de mes/año */}
      <div className="flex gap-2">
        <select className="input-field w-auto" value={month} onChange={(e) => setMonth(+e.target.value)}>
          {MONTHS_ES.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
        </select>
        <select className="input-field w-auto" value={year} onChange={(e) => setYear(+e.target.value)}>
          {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Formulario */}
      {showForm && (
        <Card className="p-4">
          <p className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Nuevo reto — {MONTHS_ES[month-1]} {year}</p>
          <form onSubmit={handleCreate} className="space-y-3">
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-xs font-medium text-slate-500 mb-1">Nombre del reto</label>
                <input className="input-field" placeholder="Ej: No gastar en restaurantes" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Emoji</label>
                <select className="input-field" value={form.emoji} onChange={(e) => setForm({ ...form, emoji: e.target.value })}>
                  {EMOJIS.map((em) => <option key={em} value={em}>{em}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Meta de ahorro ($)</label>
              <input type="number" className="input-field" placeholder="500000" value={form.targetAmount} onChange={(e) => setForm({ ...form, targetAmount: e.target.value })} required min="1" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Descripción (opcional)</label>
              <input className="input-field" placeholder="¿Por qué este reto?" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">Cancelar</button>
              <button type="submit" className="px-4 py-2 rounded-xl bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors">Crear reto</button>
            </div>
          </form>
        </Card>
      )}

      {/* Lista de retos */}
      {loading ? (
        <div className="text-center py-10 text-slate-400">Cargando...</div>
      ) : challenges.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-3xl mb-2">💪</p>
          <p className="text-slate-500 dark:text-slate-400 text-sm">No hay retos en {MONTHS_ES[month-1]} {year}</p>
          <p className="text-xs text-slate-400 mt-1">Crea un reto para ponerte a prueba este mes</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {challenges.map((c) => (
            <Card key={c.id} className="p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{c.emoji}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{c.title}</p>
                      {c.isCompleted && <span className="text-xs bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full font-medium">✓ Completado</span>}
                    </div>
                    {c.description && <p className="text-xs text-slate-400 mt-0.5">{c.description}</p>}
                  </div>
                </div>
                <button onClick={() => handleDelete(c.id)} className="text-slate-300 dark:text-slate-600 hover:text-red-400 transition-colors text-sm flex-shrink-0">✕</button>
              </div>

              {/* Barra de progreso */}
              <div className="space-y-1.5 mb-3">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>{formatCurrency(c.savedAmount, user?.currency)} ahorrado</span>
                  <span>Meta: {formatCurrency(c.targetAmount, user?.currency)}</span>
                </div>
                <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${c.isCompleted ? 'bg-emerald-500' : 'bg-primary-500'}`}
                    style={{ width: `${c.progress}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs">
                  <span className={`font-semibold ${c.isCompleted ? 'text-emerald-500' : 'text-primary-500'}`}>{Math.round(c.progress)}%</span>
                  <span className="text-slate-400">Faltan {formatCurrency(Math.max(0, c.targetAmount - c.savedAmount), user?.currency)}</span>
                </div>
              </div>

              {!c.isCompleted && (
                <button
                  onClick={() => { setProgressModal(c); setProgressAmount(''); }}
                  className="w-full py-2 rounded-xl border border-primary-500/30 text-primary-500 text-xs font-medium hover:bg-primary-500/10 transition-colors"
                >
                  + Registrar ahorro
                </button>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Modal de progreso */}
      {progressModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setProgressModal(null)} />
          <div className="relative bg-white dark:bg-dark-800 rounded-2xl p-5 w-full max-w-sm shadow-xl">
            <p className="text-base font-bold text-slate-900 dark:text-white mb-1">
              {progressModal.emoji} Registrar ahorro
            </p>
            <p className="text-xs text-slate-400 mb-4">{progressModal.title}</p>
            <label className="block text-xs font-medium text-slate-500 mb-1">Monto ahorrado ($)</label>
            <input
              type="number"
              className="input-field mb-4"
              placeholder="50000"
              value={progressAmount}
              onChange={(e) => setProgressAmount(e.target.value)}
              min="1"
              autoFocus
            />
            <div className="flex gap-2">
              <button onClick={() => setProgressModal(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">Cancelar</button>
              <button onClick={handleProgress} className="flex-1 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors">Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
