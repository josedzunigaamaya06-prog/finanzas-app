import LoadingSpinner from './LoadingSpinner';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  icon,
  ...props
}) {
  const variants = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    danger: 'bg-red-500 hover:bg-red-600 text-white font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500/50 active:scale-95 disabled:opacity-50',
    ghost: 'hover:bg-slate-100 dark:hover:bg-slate-700/50 text-slate-600 dark:text-slate-300 font-medium rounded-xl transition-all duration-200 focus:outline-none active:scale-95',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading ? <LoadingSpinner size="sm" /> : icon && <span className="text-base">{icon}</span>}
      {children}
    </button>
  );
}
