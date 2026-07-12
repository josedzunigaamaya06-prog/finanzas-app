const financialService = require('../services/financialService');
const prisma = require('../lib/prisma');

const getComparison = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { type = 'month', year1, month1, year2, month2, yearA, yearB } = req.query;

    if (type === 'month') {
      const y1 = parseInt(year1) || new Date().getFullYear();
      const m1 = parseInt(month1) || new Date().getMonth();
      const y2 = parseInt(year2) || new Date().getFullYear();
      const m2 = parseInt(month2) || new Date().getMonth() + 1;

      const [periodA, periodB] = await Promise.all([
        financialService.getMonthlyTotals(userId, y1, m1),
        financialService.getMonthlyTotals(userId, y2, m2),
      ]);

      const labelA = new Date(y1, m1 - 1, 1).toLocaleString('es-CO', { month: 'long', year: 'numeric' });
      const labelB = new Date(y2, m2 - 1, 1).toLocaleString('es-CO', { month: 'long', year: 'numeric' });

      // Gastos por categoría de cada período
      const [catA, catB] = await Promise.all([
        financialService.getExpensesByCategory(userId, y1, m1),
        financialService.getExpensesByCategory(userId, y2, m2),
      ]);

      return res.json({ type: 'month', labelA, labelB, periodA, periodB, catA, catB });
    }

    // type === 'year'
    const ya = parseInt(yearA) || new Date().getFullYear() - 1;
    const yb = parseInt(yearB) || new Date().getFullYear();

    const buildYear = async (y) => {
      const months = [];
      for (let m = 1; m <= 12; m++) {
        const t = await financialService.getMonthlyTotals(userId, y, m);
        months.push(t);
      }
      return months.reduce(
        (acc, m) => ({
          totalIncome: acc.totalIncome + m.totalIncome,
          totalExpenses: acc.totalExpenses + m.totalExpenses,
          netSavings: acc.netSavings + m.netSavings,
        }),
        { totalIncome: 0, totalExpenses: 0, netSavings: 0 }
      );
    };

    const [yearDataA, yearDataB] = await Promise.all([buildYear(ya), buildYear(yb)]);
    yearDataA.savingsRate = yearDataA.totalIncome > 0 ? (yearDataA.netSavings / yearDataA.totalIncome) * 100 : 0;
    yearDataB.savingsRate = yearDataB.totalIncome > 0 ? (yearDataB.netSavings / yearDataB.totalIncome) * 100 : 0;

    res.json({ type: 'year', labelA: String(ya), labelB: String(yb), periodA: yearDataA, periodB: yearDataB });
  } catch (err) {
    next(err);
  }
};

module.exports = { getComparison };
