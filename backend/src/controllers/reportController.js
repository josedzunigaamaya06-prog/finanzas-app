const { PrismaClient } = require('@prisma/client');
const financialService = require('../services/financialService');
const { getMonthRange } = require('../utils/helpers');

const prisma = new PrismaClient();

const getMonthlyReport = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const { start, end } = getMonthRange(year, month);

    const [totals, expensesByCategory, incomesByCategory, topExpenses] = await Promise.all([
      financialService.getMonthlyTotals(userId, year, month),
      financialService.getExpensesByCategory(userId, year, month),
      prisma.income.groupBy({
        by: ['categoryId'],
        where: { userId, date: { gte: start, lte: end } },
        _sum: { amount: true },
      }),
      prisma.expense.findMany({
        where: { userId, date: { gte: start, lte: end } },
        include: { category: true },
        orderBy: { amount: 'desc' },
        take: 10,
      }),
    ]);

    const categories = await prisma.category.findMany({
      where: { id: { in: incomesByCategory.map((i) => i.categoryId).filter(Boolean) } },
    });
    const catMap = Object.fromEntries(categories.map((c) => [c.id, c]));

    res.json({
      period: { month, year },
      totals,
      expensesByCategory,
      incomesByCategory: incomesByCategory.map((i) => ({
        category: catMap[i.categoryId] || { name: 'Sin categoría', color: '#64748b' },
        total: Number(i._sum.amount || 0),
      })),
      topExpenses: topExpenses.map((e) => ({ ...e, amount: Number(e.amount) })),
    });
  } catch (err) {
    next(err);
  }
};

const getAnnualReport = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const months = [];

    for (let m = 1; m <= 12; m++) {
      const totals = await financialService.getMonthlyTotals(userId, year, m);
      const d = new Date(year, m - 1, 1);
      months.push({
        month: m,
        label: d.toLocaleString('es-CO', { month: 'short' }),
        ...totals,
      });
    }

    const annual = months.reduce(
      (acc, m) => ({
        totalIncome: acc.totalIncome + m.totalIncome,
        totalExpenses: acc.totalExpenses + m.totalExpenses,
        netSavings: acc.netSavings + m.netSavings,
      }),
      { totalIncome: 0, totalExpenses: 0, netSavings: 0 }
    );

    annual.savingsRate = annual.totalIncome > 0 ? (annual.netSavings / annual.totalIncome) * 100 : 0;

    res.json({ year, months, annual });
  } catch (err) {
    next(err);
  }
};

const getCategories = async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      where: { OR: [{ isDefault: true }, { userId: req.user.id }] },
      orderBy: { name: 'asc' },
    });
    res.json(categories);
  } catch (err) {
    next(err);
  }
};

module.exports = { getMonthlyReport, getAnnualReport, getCategories };
