import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', currency: 'COP' });
  const [loading, setLoading] = useState(false);
  const { register } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 8) return toast.error('La contraseña debe tener al menos 8 caracteres');
    setLoading(true);
    try {
      await register(form);
      toast.success('¡Cuenta creada exitosamente!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-900 p-8">
      <div className="w-full max-w-md animate-slide-up">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center text-white font-bold">F</div>
          <span className="text-white text-xl font-bold">FinanzasPro</span>
        </div>

        <h1 className="text-2xl font-bold text-white mb-1">Crear cuenta</h1>
        <p className="text-slate-400 text-sm mb-8">Comienza a controlar tus finanzas hoy</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Nombre completo</label>
            <input
              required
              className="input-field"
              placeholder="Juan Pérez"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Correo electrónico</label>
            <input
              type="email"
              required
              className="input-field"
              placeholder="tu@email.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Contraseña</label>
            <input
              type="password"
              required
              minLength={8}
              className="input-field"
              placeholder="Mínimo 8 caracteres"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Moneda</label>
            <select
              className="input-field"
              value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value })}
            >
              <option value="COP">COP - Peso colombiano</option>
              <option value="USD">USD - Dólar estadounidense</option>
              <option value="EUR">EUR - Euro</option>
              <option value="MXN">MXN - Peso mexicano</option>
              <option value="PEN">PEN - Sol peruano</option>
              <option value="ARS">ARS - Peso argentino</option>
            </select>
          </div>
          <Button type="submit" className="w-full" loading={loading} size="lg">
            Crear cuenta
          </Button>
        </form>

        <p className="text-center text-slate-500 text-sm mt-6">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium transition-colors">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
