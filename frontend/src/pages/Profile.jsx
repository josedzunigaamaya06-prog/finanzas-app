import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import useAuthStore from '../store/authStore';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import toast from 'react-hot-toast';
import { useOnboarding } from '../components/OnboardingModal';

const PLAN_FEATURES = {
  FREE: [
    'Registro ilimitado de ingresos y gastos',
    'Categorización automática inteligente',
    'Control de deudas con estrategias de pago',
    'Presupuestos, metas y score financiero',
    'Recordatorios de pago',
  ],
  PREMIUM: [
    'Todo lo del plan Gratis',
    'Reportes exportables para tu contador',
    'Análisis financiero avanzado con IA',
    'Billeteras y deudas sin límite',
    'Soporte prioritario',
  ],
};

export default function Profile() {
  const { user, updateUser, logout } = useAuthStore();
  const { reset: resetOnboarding } = useOnboarding();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: user?.name || '', currency: user?.currency || 'COP', timezone: user?.timezone || 'America/Bogota' });
  const [passForm, setPassForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving] = useState(false);
  const [savingPass, setSavingPass] = useState(false);

  // Eliminar cuenta
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleteForm, setDeleteForm] = useState({ password: '', confirmText: '' });
  const [deleting, setDeleting] = useState(false);

  const isDemo = user?.email === 'demo@finanzas.app';
  const plan = user?.plan || 'FREE';
  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })
    : null;

  const initials = user?.name?.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase() || '?';

  const handleProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const r = await authAPI.updateProfile(form);
      updateUser(r.data.user);
      toast.success('Perfil actualizado');
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const handlePassword = async (e) => {
    e.preventDefault();
    if (passForm.newPassword !== passForm.confirmPassword) return toast.error('Las contraseñas no coinciden');
    if (passForm.newPassword.length < 8) return toast.error('Mínimo 8 caracteres');
    setSavingPass(true);
    try {
      await authAPI.updateProfile({ currentPassword: passForm.currentPassword, newPassword: passForm.newPassword });
      setPassForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('Contraseña actualizada');
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setSavingPass(false); }
  };

  const handleDelete = async (e) => {
    e.preventDefault();
    if (deleteForm.confirmText !== 'ELIMINAR') return toast.error('Escribe ELIMINAR para confirmar');
    setDeleting(true);
    try {
      await authAPI.deleteAccount(deleteForm.password);
      toast.success('Tu cuenta y todos tus datos fueron eliminados');
      logout();
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al eliminar la cuenta');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-5 animate-fade-in">

      {/* ── Encabezado ─────────────────────────────────────────────────── */}
      <Card>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-xl font-black flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 4px 14px rgba(16,185,129,0.35)' }}>
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate">{user?.name}</h3>
              <span className={`badge ${plan === 'PREMIUM' ? 'badge-green' : 'badge-slate'}`}>
                {plan === 'PREMIUM' ? '★ Premium' : 'Plan Gratis'}
              </span>
            </div>
            <p className="text-sm text-slate-400 truncate">{user?.email}</p>
            {memberSince && <p className="text-xs text-slate-400 mt-0.5">Miembro desde {memberSince}</p>}
          </div>
        </div>
      </Card>

      {/* ── Datos personales ───────────────────────────────────────────── */}
      <Card>
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">Datos personales</h3>
        <form onSubmit={handleProfile} className="space-y-4">
          <div>
            <label className="input-label">Nombre completo</label>
            <input className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="input-label">Moneda</label>
              <select className="input-field" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
                <option value="COP">COP - Peso colombiano</option>
                <option value="USD">USD - Dólar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="MXN">MXN - Peso mexicano</option>
                <option value="PEN">PEN - Sol peruano</option>
                <option value="ARS">ARS - Peso argentino</option>
              </select>
            </div>
            <div>
              <label className="input-label">Zona horaria</label>
              <select className="input-field" value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })}>
                <option value="America/Bogota">América/Bogotá</option>
                <option value="America/Mexico_City">América/Ciudad de México</option>
                <option value="America/Lima">América/Lima</option>
                <option value="America/Buenos_Aires">América/Buenos Aires</option>
                <option value="America/Santiago">América/Santiago</option>
              </select>
            </div>
          </div>
          <Button type="submit" variant="primary" loading={saving}>Guardar cambios</Button>
        </form>
      </Card>

      {/* ── Plan y precios ─────────────────────────────────────────────── */}
      <Card>
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">Tu plan</h3>
        <p className="text-sm text-slate-400 mb-5">Elige el plan que se ajuste a tus finanzas</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Plan Gratis */}
          <div className={`rounded-2xl border p-5 ${plan === 'FREE' ? 'border-primary-500/40 bg-primary-500/[0.03]' : 'border-surface-200 dark:border-slate-700/50'}`}>
            <div className="flex items-center justify-between mb-1">
              <p className="font-bold text-slate-900 dark:text-white">Gratis</p>
              {plan === 'FREE' && <span className="badge badge-green">Tu plan actual</span>}
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-white mb-4 text-money">$0 <span className="text-xs font-medium text-slate-400">/ mes</span></p>
            <ul className="space-y-2">
              {PLAN_FEATURES.FREE.map((f) => (
                <li key={f} className="flex items-start gap-2 text-xs text-slate-500 dark:text-slate-300">
                  <span className="text-primary-500 font-bold mt-px flex-shrink-0">✓</span>{f}
                </li>
              ))}
            </ul>
          </div>

          {/* Plan Premium */}
          <div className="relative rounded-2xl p-[1.5px] overflow-hidden" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
            <div className="rounded-[14.5px] bg-white dark:bg-dark-800 p-5 h-full">
              <div className="flex items-center justify-between mb-1">
                <p className="font-bold text-slate-900 dark:text-white">Premium</p>
                <span className="badge badge-amber">Muy pronto</span>
              </div>
              <p className="text-2xl font-black text-money mb-4" style={{ color: '#059669' }}>
                $19.900 <span className="text-xs font-medium text-slate-400">COP / mes</span>
              </p>
              <ul className="space-y-2 mb-4">
                {PLAN_FEATURES.PREMIUM.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs text-slate-500 dark:text-slate-300">
                    <span className="font-bold mt-px flex-shrink-0" style={{ color: '#10b981' }}>✓</span>{f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => toast('El plan Premium estará disponible muy pronto. ¡Te avisaremos! 🎉', { icon: '⭐' })}
                className="w-full py-2.5 rounded-xl font-bold text-white text-sm transition-all duration-150 active:scale-[0.98]"
                style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
              >
                Quiero ser el primero
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* ── Seguridad ──────────────────────────────────────────────────── */}
      <Card>
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">Seguridad</h3>
        {isDemo ? (
          <p className="text-sm text-slate-400">La cuenta demo no permite cambiar la contraseña.</p>
        ) : (
          <form onSubmit={handlePassword} className="space-y-4">
            <div>
              <label className="input-label">Contraseña actual</label>
              <input type="password" autoComplete="current-password" className="input-field" value={passForm.currentPassword} onChange={(e) => setPassForm({ ...passForm, currentPassword: e.target.value })} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="input-label">Nueva contraseña</label>
                <input type="password" minLength={8} autoComplete="new-password" className="input-field" value={passForm.newPassword} onChange={(e) => setPassForm({ ...passForm, newPassword: e.target.value })} />
              </div>
              <div>
                <label className="input-label">Confirmar contraseña</label>
                <input type="password" autoComplete="new-password" className="input-field" value={passForm.confirmPassword} onChange={(e) => setPassForm({ ...passForm, confirmPassword: e.target.value })} />
              </div>
            </div>
            <Button type="submit" variant="secondary" loading={savingPass}>Cambiar contraseña</Button>
          </form>
        )}
      </Card>

      {/* ── Guía de inicio ─────────────────────────────────────────────── */}
      <Card>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">📚 Guía de inicio</h3>
            <p className="text-sm text-slate-400 mt-0.5">Vuelve a ver el tutorial de cómo usar la app</p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => { resetOnboarding(); window.location.reload(); }}>
            Ver guía
          </Button>
        </div>
      </Card>

      {/* ── Zona de peligro ────────────────────────────────────────────── */}
      <div className="card p-5 md:p-6 border-red-200 dark:border-red-500/30">
        <h3 className="text-base font-bold text-red-600 dark:text-red-400 mb-1">Zona de peligro</h3>
        <p className="text-sm text-slate-400 mb-4">
          Eliminar tu cuenta borra <strong>permanentemente</strong> todos tus datos: ingresos, gastos, deudas, metas, billeteras y presupuestos. Esta acción no se puede deshacer.
        </p>
        {isDemo ? (
          <p className="text-sm text-slate-400">La cuenta demo no se puede eliminar.</p>
        ) : (
          <Button variant="danger" size="sm" onClick={() => { setDeleteForm({ password: '', confirmText: '' }); setDeleteModal(true); }}>
            Eliminar mi cuenta
          </Button>
        )}
      </div>

      {/* Modal de confirmación de eliminación */}
      <Modal isOpen={deleteModal} onClose={() => setDeleteModal(false)} title="Eliminar cuenta permanentemente" size="sm">
        <form onSubmit={handleDelete} className="space-y-4">
          <div className="rounded-xl p-3 text-sm border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/5 text-red-600 dark:text-red-400">
            ⚠️ Se borrarán todos tus datos de forma permanente. No hay vuelta atrás ni copia de recuperación.
          </div>
          <div>
            <label className="input-label">Tu contraseña</label>
            <input
              type="password"
              required
              autoComplete="current-password"
              className="input-field"
              placeholder="Confirma tu identidad"
              value={deleteForm.password}
              onChange={(e) => setDeleteForm({ ...deleteForm, password: e.target.value })}
            />
          </div>
          <div>
            <label className="input-label">Escribe ELIMINAR para confirmar</label>
            <input
              required
              className="input-field"
              placeholder="ELIMINAR"
              value={deleteForm.confirmText}
              onChange={(e) => setDeleteForm({ ...deleteForm, confirmText: e.target.value.toUpperCase() })}
            />
          </div>
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setDeleteModal(false)}>Cancelar</Button>
            <Button
              type="submit"
              variant="danger"
              className="flex-1"
              loading={deleting}
              disabled={deleteForm.confirmText !== 'ELIMINAR' || !deleteForm.password}
            >
              Eliminar todo
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
