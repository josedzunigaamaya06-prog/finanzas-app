const { PrismaClient } = require('@prisma/client');
const { getCurrentMonthYear, getMonthRange } = require('../utils/helpers');

const prisma = new PrismaClient();

const getAll = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { month, year } = getCurrentMonthYear();
    const queryMonth = parseInt(req.query.month) || month;
    const queryYear = parseInt(req.query.year) || year;

    const { start, end } = getMonthRange(queryYear, queryMonth);

    const budgets = await prisma.budget.findMany({
      where: { userId, month: queryMonth, year: queryYear },
      include: { category: true },
    });

    const enriched = await Promise.all(
      budgets.map(async (b) => {
        const spent = await prisma.expense.aggregate({
          where: { userId, categoryId: b.categoryId, date: { gte: start, lte: end } },
          _sum: { amount: true },
        });
        const spentAmount = Number(spent._sum.amount || 0);
        const budgetAmount = Number(b.amount);
        return {
          ...b,
          amount: budgetAmount,
          spent: spentAmount,
          remaining: budgetAmount - spentAmount,
          percentage: budgetAmount > 0 ? (spentAmount / budgetAmount) * 100 : 0,
        };
      })
    );

    res.json(enriched);
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const { categoryId, amount, month, year } = req.body;
    const budget = await prisma.budget.create({
      data: { userId: req.user.id, categoryId, amount, month, year },
      include: { category: true },
    });
    res.status(201).json({ message: 'Presupuesto creado', budget });
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const existing = await prisma.budget.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!existing) return res.status(404).json({ message: 'Presupuesto no encontrado' });
    const budget = await prisma.budget.update({
      where: { id: req.params.id },
      data: { amount: req.body.amount },
      include: { category: true },
    });
    res.json({ message: 'Presupuesto actualizado', budget });
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    const existing = await prisma.budget.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!existing) return res.status(404).json({ message: 'Presupuesto no encontrado' });
    await prisma.budget.delete({ where: { id: req.params.id } });
    res.json({ message: 'Presupuesto eliminado' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, create, update, remove };
