import { useEffect, useState } from 'react';
import { recommendationsAPI } from '../services/api';
import { formatDate, priorityColor, priorityLabel } from '../utils/formatters';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

const typeIcons = {
  SPENDING_ALERT: '⚠️', SAVINGS_OPPORTUNITY: '💡', DEBT_STRATEGY: '🏦',
  BUDGET_EXCEEDED: '📊', INCOME_GROWTH: '📈', EXPENSE_REDUCTION: '✂️',
  GOAL_PROGRESS: '🎯', CASH_FLOW_RISK: '🚨', GENERAL: '💬',
};

const typeLabels = {
  SPENDING_ALERT: 'Alerta de gasto', SAVINGS_OPPORTUNITY: 'Oportunidad de ahorro',
  DEBT_STRATEGY: 'Estrategia de deuda', BUDGET_EXCEEDED: 'Presupuesto excedido',
  INCOME_GROWTH: 'Crecimiento de ingresos', EXPENSE_REDUCTION: 'Reducción de gastos',
  GOAL_PROGRESS: 'Progreso de meta', CASH_FLOW_RISK: 'Riesgo de flujo de caja',
  GENERAL: 'General',
};

export default function Recommendations() {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try { const r = await recommendationsAPI.getAll(); setRecommendations(r.data); }
    catch { toast.error('Error al cargar sugerencias'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleDismiss = async (id) => {
    try {
      await recommendationsAPI.dismiss(id);
      setRecommendations((prev) => prev.filter((r) => r.id !== id));
    } catch { toast.error('Error'); }
  };

  const handleMarkAllRead = async () => {
    try { await recommendationsAPI.markAllRead(); load(); toast.success('Todas leídas'); }
    catch { toast.error('Error'); }
  };

  const unread = recommendations.filter((r) => !r.isRead).length;

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          {unread > 0 && <Badge color="primary">{unread} nuevas</Badge>}
        </div>
        {unread > 0 && (
          <Button variant="secondary" size="sm" onClick={handleMarkAllRead}>Marcar todas como leídas</Button>
        )}
      </div>

      {recommendations.length === 0 ? (
        <Card className="text-center py-16">
          <p className="text-5xl mb-4">✨</p>
          <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-2">Sin sugerencias activas</h3>
          <p className="text-sm text-slate-400">Tu situación financiera se ve bien. Las sugerencias aparecerán automáticamente cuando detectemos oportunidades de mejora.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {recommendations.map((rec) => (
            <Card key={rec.id} className={`transition-all ${!rec.isRead ? 'border-l-4' : ''}`} style={!rec.isRead ? { borderLeftColor: rec.priority === 'CRITICAL' ? '#ef4444' : rec.priority === 'HIGH' ? '#f59e0b' : '#6366f1' } : {}}>
              <div className="flex gap-4">
                <div className="text-3xl flex-shrink-0">{typeIcons[rec.type] || '💡'}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold text-slate-900 dark:text-white">{rec.title}</h4>
                      <Badge color={priorityColor(rec.priority)}>{priorityLabel(rec.priority)}</Badge>
                      <span className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-700/50 px-2 py-0.5 rounded-full">{typeLabels[rec.type]}</span>
                      {!rec.isRead && <span className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0" />}
                    </div>
                    <button onClick={() => handleDismiss(rec.id)} className="text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400 text-sm flex-shrink-0 transition-colors" title="Descartar">×</button>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">{rec.message}</p>
                  <p className="text-xs text-slate-400">{formatDate(rec.createdAt)}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
