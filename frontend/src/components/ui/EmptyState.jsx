import Button from './Button';

export default function EmptyState({ icon = '📋', title, description, action, actionLabel }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-2">{title}</h3>
      {description && <p className="text-sm text-slate-400 mb-6 max-w-sm">{description}</p>}
      {action && (
        <Button onClick={action} variant="primary">
          {actionLabel || 'Agregar'}
        </Button>
      )}
    </div>
  );
}
