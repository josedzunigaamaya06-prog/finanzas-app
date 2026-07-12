import LoadingSpinner from './LoadingSpinner';

const variants = {
  primary:   'btn-primary',
  secondary: 'btn-secondary',
  danger:    'btn-danger',
  ghost:     'btn-ghost',
};

const sizes = {
  xs: 'px-2.5 py-1.5 text-xs',
  sm: 'px-3 py-2 text-sm',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-5 py-3 text-[15px]',
};

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
  return (
    <button
      disabled={disabled || loading}
      className={`${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading
        ? <LoadingSpinner size="sm" />
        : icon && <span className="text-base leading-none">{icon}</span>
      }
      {children}
    </button>
  );
}
