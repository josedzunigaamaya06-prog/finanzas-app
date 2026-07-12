import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { authAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function Register() {
  const location = useLocation();
  // Si viene desde Login con una cuenta sin verificar, salta directo al paso del código
  const pendingEmail = location.state?.pendingEmail || '';

  const [step, setStep] = useState(pendingEmail ? 'verify' : 'form');
  const [form, setForm] = useState({ name: '', email: pendingEmail, password: '' });
  const [code, setCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const autoResent = useRef(false);
  const { register, verifyEmail } = useAuthStore();
  const navigate = useNavigate();

  const passwordOk = form.password.length >= 8;

  // Countdown del botón "reenviar código"
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  // Si llegó desde Login sin verificar, enviarle un código fresco automáticamente (una sola vez)
  useEffect(() => {
    if (pendingEmail && !autoResent.current) {
      autoResent.current = true;
      authAPI.resendVerification(pendingEmail)
        .then(() => { toast.success('Te enviamos un nuevo código a tu correo'); setCooldown(60); })
        .catch(() => {});
    }
  }, [pendingEmail]);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!passwordOk) return toast.error('La contraseña debe tener al menos 8 caracteres');
    setLoading(true);
    try {
      const data = await register(form);
      if (data.emailSent === false) {
        toast.error('No pudimos enviar el correo. Usa "Reenviar código" en unos segundos.');
      } else {
        toast.success('Te enviamos un código a tu correo');
      }
      setStep('verify');
      setCooldown(60);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al crear la cuenta');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (rawCode) => {
    const finalCode = (rawCode ?? code).trim();
    if (finalCode.length !== 6 || loading) return;
    setLoading(true);
    try {
      await verifyEmail({ email: form.email, code: finalCode });
      toast.success(`¡Cuenta verificada! Bienvenido${form.name ? `, ${form.name.split(' ')[0]}` : ''}`);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Código inválido o expirado');
      setCode('');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (value) => {
    const digits = value.replace(/\D/g, '').slice(0, 6);
    setCode(digits);
    if (digits.length === 6) handleVerify(digits);
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    try {
      await authAPI.resendVerification(form.email);
      toast.success('Nuevo código enviado. Revisa tu correo (y la carpeta de spam).');
      setCooldown(60);
    } catch {
      toast.error('No pudimos reenviar el código. Intenta de nuevo.');
    }
  };

  const benefits = [
    'Control de gastos e ingresos en segundos',
    'Estrategias inteligentes para salir de deudas',
    'Score de salud financiera en tiempo real',
  ];

  return (
    <div className="min-h-screen flex" style={{ background: '#f9fafb' }}>

      {/* ── Panel izquierdo ────────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[52%] flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: '#111318' }}>

        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)' }} />
          <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)' }} />
          <div className="absolute inset-0 opacity-[0.03]"
            style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        </div>

        <div className="relative flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-base"
            style={{ background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 4px 14px rgba(16,185,129,0.4)' }}>
            F
          </div>
          <span className="text-white font-bold text-lg tracking-tight">FinanzasPro</span>
        </div>

        <div className="relative">
          <h1 className="text-4xl xl:text-5xl font-black text-white leading-tight tracking-tight mb-4">
            {step === 'form' ? <>Tu cuenta lista<br /><span style={{ color: '#10b981' }}>en 1 minuto.</span></>
                             : <>Revisa tu<br /><span style={{ color: '#10b981' }}>correo.</span></>}
          </h1>
          <p className="text-slate-400 text-base leading-relaxed max-w-sm mb-8">
            {step === 'form'
              ? 'Sin tarjeta de crédito, sin formularios eternos. Solo tu nombre, correo y una contraseña.'
              : 'Te enviamos un código de 6 dígitos para confirmar que este correo es tuyo. Así protegemos tu cuenta.'}
          </p>
          {step === 'form' && (
            <ul className="space-y-3">
              {benefits.map((b) => (
                <li key={b} className="flex items-center gap-3 text-sm text-slate-300">
                  <span className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold"
                    style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399' }}>✓</span>
                  {b}
                </li>
              ))}
            </ul>
          )}
        </div>

        <p className="relative text-slate-600 text-xs">Gratis para siempre en el plan básico.</p>
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

          {step === 'form' ? (
            <>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-1">Crear cuenta</h2>
              <p className="text-slate-400 text-sm mb-8">Solo 3 datos y estás dentro</p>

              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="input-label">Nombre</label>
                  <input
                    required
                    autoFocus
                    autoComplete="name"
                    className="input-field"
                    placeholder="¿Cómo te llamas?"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="input-label">Correo electrónico</label>
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    className="input-field"
                    placeholder="tu@email.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>

                <div>
                  <label className="input-label">Contraseña</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={8}
                      autoComplete="new-password"
                      className="input-field pr-11"
                      placeholder="Mínimo 8 caracteres"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors text-sm"
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      {showPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                  {form.password.length > 0 && (
                    <p className={`mt-1.5 text-xs flex items-center gap-1 ${passwordOk ? 'text-primary-600' : 'text-slate-400'}`}>
                      {passwordOk ? '✓ Contraseña válida' : `${8 - form.password.length} caracteres más...`}
                    </p>
                  )}
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
                  {loading ? 'Creando tu cuenta...' : 'Crear cuenta gratis'}
                </button>

                <p className="text-[11px] text-slate-400 text-center leading-relaxed">
                  Al crear tu cuenta aceptas nuestra política de privacidad y el tratamiento de tus datos según la Ley 1581 (habeas data).
                </p>
              </form>

              <div className="flex items-center gap-3 my-6">
                <div className="flex-1 h-px" style={{ background: '#e5e7eb' }} />
                <span className="text-xs font-medium text-slate-400">¿Ya tienes cuenta?</span>
                <div className="flex-1 h-px" style={{ background: '#e5e7eb' }} />
              </div>

              <Link
                to="/login"
                className="block w-full py-2.5 rounded-xl font-semibold text-sm text-center transition-colors"
                style={{ border: '1px solid #e5e7eb', color: '#059669' }}
              >
                Iniciar sesión
              </Link>
            </>
          ) : (
            <>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-6"
                style={{ background: 'rgba(16,185,129,0.1)' }}>
                ✉️
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-1">Verifica tu correo</h2>
              <p className="text-slate-400 text-sm mb-8">
                Enviamos un código de 6 dígitos a{' '}
                <span className="font-semibold text-slate-600">{form.email}</span>
              </p>

              <div className="space-y-5">
                <div>
                  <label className="input-label">Código de verificación</label>
                  <input
                    autoFocus
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    className="input-field text-center text-2xl font-bold tracking-[0.5em]"
                    placeholder="······"
                    value={code}
                    onChange={(e) => handleCodeChange(e.target.value)}
                    disabled={loading}
                  />
                  <p className="mt-2 text-xs text-slate-400">
                    El código vence en 15 minutos. Si no lo ves, revisa la carpeta de spam.
                  </p>
                </div>

                <button
                  onClick={() => handleVerify()}
                  disabled={loading || code.length !== 6}
                  className="w-full py-3 rounded-xl font-bold text-white text-[15px] transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    boxShadow: '0 4px 14px rgba(16,185,129,0.4)',
                  }}
                >
                  {loading ? 'Verificando...' : 'Verificar y entrar'}
                </button>

                <div className="flex items-center justify-between text-sm">
                  <button
                    onClick={handleResend}
                    disabled={cooldown > 0}
                    className="font-semibold transition-colors disabled:cursor-not-allowed"
                    style={{ color: cooldown > 0 ? '#94a3b8' : '#10b981' }}
                  >
                    {cooldown > 0 ? `Reenviar en ${cooldown}s` : 'Reenviar código'}
                  </button>
                  <button
                    onClick={() => { setStep('form'); setCode(''); }}
                    className="text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    Cambiar correo
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
