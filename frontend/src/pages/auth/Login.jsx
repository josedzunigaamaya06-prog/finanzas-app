import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';

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
      // Cuenta sin verificar: llevar directo a la pantalla del código
      if (err.response?.status === 403) {
        toast('Tu cuenta necesita verificación. Te enviamos un código.', { icon: '✉️' });
        navigate('/register', { state: { pendingEmail: form.email } });
        return;
      }
      toast.error(err.response?.data?.message || 'Credenciales incorrectas');
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
    } catch {
      toast.error('Error al entrar a la demo. Intenta de nuevo.');
    } finally {
      setDemoLoading(false);
    }
  };

  const features = [
    { icon: '📊', title: 'Score financiero', desc: 'Diagnóstico en tiempo real' },
    { icon: '🏦', title: 'Control de deudas', desc: 'Estrategia Avalanche / Snowball' },
    { icon: '📈', title: 'Predicción de gastos', desc: 'IA basada en tus hábitos' },
    { icon: '🎯', title: 'Metas de ahorro', desc: 'Seguimiento con progreso visual' },
  ];

  return (
    <div className="min-h-screen flex" style={{ background: '#f9fafb' }}>

      {/* ── Panel izquierdo ────────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[52%] flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: '#111318' }}>

        {/* Fondo decorativo */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)' }} />
          <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)' }} />
          {/* Grid sutil */}
          <div className="absolute inset-0 opacity-[0.03]"
            style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        </div>

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-base"
            style={{ background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 4px 14px rgba(16,185,129,0.4)' }}>
            F
          </div>
          <span className="text-white font-bold text-lg tracking-tight">FinanzasPro</span>
        </div>

        {/* Headline */}
        <div className="relative">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6"
            style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.2)' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-primary-400 animate-pulse" />
            <span className="text-primary-400 text-xs font-semibold tracking-wide">GESTIÓN FINANCIERA INTELIGENTE</span>
          </div>

          <h1 className="text-4xl xl:text-5xl font-black text-white leading-tight tracking-tight mb-4">
            Toma el control<br />
            <span style={{ color: '#10b981' }}>de tu dinero.</span>
          </h1>
          <p className="text-slate-400 text-base leading-relaxed max-w-sm">
            Analiza tus finanzas, planifica tus metas y construye hábitos de ahorro con herramientas profesionales.
          </p>
        </div>

        {/* Features */}
        <div className="relative grid grid-cols-2 gap-3">
          {features.map((f) => (
            <div key={f.title} className="rounded-2xl p-4 transition-colors"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <span className="text-xl block mb-2">{f.icon}</span>
              <p className="text-white text-sm font-semibold leading-tight">{f.title}</p>
              <p className="text-slate-500 text-xs mt-0.5">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Panel derecho ──────────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[380px] animate-slide-up">

          {/* Logo mobile */}
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-black text-sm"
              style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>F</div>
            <span className="font-bold text-slate-900 text-base">FinanzasPro</span>
          </div>

          <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-1">Iniciar sesión</h2>
          <p className="text-slate-400 text-sm mb-8">Accede a tu panel financiero personalizado</p>

          {/* Demo CTA */}
          <button
            onClick={handleDemo}
            disabled={demoLoading}
            className="w-full mb-6 group relative overflow-hidden rounded-2xl p-[1px] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
          >
            <div className="flex items-center gap-3.5 px-4 py-3.5 rounded-[15px] transition-colors"
              style={{ background: demoLoading ? 'transparent' : 'rgba(17,19,24,0.95)' }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-base"
                style={{ background: 'rgba(16,185,129,0.15)' }}>
                {demoLoading ? '⏳' : '🚀'}
              </div>
              <div className="text-left">
                <p className="text-sm font-bold" style={{ color: '#10b981' }}>
                  {demoLoading ? 'Entrando a la demo...' : 'Probar sin registrarse'}
                </p>
                <p className="text-xs text-slate-500">Acceso inmediato · Sin datos reales</p>
              </div>
              {!demoLoading && (
                <span className="ml-auto text-slate-600 group-hover:text-primary-500 transition-colors text-sm">→</span>
              )}
            </div>
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px" style={{ background: '#e5e7eb' }} />
            <span className="text-xs font-medium text-slate-400">o continúa con tu cuenta</span>
            <div className="flex-1 h-px" style={{ background: '#e5e7eb' }} />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="input-label">Correo electrónico</label>
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
              <div className="flex items-center justify-between mb-1.5">
                <label className="input-label" style={{ margin: 0 }}>Contraseña</label>
                <Link to="/forgot-password"
                  className="text-xs font-medium transition-colors"
                  style={{ color: '#10b981' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#059669'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#10b981'}
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <input
                type="password"
                required
                className="input-field"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-white text-[15px] transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: loading ? '#059669' : 'linear-gradient(135deg, #10b981, #059669)',
                boxShadow: '0 4px 14px rgba(16,185,129,0.4)',
              }}
            >
              {loading ? 'Verificando...' : 'Iniciar sesión'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-400 mt-6">
            ¿No tienes cuenta?{' '}
            <Link to="/register" className="font-semibold transition-colors" style={{ color: '#10b981' }}>
              Créala gratis en 1 minuto
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
