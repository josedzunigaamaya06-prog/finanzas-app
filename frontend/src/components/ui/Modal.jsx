import { useEffect } from 'react';

export default function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!isOpen) return null;

  const sizes = { sm: 'md:max-w-md', md: 'md:max-w-lg', lg: 'md:max-w-2xl', xl: 'md:max-w-4xl' };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center md:p-4" onClick={onClose}>
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" />

      {/* Panel — en móvil sube desde abajo, en desktop es centrado */}
      <div
        className={`
          relative w-full ${sizes[size]}
          bg-white dark:bg-dark-800
          md:rounded-2xl rounded-t-2xl
          shadow-2xl border border-slate-100 dark:border-slate-700/50
          animate-slide-up
          max-h-[90vh] flex flex-col
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700/50 flex-shrink-0">
          {/* Indicador drag en móvil */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 bg-slate-200 dark:bg-slate-600 rounded-full md:hidden" />
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            ✕
          </button>
        </div>

        {/* Contenido scrollable */}
        <div className="p-5 overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}
