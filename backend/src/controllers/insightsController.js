const prisma = require('../lib/prisma');

const getInsights = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const now    = new Date();

    // ── Periodo para gastos hormiga: últimos 30 días ──────────────────────────
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // ── Periodo para suscripciones olvidadas: últimos 3 meses ─────────────────
    const threeMonthsAgo = new Date(now);
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const [recentExpenses, olderExpenses] = await Promise.all([
      prisma.expense.findMany({
        where:   { userId, date: { gte: thirtyDaysAgo } },
        include: { category: true },
        orderBy: { date: 'asc' },
      }),
      prisma.expense.findMany({
        where:   { userId, date: { gte: threeMonthsAgo } },
        orderBy: { date: 'asc' },
      }),
    ]);

    // ── GASTOS HORMIGA ────────────────────────────────────────────────────────
    // Agrupar por categoría en los últimos 30 días
    const totalSpending = recentExpenses.reduce((s, e) => s + Number(e.amount), 0);
    const byCategory    = {};

    recentExpenses.forEach((exp) => {
      const key = exp.categoryId || '__none__';
      if (!byCategory[key]) {
        byCategory[key] = {
          categoryId:   exp.categoryId,
          categoryName: exp.category?.name || 'Sin categoría',
          categoryIcon: exp.category?.icon || '🏷️',
          categoryColor: exp.category?.color || '#6366f1',
          expenses: [],
          total:    0,
          count:    0,
        };
      }
      byCategory[key].expenses.push(exp);
      byCategory[key].total += Number(exp.amount);
      byCategory[key].count++;
    });

    // Detectar categorías "hormiga": muchas transacciones pequeñas con impacto alto
    const hormigaGroups = Object.values(byCategory)
      .map((g) => ({ ...g, avg: g.total / g.count, percentage: totalSpending > 0 ? (g.total / totalSpending) * 100 : 0 }))
      .filter((g) => g.count >= 4 && g.percentage >= 8) // 4+ transacciones, 8%+ del gasto total
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)
      .map((g) => ({
        categoryId:   g.categoryId,
        categoryName: g.categoryName,
        categoryIcon: g.categoryIcon,
        categoryColor: g.categoryColor,
        count:      g.count,
        total:      Math.round(g.total),
        avg:        Math.round(g.avg),
        percentage: Math.round(g.percentage),
      }));

    // ── SUSCRIPCIONES OLVIDADAS ───────────────────────────────────────────────
    // Buscar descripciones que aparecen en 2+ meses distintos
    const byDescription = {};

    olderExpenses.forEach((exp) => {
      const key   = exp.description.toLowerCase().trim();
      const month = `${exp.date.getFullYear()}-${exp.date.getMonth()}`;
      if (!byDescription[key]) {
        byDescription[key] = {
          description: exp.description,
          months:      new Set(),
          amounts:     [],
          total:       0,
          lastDate:    exp.date,
        };
      }
      byDescription[key].months.add(month);
      byDescription[key].amounts.push(Number(exp.amount));
      byDescription[key].total += Number(exp.amount);
      if (exp.date > byDescription[key].lastDate) {
        byDescription[key].lastDate = exp.date;
      }
    });

    const forgottenSubs = Object.values(byDescription)
      .filter((d) => d.months.size >= 2) // aparece en al menos 2 meses
      .map((d) => {
        const amounts = d.amounts;
        const avgAmount = amounts.reduce((s, a) => s + a, 0) / amounts.length;
        // Detectar si los montos son similares (variación < 20%) → probable suscripción
        const maxAmount = Math.max(...amounts);
        const minAmount = Math.min(...amounts);
        const isSimilarAmount = maxAmount > 0 && (maxAmount - minAmount) / maxAmount < 0.3;
        return {
          description:    d.description,
          monthCount:     d.months.size,
          occurrences:    amounts.length,
          avgAmount:      Math.round(avgAmount),
          totalSpent:     Math.round(d.total),
          lastDate:       d.lastDate,
          isSimilarAmount,
        };
      })
      .filter((d) => d.isSimilarAmount) // solo los que tienen monto similar (más probable suscripción)
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 8);

    res.json({
      hormiga:      hormigaGroups,
      subscriptions: forgottenSubs,
      totalSpending: Math.round(totalSpending),
      periodDays:    30,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getInsights };
