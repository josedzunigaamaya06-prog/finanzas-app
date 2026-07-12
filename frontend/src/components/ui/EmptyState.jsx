import Button from './Button';

export default function EmptyState({ icon = '📋', title, description, action, actionLabel }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center animate-fade-in select-none">

      {/* Icon container */}
      <div className="relative mb-6">
        {/* Radial glow behind */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(16,185,129,0.10) 0%, transparent 68%)',
            transform: 'scale(2.4)',
          }}
        />
        {/* Decorative accent dots */}
        <span
          className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full"
          style={{ background: 'rgba(16,185,129,0.25)' }}
        />
        <span
          className="absolute -bottom-1 -left-1.5 w-2 h-2 rounded-full"
          style={{ background: 'rgba(16,185,129,0.15)' }}
        />
        {/* Icon box */}
        <div
          className="relative w-20 h-20 rounded-2xl flex items-center justify-center text-4xl bg-surface-50 dark:bg-dark-800 border border-surface-200 dark:border-slate-700/50"
          style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.07), 0 1px 3px rgba(0,0,0,0.04)' }}
        >
          {icon}
        </div>
      </div>

      <h3 className="text-[15px] font-bold text-slate-800 dark:text-white mb-1.5 tracking-tight">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-slate-400 mb-6 max-w-[260px] leading-relaxed">
          {description}
        </p>
      )}
      {action && (
        <Button onClick={action} variant="primary" size="md">
          {actionLabel || 'Agregar'}
        </Button>
      )}
    </div>
  );
}
