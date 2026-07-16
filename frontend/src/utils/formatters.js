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

// Las fechas de transacción son fechas de calendario (sin hora real): se guardan
// como medianoche UTC. Por eso se formatean SIEMPRE en UTC — así el día mostrado
// coincide con el que el usuario eligió, sin importar su zona horaria. Formatear
// en hora local (Colombia UTC-5) corría la fecha un día hacia atrás.
export const formatDate = (date, options = {}) => {
  if (!date) return '-';
  return new Intl.DateTimeFormat('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
    ...options,
  }).format(new Date(date));
};

export const formatMonthYear = (date) => {
  return new Intl.DateTimeFormat('es-CO', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(date));
};

// Convierte una fecha guardada (medianoche UTC) al valor YYYY-MM-DD de un <input type="date">.
export const toInputDate = (date) => {
  if (!date) return '';
  return new Date(date).toISOString().split('T')[0];
};

// Fecha de HOY en la zona horaria LOCAL del usuario, como YYYY-MM-DD para inputs.
// No usar new Date().toISOString() para esto: eso da la fecha en UTC, que de noche
// (Colombia UTC-5) devuelve el día siguiente y hacía que el formulario naciera con
// la fecha de mañana por defecto.
export const todayInputDate = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
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
