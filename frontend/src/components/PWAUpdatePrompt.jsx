import { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

export default function PWAUpdatePrompt() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      // Revisar actualizaciones cada 60 minutos
      if (r) {
        setInterval(() => r.update(), 60 * 60 * 1000);
      }
    },
  });

  const [dismissed, setDismissed] = useState(false);

  if (!needRefresh || dismissed) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-[200] w-[calc(100%-2rem)] max-w-sm animate-slide-up">
      <div className="bg-dark-800 border border-primary-500/40 rounded-2xl shadow-2xl shadow-black/40 p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary-500/20 flex items-center justify-center flex-shrink-0">
          <span className="text-xl">🆕</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white">Nueva versión disponible</p>
          <p className="text-xs text-slate-400 mt-0.5">Actualiza para ver los últimos cambios</p>
        </div>
        <div className="flex flex-col gap-1.5 flex-shrink-0">
          <button
            onClick={() => updateServiceWorker(true)}
            className="px-3 py-1.5 rounded-lg bg-primary-600 text-white text-xs font-semibold hover:bg-primary-700 transition-colors active:scale-95"
          >
            Actualizar
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="px-3 py-1.5 rounded-lg text-slate-400 text-xs hover:text-slate-300 transition-colors text-center"
          >
            Ahora no
          </button>
        </div>
      </div>
    </div>
  );
}
