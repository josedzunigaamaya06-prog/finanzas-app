const { getPaginationParams, buildDateFilter } = require('../utils/helpers');

const prisma = require('../lib/prisma');

const getAll = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { skip, limit, page } = getPaginationParams(req.query);
    const { startDate, endDate, categoryId, search } = req.query;

    const where = { userId };
    const dateFilter = buildDateFilter(startDate, endDate);
    if (dateFilter) where.date = dateFilter;
    if (categoryId) where.categoryId = categoryId;
    if (search) where.description = { contains: search, mode: 'insensitive' };

    const [total, incomes] = await Promise.all([
      prisma.income.count({ where }),
      prisma.income.findMany({
        where,
        include: { category: true },
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    res.json({
      data: incomes.map((i) => ({ ...i, amount: Number(i.amount) })),
      meta: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
};

const getOne = async (req, res, next) => {
  try {
    const income = await prisma.income.findFirst({
      where: { id: req.params.id, userId: req.user.id },
      include: { category: true },
    });
    if (!income) return res.status(404).json({ message: 'Ingreso no encontrado' });
    res.json({ ...income, amount: Number(income.amount) });
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const { amount, description, date, categoryId, isRecurring, frequency, tags, paymentMethod, walletId } = req.body;

    const ops = [
      prisma.income.create({
        data: {
          userId: req.user.id,
          amount,
          description,
          date: new Date(date),
          categoryId: categoryId || null,
          isRecurring: isRecurring || false,
          frequency: frequency || null,
          tags: tags || [],
          paymentMethod: paymentMethod || null,
          walletId: walletId || null,
        },
        include: { category: true },
      }),
    ];

    if (walletId) {
      ops.push(
        prisma.wallet.update({
          where: { id: walletId },
          data: { balance: { increment: amount } },
        })
      );
    }

    const [income] = await prisma.$transaction(ops);
    res.status(201).json({ message: 'Ingreso creado', income: { ...income, amount: Number(income.amount) } });
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const existing = await prisma.income.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!existing) return res.status(404).json({ message: 'Ingreso no encontrado' });

    const { amount, description, date, categoryId, isRecurring, frequency, tags, paymentMethod, walletId } = req.body;

    const newAmount   = amount   !== undefined ? amount   : Number(existing.amount);
    const newWalletId = walletId !== undefined ? walletId : existing.walletId;
    const oldAmount   = Number(existing.amount);
    const oldWalletId = existing.walletId;

    const ops = [
      prisma.income.update({
        where: { id: req.params.id },
        data: {
          ...(amount !== undefined && { amount }),
          ...(description && { description }),
          ...(date && { date: new Date(date) }),
          ...(categoryId !== undefined && { categoryId: categoryId || null }),
          ...(isRecurring !== undefined && { isRecurring }),
          ...(frequency !== undefined && { frequency: frequency || null }),
          ...(tags && { tags }),
          ...(paymentMethod !== undefined && { paymentMethod: paymentMethod || null }),
          ...(walletId !== undefined && { walletId: walletId || null }),
        },
        include: { category: true },
      }),
    ];

    // Revertir efecto en wallet anterior
    if (oldWalletId) {
      ops.push(prisma.wallet.update({ where: { id: oldWalletId }, data: { balance: { decrement: oldAmount } } }));
    }
    // Aplicar efecto en wallet nuevo
    if (newWalletId) {
      ops.push(prisma.wallet.update({ where: { id: newWalletId }, data: { balance: { increment: newAmount } } }));
    }

    const [income] = await prisma.$transaction(ops);
    res.json({ message: 'Ingreso actualizado', income: { ...income, amount: Number(income.amount) } });
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    const existing = await prisma.income.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!existing) return res.status(404).json({ message: 'Ingreso no encontrado' });

    const ops = [prisma.income.delete({ where: { id: req.params.id } })];

    if (existing.walletId) {
      ops.push(
        prisma.wallet.update({
          where: { id: existing.walletId },
          data: { balance: { decrement: Number(existing.amount) } },
        })
      );
    }

    await prisma.$transaction(ops);
    res.json({ message: 'Ingreso eliminado' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, getOne, create, update, remove };
