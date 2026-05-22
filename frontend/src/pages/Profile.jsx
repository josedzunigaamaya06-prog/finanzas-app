import { useState } from 'react';
import { authAPI } from '../services/api';
import useAuthStore from '../store/authStore';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import toast from 'react-hot-toast';

export default function Profile() {
  const { user, updateUser } = useAuthStore();
  const [form, setForm] = useState({ name: user?.name || '', currency: user?.currency || 'COP', timezone: user?.timezone || 'America/Bogota' });
  const [passForm, setPassForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving] = useState(false);
  const [savingPass, setSavingPass] = useState(false);

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

  return (
    <div className="max-w-2xl space-y-5 animate-fade-in">
      <Card>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center text-white text-2xl font-bold">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{user?.name}</h3>
            <p className="text-sm text-slate-400">{user?.email}</p>
          </div>
        </div>

        <form onSubmit={handleProfile} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Nombre completo</label>
            <input className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Moneda</label>
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
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Zona horaria</label>
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

      <Card>
        <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4">Cambiar contraseña</h3>
        <form onSubmit={handlePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Contraseña actual</label>
            <input type="password" className="input-field" value={passForm.currentPassword} onChange={(e) => setPassForm({ ...passForm, currentPassword: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Nueva contraseña</label>
            <input type="password" minLength={8} className="input-field" value={passForm.newPassword} onChange={(e) => setPassForm({ ...passForm, newPassword: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Confirmar contraseña</label>
            <input type="password" className="input-field" value={passForm.confirmPassword} onChange={(e) => setPassForm({ ...passForm, confirmPassword: e.target.value })} />
          </div>
          <Button type="submit" variant="secondary" loading={savingPass}>Cambiar contraseña</Button>
        </form>
      </Card>

      <Card>
        <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-2">Información de la cuenta</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-400">Correo</span>
            <span className="text-slate-700 dark:text-slate-200">{user?.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Moneda</span>
            <span className="text-slate-700 dark:text-slate-200">{user?.currency}</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
