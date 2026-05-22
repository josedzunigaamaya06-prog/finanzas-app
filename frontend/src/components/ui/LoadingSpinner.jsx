export default function LoadingSpinner({ fullScreen = false, size = 'md' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };

  const spinner = (
    <div className={`${sizes[size]} border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin`} />
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-slate-50 dark:bg-dark-900 z-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Cargando...</p>
        </div>
      </div>
    );
  }

  return spinner;
}
