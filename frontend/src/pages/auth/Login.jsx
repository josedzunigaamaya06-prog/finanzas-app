import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form);
      toast.success('¡Bienvenido de vuelta!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async () => {
    setDemoLoading(true);
    try {
      await login({ email: 'demo@finanzas.app', password: 'Demo123!' });
      toast.success('¡Bienvenido a la demo!');
      navigate('/dashboard');
    } catch (err) {
      toast.error('Error al entrar a la demo. Intenta de nuevo.');
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-dark-900">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-dark-950 via-dark-900 to-primary-900/20 p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 bg-primary-500 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-48 h-48 bg-violet-500 rounded-full blur-3xl" />
        </div>
        <div className="relative">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center text-white font-bold">F</div>
            <span className="text-white text-xl font-bold">FinanzasPro</span>
          </div>
          <h2 className="text-4xl font-bold text-white mb-4 leading-tight">
            Toma el control<br />de tus finanzas
          </h2>
          <p className="text-slate-400 text-lg">Analiza, planifica y alcanza tus metas financieras con inteligencia.</p>
        </div>
        <div className="relative grid grid-cols-2 gap-4">
          {[
            { label: 'Score financiero', value: 'Personalizado', icon: '📊' },
            { label: 'Estrategia de deuda', value: 'Avalanche / Snowball', icon: '🏦' },
            { label: 'Análisis de gastos', value: 'Por categorías', icon: '📈' },
            { label: 'Metas de ahorro', value: 'Con progreso visual', icon: '🎯' },
          ].map((f) => (
            <div key={f.label} className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-2xl mb-2">{f.icon}</p>
              <p className="text-white text-sm font-medium">{f.value}</p>
              <p className="text-slate-400 text-xs">{f.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md animate-slide-up">
          <div className="mb-8">
            <div className="lg:hidden flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm">F</div>
              <span className="text-white font-bold">FinanzasPro</span>
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">Iniciar sesión</h1>
            <p className="text-slate-400 text-sm">Accede a tu panel financiero</p>
          </div>

          <button
            onClick={handleDemo}
            disabled={demoLoading}
            className="w-full mb-6 flex items-center justify-center gap-3 px-4 py-3.5 rounded-xl border-2 border-dashed border-primary-500/40 bg-primary-500/5 hover:bg-primary-500/10 hover:border-primary-500/60 transition-all duration-200 group disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <span className="text-2xl">{demoLoading ? '⏳' : '🚀'}</span>
            <div className="text-left">
              <p className="text-primary-300 text-sm font-semibold group-hover:text-primary-200 transition-colors">
                {demoLoading ? 'Entrando...' : 'Probar sin registrarse'}
              </p>
              <p className="text-slate-500 text-xs">Acceso inmediato con cuenta demo</p>
            </div>
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-slate-700/50" />
            <span className="text-slate-500 text-xs">o inicia sesión con tu cuenta</span>
            <div className="flex-1 h-px bg-slate-700/50" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
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
                className="input-field"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-xs text-primary-400 hover:text-primary-300 transition-colors">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            <Button type="submit" className="w-full" loading={loading} size="lg">
              Iniciar sesión
            </Button>
          </form>

        </div>
      </div>
    </div>
  );
}
