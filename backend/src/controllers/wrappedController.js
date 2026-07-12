const financialService = require('../services/financialService');
const prisma = require('../lib/prisma');

const getWrapped = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const year = parseInt(req.query.year) || new Date().getFullYear();

    const yearStart = new Date(year, 0, 1);
    const yearEnd   = new Date(year, 11, 31, 23, 59, 59);

    // ── Datos del año ─────────────────────────────────────────────────────────
    const [expenses, incomes, goals, debts] = await Promise.all([
      prisma.expense.findMany({
        where: { userId, date: { gte: yearStart, lte: yearEnd } },
        include: { category: true },
        orderBy: { amount: 'desc' },
      }),
      prisma.income.findMany({
        where: { userId, date: { gte: yearStart, lte: yearEnd } },
        include: { category: true },
      }),
      prisma.goal.findMany({ where: { userId } }),
      prisma.debt.findMany({ where: { userId } }),
    ]);

    const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);
    const totalIncome   = incomes.reduce((s, i)  => s + Number(i.amount), 0);
    const totalSavings  = totalIncome - totalExpenses;

    // ── Mes de mayor ahorro y mayor gasto ─────────────────────────────────────
    const monthlyStats = [];
    for (let m = 1; m <= 12; m++) {
      const totals = await financialService.getMonthlyTotals(userId, year, m);
      monthlyStats.push({ month: m, label: new Date(year, m - 1, 1).toLocaleString('es-CO', { month: 'long' }), ...totals });
    }
    const bestMonth  = monthlyStats.reduce((a, b) => (b.netSavings > a.netSavings ? b : a), monthlyStats[0]);
    const worstMonth = monthlyStats.reduce((a, b) => (b.totalExpenses > a.totalExpenses ? b : a), monthlyStats[0]);
    const posMonths  = monthlyStats.filter((m) => m.netSavings > 0).length;

    // ── Categoría favorita (más gastado) ─────────────────────────────────────
    const catTotals = {};
    expenses.forEach((e) => {
      if (!e.category) return;
      const key = e.categoryId;
      if (!catTotals[key]) catTotals[key] = { name: e.category.name, icon: e.category.icon, total: 0, count: 0 };
      catTotals[key].total += Number(e.amount);
      catTotals[key].count++;
    });
    const topCategories = Object.values(catTotals).sort((a, b) => b.total - a.total).slice(0, 5);
    const favoriteCategory = topCategories[0] || null;

    // ── Día de la semana con más gastos ───────────────────────────────────────
    const DOW = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const dowTotals = Array(7).fill(0);
    expenses.forEach((e) => { dowTotals[new Date(e.date).getDay()] += Number(e.amount); });
    const busiestDowIndex = dowTotals.indexOf(Math.max(...dowTotals));
    const busiestDay = DOW[busiestDowIndex];

    // ── Gasto más grande ──────────────────────────────────────────────────────
    const biggestExpense = expenses[0] ? {
      description: expenses[0].description,
      amount: Number(expenses[0].amount),
      category: expenses[0].category?.name,
      date: expenses[0].date,
    } : null;

    // ── Metas ─────────────────────────────────────────────────────────────────
    const completedGoals = goals.filter((g) => g.isCompleted).length;
    const avgGoalProgress = goals.length > 0
      ? goals.reduce((s, g) => s + (Number(g.currentAmount) / Number(g.targetAmount)) * 100, 0) / goals.length
      : 0;

    // ── Racha de meses positivos ──────────────────────────────────────────────
    let maxPositiveStreak = 0;
    let tempStreak = 0;
    for (const m of monthlyStats) {
      if (m.netSavings > 0) { tempStreak++; maxPositiveStreak = Math.max(maxPositiveStreak, tempStreak); }
      else { tempStreak = 0; }
    }

    // ── Promedio mensual ──────────────────────────────────────────────────────
    const activeMonths = monthlyStats.filter((m) => m.totalExpenses > 0).length || 1;
    const avgMonthlyExpense = totalExpenses / activeMonths;
    const avgMonthlyIncome  = totalIncome  / activeMonths;

    res.json({
      year,
      totalIncome,
      totalExpenses,
      totalSavings,
      savingsRate: totalIncome > 0 ? (totalSavings / totalIncome) * 100 : 0,
      bestMonth,
      worstMonth,
      posMonths,
      maxPositiveStreak,
      favoriteCategory,
      topCategories,
      busiestDay,
      biggestExpense,
      totalTransactions: expenses.length + incomes.length,
      avgMonthlyExpense,
      avgMonthlyIncome,
      completedGoals,
      avgGoalProgress,
      totalGoals: goals.length,
      activeDebts: debts.filter((d) => d.isActive).length,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getWrapped };
