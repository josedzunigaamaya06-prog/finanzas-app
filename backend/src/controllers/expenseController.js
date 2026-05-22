const { PrismaClient } = require('@prisma/client');
const { getPaginationParams, buildDateFilter } = require('../utils/helpers');

const prisma = new PrismaClient();

const getAll = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { skip, limit, page } = getPaginationParams(req.query);
    const { startDate, endDate, categoryId, type, search } = req.query;

    const where = { userId };
    const dateFilter = buildDateFilter(startDate, endDate);
    if (dateFilter) where.date = dateFilter;
    if (categoryId) where.categoryId = categoryId;
    if (type) where.type = type;
    if (search) where.description = { contains: search, mode: 'insensitive' };

    const [total, expenses] = await Promise.all([
      prisma.expense.count({ where }),
      prisma.expense.findMany({
        where,
        include: { category: true, budget: { include: { category: true } } },
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    res.json({
      data: expenses.map((e) => ({ ...e, amount: Number(e.amount) })),
      meta: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
};

const getOne = async (req, res, next) => {
  try {
    const expense = await prisma.expense.findFirst({
      where: { id: req.params.id, userId: req.user.id },
      include: { category: true },
    });
    if (!expense) return res.status(404).json({ message: 'Gasto no encontrado' });
    res.json({ ...expense, amount: Number(expense.amount) });
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const { amount, description, date, categoryId, type, isRecurring, frequency, tags, budgetId, paymentMethod, walletId } = req.body;
    const expense = await prisma.expense.create({
      data: {
        userId: req.user.id,
        amount,
        description,
        date: new Date(date),
        categoryId: categoryId || null,
        type: type || 'VARIABLE',
        isRecurring: isRecurring || false,
        frequency: frequency || null,
        tags: tags || [],
        budgetId: budgetId || null,
        paymentMethod: paymentMethod || null,
        walletId: walletId || null,
      },
      include: { category: true },
    });
    res.status(201).json({ message: 'Gasto registrado', expense: { ...expense, amount: Number(expense.amount) } });
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const existing = await prisma.expense.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!existing) return res.status(404).json({ message: 'Gasto no encontrado' });

    const { amount, description, date, categoryId, type, isRecurring, frequency, tags, budgetId, paymentMethod, walletId } = req.body;
    const expense = await prisma.expense.update({
      where: { id: req.params.id },
      data: {
        ...(amount !== undefined && { amount }),
        ...(description && { description }),
        ...(date && { date: new Date(date) }),
        ...(categoryId !== undefined && { categoryId: categoryId || null }),
        ...(type && { type }),
        ...(isRecurring !== undefined && { isRecurring }),
        ...(frequency !== undefined && { frequency: frequency || null }),
        ...(tags && { tags }),
        ...(budgetId !== undefined && { budgetId: budgetId || null }),
        ...(paymentMethod !== undefined && { paymentMethod: paymentMethod || null }),
        ...(walletId !== undefined && { walletId: walletId || null }),
      },
      include: { category: true },
    });
    res.json({ message: 'Gasto actualizado', expense: { ...expense, amount: Number(expense.amount) } });
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    const existing = await prisma.expense.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!existing) return res.status(404).json({ message: 'Gasto no encontrado' });
    await prisma.expense.delete({ where: { id: req.params.id } });
    res.json({ message: 'Gasto eliminado' });
  } catch (err) {
    next(err);
  }
};

const getCategories = async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      where: { OR: [{ isDefault: true }, { userId: req.user.id }], type: { in: ['EXPENSE', 'BOTH'] } },
      orderBy: { name: 'asc' },
    });
    res.json(categories);
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, getOne, create, update, remove, getCategories };
