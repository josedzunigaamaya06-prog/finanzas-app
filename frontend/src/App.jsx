import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore';
import useThemeStore from './store/themeStore';
import Layout from './components/layout/Layout';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import Dashboard from './pages/Dashboard';
import Incomes from './pages/Incomes';
import Expenses from './pages/Expenses';
import Debts from './pages/Debts';
import Goals from './pages/Goals';
import Budgets from './pages/Budgets';
import Reports from './pages/Reports';
import Recommendations from './pages/Recommendations';
import Profile from './pages/Profile';
import Wallets from './pages/Wallets';
import Calendar from './pages/Calendar';
import AutoRules from './pages/AutoRules';
import Insights from './pages/Insights';
import Prediction from './pages/Prediction';
import Score from './pages/Score';
import LoadingSpinner from './components/ui/LoadingSpinner';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthStore();
  if (isLoading) return <LoadingSpinner fullScreen />;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthStore();
  if (isLoading) return <LoadingSpinner fullScreen />;
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
};

export default function App() {
  const { init: initAuth } = useAuthStore();
  const { init: initTheme } = useThemeStore();

  useEffect(() => {
    initTheme();
    initAuth();
  }, []);

  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="incomes" element={<Incomes />} />
        <Route path="expenses" element={<Expenses />} />
        <Route path="debts" element={<Debts />} />
        <Route path="goals" element={<Goals />} />
        <Route path="budgets" element={<Budgets />} />
        <Route path="reports" element={<Reports />} />
        <Route path="wallets" element={<Wallets />} />
        <Route path="calendar" element={<Calendar />} />
        <Route path="recommendations" element={<Recommendations />} />
        <Route path="auto-rules" element={<AutoRules />} />
        <Route path="insights" element={<Insights />} />
        <Route path="prediction" element={<Prediction />} />
        <Route path="score"      element={<Score />} />
        <Route path="profile" element={<Profile />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
