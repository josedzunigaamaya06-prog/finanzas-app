const { getMonthRange } = require('../utils/helpers');

const prisma = require('../lib/prisma');

const getMonthlyTotals = async (userId, year, month) => {
  const { start, end } = getMonthRange(year, month);

  const [incomes, expenses] = await Promise.all([
    prisma.income.aggregate({
      where: { userId, date: { gte: start, lte: end } },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.expense.aggregate({
      where: { userId, date: { gte: start, lte: end } },
      _sum: { amount: true },
      _count: true,
    }),
  ]);

  const totalIncome   = Number(incomes._sum.amount || 0);
  const totalExpenses = Number(expenses._sum.amount || 0);
  const netSavings    = totalIncome - totalExpenses;
  const savingsRate   = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

  return {
    totalIncome,
    totalExpenses,
    netSavings,
    savingsRate:    Math.round(savingsRate * 100) / 100,
    incomeCount:    incomes._count,
    expenseCount:   expenses._count,
  };
};

// ─── Análisis por método de pago ────────────────────────────────────────────
const getPaymentMethodStats = async (userId, year, month) => {
  const { start, end } = getMonthRange(year, month);

  const [incomeByMethod, expenseByMethod] = await Promise.all([
    prisma.income.groupBy({
      by:    ['paymentMethod'],
      where: { userId, date: { gte: start, lte: end } },
      _sum:  { amount: true },
      _count: true,
    }),
    prisma.expense.groupBy({
      by:    ['paymentMethod'],
      where: { userId, date: { gte: start, lte: end } },
      _sum:  { amount: true },
      _count: true,
    }),
  ]);

  const parseMethod = (rows) => {
    const result = { DIGITAL: 0, CASH: 0, UNSPECIFIED: 0 };
    for (const r of rows) {
      const key = r.paymentMethod || 'UNSPECIFIED';
      result[key] = Number(r._sum.amount || 0);
    }
    return result;
  };

  const incomeMap  = parseMethod(incomeByMethod);
  const expenseMap = parseMethod(expenseByMethod);

  const totalIncome   = incomeMap.DIGITAL + incomeMap.CASH + incomeMap.UNSPECIFIED;
  const totalExpenses = expenseMap.DIGITAL + expenseMap.CASH + expenseMap.UNSPECIFIED;

  return {
    income: {
      digital:     incomeMap.DIGITAL,
      cash:        incomeMap.CASH,
      unspecified: incomeMap.UNSPECIFIED,
      digitalPct:  totalIncome > 0 ? (incomeMap.DIGITAL  / totalIncome) * 100 : 0,
      cashPct:     totalIncome > 0 ? (incomeMap.CASH      / totalIncome) * 100 : 0,
    },
    expenses: {
      digital:     expenseMap.DIGITAL,
      cash:        expenseMap.CASH,
      unspecified: expenseMap.UNSPECIFIED,
      digitalPct:  totalExpenses > 0 ? (expenseMap.DIGITAL  / totalExpenses) * 100 : 0,
      cashPct:     totalExpenses > 0 ? (expenseMap.CASH      / totalExpenses) * 100 : 0,
    },
    // ¿Gasta más en efectivo o digital?
    cashHeavy: expenseMap.CASH > expenseMap.DIGITAL,
    equilibrium: totalIncome > 0
      ? ((totalIncome - totalExpenses) / totalIncome) * 100
      : 0,
  };
};

// ─── Trend mensual ──────────────────────────────────────────────────────────
const getMonthlyTrend = async (userId, months = 6) => {
  const results = [];
  const now = new Date();

  for (let i = months - 1; i >= 0; i--) {
    const d     = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year  = d.getFullYear();
    const month = d.getMonth() + 1;
    const totals = await getMonthlyTotals(userId, year, month);
    results.push({
      month, year,
      label: d.toLocaleString('es-CO', { month: 'short', year: '2-digit' }),
      ...totals,
    });
  }
  return results;
};

// ─── Gastos por categoría ───────────────────────────────────────────────────
const getExpensesByCategory = async (userId, year, month) => {
  const { start, end } = getMonthRange(year, month);

  const expenses = await prisma.expense.groupBy({
    by:    ['categoryId'],
    where: { userId, date: { gte: start, lte: end } },
    _sum:  { amount: true },
    _count: true,
  });

  const categories = await prisma.category.findMany({
    where: { id: { in: expenses.map((e) => e.categoryId).filter(Boolean) } },
    select: { id: true, name: true, color: true, icon: true },
  });

  const catMap = Object.fromEntries(categories.map((c) => [c.id, c]));

  return expenses
    .map((e) => ({
      category: catMap[e.categoryId] || { name: 'Sin categoría', color: '#64748b', icon: '🔹' },
      total: Number(e._sum.amount || 0),
      count: e._count,
    }))
    .sort((a, b) => b.total - a.total);
};

// ─── Resumen de deudas ──────────────────────────────────────────────────────
const getDebtSummary = async (userId) => {
  const debts = await prisma.debt.findMany({
    where: { userId, isActive: true },
    select: { currentBalance: true, interestRate: true, minimumPayment: true, name: true, debtCategory: true, interestPeriod: true },
  });

  const totalBalance        = debts.reduce((s, d) => s + Number(d.currentBalance),  0);
  const totalMinimumPayment = debts.reduce((s, d) => s + Number(d.minimumPayment),   0);
  const avgInterestRate     = debts.length > 0
    ? debts.reduce((s, d) => s + Number(d.interestRate), 0) / debts.length
    : 0;

  return { totalBalance, totalMinimumPayment, avgInterestRate, count: debts.length };
};

// El score financiero vive en scoreService.js — motor único para /score y dashboard.

module.exports = {
  getMonthlyTotals,
  getMonthlyTrend,
  getExpensesByCategory,
  getDebtSummary,
  getPaymentMethodStats,
};
