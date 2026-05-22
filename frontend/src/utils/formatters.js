export const formatCurrency = (amount, currency = 'COP') => {
  if (amount === null || amount === undefined) return '-';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatPercent = (value, decimals = 1) => {
  if (value === null || value === undefined) return '-';
  return `${Number(value).toFixed(decimals)}%`;
};

export const formatDate = (date, options = {}) => {
  if (!date) return '-';
  return new Intl.DateTimeFormat('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  }).format(new Date(date));
};

export const formatMonthYear = (date) => {
  return new Intl.DateTimeFormat('es-CO', { month: 'long', year: 'numeric' }).format(new Date(date));
};

export const toInputDate = (date) => {
  if (!date) return '';
  return new Date(date).toISOString().split('T')[0];
};

export const getMonthName = (month) => {
  const d = new Date(2024, month - 1, 1);
  return d.toLocaleString('es-CO', { month: 'long' });
};

export const priorityColor = (priority) => {
  const map = { CRITICAL: 'danger', HIGH: 'warning', MEDIUM: 'info', LOW: 'default' };
  return map[priority] || 'default';
};

export const priorityLabel = (priority) => {
  const map = { CRITICAL: 'Crítico', HIGH: 'Alto', MEDIUM: 'Medio', LOW: 'Bajo' };
  return map[priority] || priority;
};
