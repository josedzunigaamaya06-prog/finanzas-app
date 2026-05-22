export default function Badge({ children, color = 'default', size = 'sm' }) {
  const colors = {
    default: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300',
    primary: 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300',
    success: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
    warning: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
    danger: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
    info: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  };

  return (
    <span className={`badge ${colors[color]}`}>
      {children}
    </span>
  );
}
