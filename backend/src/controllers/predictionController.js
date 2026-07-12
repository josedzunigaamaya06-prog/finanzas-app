const prisma = require('../lib/prisma');

const getPrediction = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const now    = new Date();
    const year   = now.getFullYear();
    const month  = now.getMonth();

    // ── Límites del mes actual ────────────────────────────────────────────────
    const monthStart    = new Date(year, month, 1);
    const monthEnd      = new Date(year, month + 1, 0);
    const daysInMonth   = monthEnd.getDate();
    const daysPassed    = now.getDate();
    const daysRemaining = daysInMonth - daysPassed;

    // ── Últimos 3 meses para baseline ─────────────────────────────────────────
    const threeMonthsAgo = new Date(year, month - 3, 1);

    const [currentExpenses, currentIncomes, historicalExpenses] = await Promise.all([
      prisma.expense.findMany({
        where:   { userId, date: { gte: monthStart, lte: now } },
        include: { category: true },
      }),
      prisma.income.findMany({
        where: { userId, date: { gte: monthStart, lte: now } },
      }),
      prisma.expense.findMany({
        where: { userId, date: { gte: threeMonthsAgo, lt: monthStart } },
      }),
    ]);

    // ── Totales del mes actual ────────────────────────────────────────────────
    const currentSpending = currentExpenses.reduce((s, e) => s + Number(e.amount), 0);
    const currentIncome   = currentIncomes.reduce((s, i)  => s + Number(i.amount), 0);

    // ── Tasa diaria histórica (últimos 3 meses) ───────────────────────────────
    const historicalSpending = historicalExpenses.reduce((s, e) => s + Number(e.amount), 0);
    const historicalDays     = Math.max((monthStart - threeMonthsAgo) / (1000 * 60 * 60 * 24), 1);
    const historicalDailyRate = historicalSpending / historicalDays;

    // ── Tasa diaria actual ────────────────────────────────────────────────────
    const currentDailyRate = daysPassed > 0 ? currentSpending / daysPassed : 0;

    // ── Tasa combinada: más peso al mes actual conforme pasan los días ────────
    const weight          = Math.min(daysPassed / 15, 1); // peso total a los 15 días
    const blendedDailyRate = (currentDailyRate * weight) + (historicalDailyRate * (1 - weight));

    // ── Proyección ────────────────────────────────────────────────────────────
    const predictedAdditional = blendedDailyRate * daysRemaining;
    const predictedTotal      = currentSpending + predictedAdditional;
    const monthlyHistAvg      = historicalSpending / 3;

    // ── Top categorías con proyección ─────────────────────────────────────────
    const byCategory = {};
    currentExpenses.forEach((exp) => {
      const key = exp.categoryId || '__none__';
      if (!byCategory[key]) {
        byCategory[key] = {
          categoryName:  exp.category?.name  || 'Sin categoría',
          categoryIcon:  exp.category?.icon  || '🏷️',
          categoryColor: exp.category?.color || '#6366f1',
          total: 0,
        };
      }
      byCategory[key].total += Number(exp.amount);
    });

    const topCategories = Object.values(byCategory)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)
      .map((c) => ({
        ...c,
        total:     Math.round(c.total),
        projected: daysPassed > 0 ? Math.round((c.total / daysPassed) * daysInMonth) : Math.round(c.total),
      }));

    // ── % cambio vs promedio histórico ────────────────────────────────────────
    const vsHistorical = monthlyHistAvg > 0
      ? Math.round(((predictedTotal - monthlyHistAvg) / monthlyHistAvg) * 100)
      : 0;

    res.json({
      currentSpending:     Math.round(currentSpending),
      predictedTotal:      Math.round(predictedTotal),
      predictedAdditional: Math.round(predictedAdditional),
      currentIncome:       Math.round(currentIncome),
      projectedBalance:    Math.round(currentIncome - predictedTotal),
      monthlyHistAvg:      Math.round(monthlyHistAvg),
      dailyRate:           Math.round(blendedDailyRate),
      daysPassed,
      daysInMonth,
      daysRemaining,
      monthProgress:     Math.round((daysPassed / daysInMonth) * 100),
      spendingProgress:  predictedTotal > 0 ? Math.round((currentSpending / predictedTotal) * 100) : 0,
      vsHistorical,
      topCategories,
      alert: predictedTotal > currentIncome && currentIncome > 0, // posible déficit
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getPrediction };
