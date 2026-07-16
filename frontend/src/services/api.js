import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && error.response?.data?.code === 'TOKEN_EXPIRED' && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const { data } = await axios.post(`${api.defaults.baseURL}/auth/refresh`, { refreshToken });
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch {
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  verifyEmail: (data) => api.post('/auth/verify-email', data),
  resendVerification: (email) => api.post('/auth/resend-verification', { email }),
  login: (data) => api.post('/auth/login', data),
  refresh: (token) => api.post('/auth/refresh', { refreshToken: token }),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  deleteAccount: (password) => api.delete('/auth/account', { data: { password } }),
};

export const dashboardAPI = {
  get: (params) => api.get('/dashboard', { params }),
};

export const incomesAPI = {
  getAll: (params) => api.get('/incomes', { params }),
  create: (data) => api.post('/incomes', data),
  update: (id, data) => api.put(`/incomes/${id}`, data),
  remove: (id) => api.delete(`/incomes/${id}`),
};

export const expensesAPI = {
  getAll: (params) => api.get('/expenses', { params }),
  create: (data) => api.post('/expenses', data),
  update: (id, data) => api.put(`/expenses/${id}`, data),
  remove: (id) => api.delete(`/expenses/${id}`),
  getCategories: () => api.get('/expenses/categories'),
};

export const debtsAPI = {
  getAll: () => api.get('/debts'),
  getOne: (id) => api.get(`/debts/${id}`),
  create: (data) => api.post('/debts', data),
  update: (id, data) => api.put(`/debts/${id}`, data),
  remove: (id) => api.delete(`/debts/${id}`),
  addPayment: (id, data) => api.post(`/debts/${id}/payments`, data),
  getStrategies: (extra) => api.get('/debts/strategies', { params: { extra } }),
};

export const goalsAPI = {
  getAll: () => api.get('/goals'),
  getSavingsCapacity: () => api.get('/goals/savings-capacity'),
  create: (data) => api.post('/goals', data),
  update: (id, data) => api.put(`/goals/${id}`, data),
  remove: (id) => api.delete(`/goals/${id}`),
  addContribution: (id, data) => api.post(`/goals/${id}/contributions`, data),
};

export const budgetsAPI = {
  getAll: (params) => api.get('/budgets', { params }),
  create: (data) => api.post('/budgets', data),
  update: (id, data) => api.put(`/budgets/${id}`, data),
  remove: (id) => api.delete(`/budgets/${id}`),
};

export const recommendationsAPI = {
  getAll: () => api.get('/recommendations'),
  markRead: (id) => api.patch(`/recommendations/${id}/read`),
  dismiss: (id) => api.patch(`/recommendations/${id}/dismiss`),
  markAllRead: () => api.patch('/recommendations/read-all'),
};

export const reportsAPI = {
  getMonthly: (params) => api.get('/reports/monthly', { params }),
  getAnnual: (params) => api.get('/reports/annual', { params }),
  getCategories: () => api.get('/reports/categories'),
};

export const walletsAPI = {
  getAll: () => api.get('/wallets'),
  create: (data) => api.post('/wallets', data),
  update: (id, data) => api.put(`/wallets/${id}`, data),
  adjustBalance: (id, data) => api.patch(`/wallets/${id}/balance`, data),
  remove: (id) => api.delete(`/wallets/${id}`),
};

export const insightsAPI = {
  get: () => api.get('/insights'),
};

export const predictionAPI = {
  get: () => api.get('/prediction'),
};

export const scoreAPI = {
  get: () => api.get('/score'),
};

export const comparisonAPI = {
  get: (params) => api.get('/comparison', { params }),
};

export const streakAPI = {
  get: () => api.get('/streak'),
};

export const wrappedAPI = {
  get: (year) => api.get('/wrapped', { params: { year } }),
};

export const challengesAPI = {
  getAll:       (params) => api.get('/challenges', { params }),
  create:       (data)   => api.post('/challenges', data),
  addProgress:  (id, amount) => api.post(`/challenges/${id}/progress`, { amount }),
  remove:       (id)     => api.delete(`/challenges/${id}`),
};

export const aiAPI = {
  suggestCategory: (description) => api.post('/ai/suggest-category', { description }),
};

export const autoRulesAPI = {
  getAll:  ()          => api.get('/auto-rules'),
  create:  (data)      => api.post('/auto-rules', data),
  update:  (id, data)  => api.put(`/auto-rules/${id}`, data),
  remove:  (id)        => api.delete(`/auto-rules/${id}`),
  check:   (description) => api.post('/auto-rules/check', { description }),
};

export const remindersAPI = {
  getAll: (params) => api.get('/reminders', { params }),
  getUpcoming: () => api.get('/reminders/upcoming'),
  create: (data) => api.post('/reminders', data),
  update: (id, data) => api.put(`/reminders/${id}`, data),
  remove: (id) => api.delete(`/reminders/${id}`),
  markPaid: (id, isPaid) => api.put(`/reminders/${id}`, { isPaid }),
};

export default api;
