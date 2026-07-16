import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../../services/api';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authAPI.forgotPassword(email);
      setSent(true);
      toast.success('Instrucciones enviadas (si el correo existe)');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al enviar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-900 p-8">
      <div className="w-full max-w-md animate-slide-up">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold">F</div>
          <span className="text-white text-xl font-bold">FinanzasPro</span>
        </div>

        {sent ? (
          <div className="text-center py-8">
            <div className="text-5xl mb-4">📧</div>
            <h2 className="text-xl font-bold text-white mb-2">Revisa tu correo</h2>
            <p className="text-slate-400 text-sm mb-6">Si el correo existe, recibirás instrucciones para restablecer tu contraseña.</p>
            <Link to="/login" className="text-primary-400 hover:text-primary-300 text-sm font-medium">
              Volver al inicio de sesión
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-white mb-1">Recuperar contraseña</h1>
            <p className="text-slate-400 text-sm mb-8">Ingresa tu correo y te enviaremos las instrucciones.</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Correo electrónico</label>
                <input
                  type="email"
                  required
                  className="input-field"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" loading={loading} size="lg">
                Enviar instrucciones
              </Button>
            </form>
            <p className="text-center mt-6">
              <Link to="/login" className="text-primary-400 hover:text-primary-300 text-sm font-medium">
                ← Volver al inicio de sesión
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
