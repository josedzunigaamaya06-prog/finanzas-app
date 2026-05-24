const { PrismaClient } = require('@prisma/client');
const { getPaginationParams, buildDateFilter } = require('../utils/helpers');
const { applyRules }    = require('./autoRulesController');
const { trackPattern }  = require('./patternController');

const prisma = new PrismaClient();

// ─── Verificar presupuesto después de cada gasto ──────────────────────────────

const checkBudgetAlert = async (userId, categoryId, date) => {
  if (!categoryId) return;

  try {
    const expDate = new Date(date);
    const month = expDate.getMonth() + 1;
    const year  = expDate.getFullYear();

    // Buscar presupuesto para esta categoría y mes
    const budget = await prisma.budget.findFirst({
      where: { userId, categoryId, month, year },
      include: { category: true },
    });
    if (!budget) return;

    // Total gastado en esta categoría este mes
    const startDate = new Date(year, month - 1, 1);
    const endDate   = new Date(year, month, 0, 23, 59, 59);

    const agg = await prisma.expense.aggregate({
      where: { userId, categoryId, date: { gte: startDate, lte: endDate } },
      _sum: { amount: true },
    });

    const spent      = Number(agg._sum.amount || 0);
    const budgetAmt  = Number(budget.amount);
    const percentage = budgetAmt > 0 ? (spent / budgetAmt) * 100 : 0;

    const fmtCOP = (n) =>
      new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

    // Determinar nivel de alerta
    let alertType, priority, title, message;

    if (percentage >= 100) {
      alertType = 'BUDGET_EXCEEDED';
      priority  = 'CRITICAL';
      title     = `🚨 Presupuesto excedido: ${budget.category.name}`;
      message   = `Gastaste ${fmtCOP(spent)} de ${fmtCOP(budgetAmt)} en ${budget.category.name} (${Math.round(percentage)}%). ¡Ya superaste tu límite mensual!`;
    } else if (percentage >= 80) {
      alertType = 'SPENDING_ALERT';
      priority  = 'HIGH';
      title     = `⚠️ Presupuesto al ${Math.round(percentage)}%: ${budget.category.name}`;
      message   = `Llevas ${fmtCOP(spent)} de ${fmtCOP(budgetAmt)} en ${budget.category.name}. Te quedan solo ${fmtCOP(budgetAmt - spent)} para el resto del mes.`;
    } else {
      // Por debajo del 80% → eliminar alertas previas no descartadas
      await prisma.recommendation.deleteMany({
        where: {
          userId,
          type: { in: ['BUDGET_EXCEEDED', 'SPENDING_ALERT'] },
          isDismissed: false,
          isRead: false,
          data: { path: ['categoryId'], equals: categoryId },
        },
      });
      return;
    }

    // Eliminar alerta anterior de esta categoría (para no duplicar)
    await prisma.recommendation.deleteMany({
      where: {
        userId,
        type: { in: ['BUDGET_EXCEEDED', 'SPENDING_ALERT'] },
        isDismissed: false,
        data: { path: ['categoryId'], equals: categoryId },
      },
    });

    // Crear nueva alerta
    await prisma.recommendation.create({
      data: {
        userId,
        type:     alertType,
        priority,
        title,
        message,
        data: {
          categoryId,
          categoryName: budget.category.name,
          categoryIcon: budget.category.icon,
          budgetId:     budget.id,
          spent,
          budgetAmount: budgetAmt,
          percentage:   Math.round(percentage),
          month,
          year,
        },
        expiresAt: new Date(year, month, 1), // expira al inicio del próximo mes
      },
    });
  } catch (err) {
    // No bloquear la operación principal si falla la alerta
    console.error('Error en checkBudgetAlert:', err.message);
  }
};

// ─── Controladores ────────────────────────────────────────────────────────────

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
    const { amount, description, date, type, isRecurring, frequency, tags, budgetId, paymentMethod, walletId } = req.body;
    let { categoryId } = req.body;

    // Si no viene categoría, intentar aplicar regla automática
    if (!categoryId) {
      const ruleCategory = await applyRules(req.user.id, description);
      if (ruleCategory) categoryId = ruleCategory;
    }

    const expense = await prisma.expense.create({
      data: {
        userId:        req.user.id,
        amount,
        description,
        date:          new Date(date),
        categoryId:    categoryId    || null,
        type:          type          || 'VARIABLE',
        isRecurring:   isRecurring   || false,
        frequency:     frequency     || null,
        tags:          tags          || [],
        budgetId:      budgetId      || null,
        paymentMethod: paymentMethod || null,
        walletId:      walletId      || null,
      },
      include: { category: true },
    });

    // Aprendizaje de patrones (antes de responder para incluir en respuesta)
    const learnedRule = categoryId
      ? await trackPattern(req.user.id, description, categoryId).catch(() => null)
      : null;

    res.status(201).json({
      message: 'Gasto registrado',
      expense: { ...expense, amount: Number(expense.amount) },
      learnedRule, // { keyword, category } si se creó una nueva regla automática
    });

    // Verificar presupuesto en segundo plano
    checkBudgetAlert(req.user.id, categoryId, date).catch(console.error);
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
        ...(amount      !== undefined && { amount }),
        ...(description &&              { description }),
        ...(date &&                     { date: new Date(date) }),
        ...(categoryId  !== undefined && { categoryId: categoryId || null }),
        ...(type &&                     { type }),
        ...(isRecurring !== undefined && { isRecurring }),
        ...(frequency   !== undefined && { frequency: frequency || null }),
        ...(tags &&                     { tags }),
        ...(budgetId    !== undefined && { budgetId: budgetId || null }),
        ...(paymentMethod !== undefined && { paymentMethod: paymentMethod || null }),
        ...(walletId    !== undefined && { walletId: walletId || null }),
      },
      include: { category: true },
    });

    // Aprender patrón si el usuario cambió la categoría manualmente
    const finalCategoryId = categoryId !== undefined ? categoryId : existing.categoryId;
    const finalDate       = date || existing.date;
    const finalDescription = description || existing.description;
    let learnedRule = null;
    if (categoryId && categoryId !== existing.categoryId) {
      learnedRule = await trackPattern(req.user.id, finalDescription, categoryId).catch(() => null);
    }

    res.json({
      message: 'Gasto actualizado',
      expense: { ...expense, amount: Number(expense.amount) },
      learnedRule,
    });

    checkBudgetAlert(req.user.id, finalCategoryId, finalDate).catch(console.error);
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

    // Re-verificar presupuesto después de eliminar (puede que ya no esté en alerta)
    checkBudgetAlert(req.user.id, existing.categoryId, existing.date).catch(console.error);
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
