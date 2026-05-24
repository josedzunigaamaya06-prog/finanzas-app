import { useState, useEffect } from 'react';
import { autoRulesAPI, expensesAPI } from '../services/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import toast from 'react-hot-toast';

const CONDITION_LABELS = {
  contains:    { label: 'Contiene',        icon: '🔍' },
  starts_with: { label: 'Empieza con',     icon: '▶️' },
  ends_with:   { label: 'Termina con',     icon: '⏹️' },
  equals:      { label: 'Es exactamente',  icon: '🎯' },
};

const EMPTY_FORM = { name: '', keyword: '', condition: 'contains', categoryId: '', priority: 0 };

export default function AutoRules() {
  const [rules, setRules]         = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [modal, setModal]         = useState(false);
  const [editing, setEditing]     = useState(null);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [saving, setSaving]       = useState(false);
  const [testDesc, setTestDesc]   = useState('');
  const [testResult, setTestResult] = useState(null);
  const [testing, setTesting]     = useState(false);

  const load = async () => {
    try {
      const [rulesRes, catsRes] = await Promise.all([
        autoRulesAPI.getAll(),
        expensesAPI.getCategories(),
      ]);
      setRules(rulesRes.data);
      setCategories(catsRes.data);
    } catch {
      toast.error('Error al cargar reglas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModal(true);
  };

  const openEdit = (rule) => {
    setEditing(rule);
    setForm({
      name:       rule.name       || '',
      keyword:    rule.keyword,
      condition:  rule.condition,
      categoryId: rule.categoryId,
      priority:   rule.priority,
    });
    setModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.keyword.trim()) return toast.error('La palabra clave es requerida');
    if (!form.categoryId)     return toast.error('Selecciona una categoría');
    setSaving(true);
    try {
      if (editing) {
        await autoRulesAPI.update(editing.id, form);
        toast.success('Regla actualizada');
      } else {
        await autoRulesAPI.create(form);
        toast.success('Regla creada ✨');
      }
      setModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (rule) => {
    try {
      await autoRulesAPI.update(rule.id, { isActive: !rule.isActive });
      setRules((prev) => prev.map((r) => r.id === rule.id ? { ...r, isActive: !r.isActive } : r));
    } catch {
      toast.error('Error al actualizar');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar esta regla?')) return;
    try {
      await autoRulesAPI.remove(id);
      toast.success('Regla eliminada');
      load();
    } catch {
      toast.error('Error al eliminar');
    }
  };

  const handleTest = async () => {
    if (!testDesc.trim()) return;
    setTesting(true);
    setTestResult(null);
    try {
      const res = await autoRulesAPI.check(testDesc);
      setTestResult(res.data);
    } catch {
      toast.error('Error al probar');
    } finally {
      setTesting(false);
    }
  };

  const getCategoryById = (id) => categories.find((c) => c.id === id);

  return (
    <div className="space-y-4 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">⚡ Reglas automáticas</h1>
          <p className="text-sm text-slate-400 mt-0.5">Asigna categorías automáticamente según la descripción del gasto</p>
        </div>
        <Button onClick={openCreate} variant="primary" size="sm">+ Nueva regla</Button>
      </div>

      {/* Caja de prueba */}
      <Card className="p-4">
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">🧪 Probar descripción</p>
        <div className="flex gap-2">
          <input
            className="input-field flex-1"
            placeholder="Ej: McDonald's, Netflix, Uber..."
            value={testDesc}
            onChange={(e) => { setTestDesc(e.target.value); setTestResult(null); }}
            onKeyDown={(e) => e.key === 'Enter' && handleTest()}
          />
          <Button onClick={handleTest} variant="secondary" size="sm" loading={testing}>
            Probar
          </Button>
        </div>
        {testResult && (
          <div className={`mt-2 flex items-center gap-2 text-sm rounded-lg px-3 py-2 ${
            testResult.matched
              ? 'bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400'
              : 'bg-slate-50 dark:bg-slate-800 text-slate-400'
          }`}>
            {testResult.matched ? (
              <>✅ Regla aplicada → <span className="font-semibold">{testResult.category?.icon} {testResult.category?.name}</span></>
            ) : (
              <>⚪ Ninguna regla coincide con esta descripción</>
            )}
          </div>
        )}
      </Card>

      {/* Lista de reglas */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">Cargando...</div>
      ) : rules.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-4xl mb-2">⚡</p>
          <p className="font-semibold text-slate-700 dark:text-slate-300">Sin reglas configuradas</p>
          <p className="text-sm text-slate-400 mt-1 mb-4">
            Crea tu primera regla para que los gastos se categoricen solos
          </p>
          <Button onClick={openCreate} variant="primary" size="sm">Crear primera regla</Button>
        </Card>
      ) : (
        <div className="space-y-2">
          {rules.map((rule) => {
            const cat = rule.category;
            const cond = CONDITION_LABELS[rule.condition] || CONDITION_LABELS.contains;
            return (
              <Card key={rule.id} className={`p-4 transition-opacity ${rule.isActive ? '' : 'opacity-50'}`}>
                <div className="flex items-center gap-3">

                  {/* Condición + keyword */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-md font-medium">
                        {cond.icon} {cond.label}
                      </span>
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        "{rule.keyword}"
                      </span>
                      <span className="text-slate-400">→</span>
                      <span
                        className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: (cat?.color || '#6366f1') + '20',
                          color: cat?.color || '#6366f1',
                        }}
                      >
                        {cat?.icon} {cat?.name}
                      </span>
                    </div>
                    {rule.name && (
                      <p className="text-xs text-slate-400 mt-0.5">{rule.name}</p>
                    )}
                    <p className="text-xs text-slate-400 mt-0.5">
                      Aplicada {rule.matchCount} {rule.matchCount === 1 ? 'vez' : 'veces'}
                    </p>
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Toggle activo */}
                    <button
                      onClick={() => handleToggle(rule)}
                      className={`relative w-10 h-5 rounded-full transition-colors ${
                        rule.isActive ? 'bg-primary-500' : 'bg-slate-300 dark:bg-slate-600'
                      }`}
                      title={rule.isActive ? 'Desactivar' : 'Activar'}
                    >
                      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                        rule.isActive ? 'translate-x-5' : 'translate-x-0.5'
                      }`} />
                    </button>
                    <button
                      onClick={() => openEdit(rule)}
                      className="text-xs text-slate-400 hover:text-primary-500 transition-colors px-1"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(rule.id)}
                      className="text-xs text-slate-400 hover:text-red-500 transition-colors px-1"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Info */}
      <Card className="p-4 bg-primary-50 dark:bg-primary-500/10 border border-primary-200 dark:border-primary-500/30">
        <p className="text-sm font-semibold text-primary-700 dark:text-primary-400 mb-1">💡 ¿Cómo funcionan?</p>
        <ul className="text-xs text-primary-600 dark:text-primary-300 space-y-1">
          <li>• Cuando registras un gasto sin categoría, el sistema revisa tus reglas en orden de prioridad</li>
          <li>• La primera regla que coincida con la descripción asigna la categoría automáticamente</li>
          <li>• También verás sugerencias en tiempo real al escribir la descripción del gasto</li>
          <li>• Las reglas con menor número de prioridad se evalúan primero</li>
        </ul>
      </Card>

      {/* Modal crear/editar */}
      <Modal isOpen={modal} onClose={() => setModal(false)} title={editing ? 'Editar regla' : 'Nueva regla automática'}>
        <form onSubmit={handleSave} className="space-y-4">

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Nombre de la regla <span className="text-slate-400 font-normal">(opcional)</span>
            </label>
            <input
              className="input-field"
              placeholder="Ej: Regla para comida rápida"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Condición</label>
              <select
                className="input-field"
                value={form.condition}
                onChange={(e) => setForm({ ...form, condition: e.target.value })}
              >
                <option value="contains">🔍 Contiene</option>
                <option value="starts_with">▶️ Empieza con</option>
                <option value="ends_with">⏹️ Termina con</option>
                <option value="equals">🎯 Es exactamente</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Palabra clave</label>
              <input
                required
                className="input-field"
                placeholder="Ej: McDonald, Netflix..."
                value={form.keyword}
                onChange={(e) => setForm({ ...form, keyword: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Asignar categoría</label>
            <select
              required
              className="input-field"
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
            >
              <option value="">Seleccionar categoría...</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Prioridad <span className="text-slate-400 font-normal">(0 = más alta)</span>
            </label>
            <input
              type="number"
              min="0"
              className="input-field"
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: parseInt(e.target.value) || 0 })}
            />
          </div>

          {/* Vista previa */}
          {form.keyword && form.categoryId && (
            <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-3 text-sm text-slate-500 dark:text-slate-400">
              Si la descripción <strong className="text-slate-700 dark:text-slate-200">
                {CONDITION_LABELS[form.condition]?.label.toLowerCase()}
              </strong> "<strong className="text-primary-600 dark:text-primary-400">{form.keyword}</strong>"
              → asignar <strong className="text-slate-700 dark:text-slate-200">
                {getCategoryById(form.categoryId)?.icon} {getCategoryById(form.categoryId)?.name}
              </strong>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setModal(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" loading={saving}>
              {editing ? 'Actualizar' : 'Crear regla'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
