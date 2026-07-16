
const prisma = require('../lib/prisma');

// Capacidad de ahorro: devuelve los gastos fijos mensuales y los pagos de deuda
// que la app ya conoce. El frontend los combina con el ingreso fijo que digita
// el usuario para recomendar una cuota de aporte a sus metas.
const getSavingsCapacity = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    // Mes anterior completo (los gastos fijos son estables; el mes en curso puede
    // ir a mitad de camino y subestimar). Respaldo al mes actual si no hay historia.
    const prevStart = new Date(year, month - 1, 1);
    const prevEnd   = new Date(year, month, 0, 23, 59, 59, 999);
    const curStart  = new Date(year, month, 1);

    const [prevFixed, curFixed, debts] = await Promise.all([
      prisma.expense.aggregate({
        where: { userId, type: 'FIXED', date: { gte: prevStart, lte: prevEnd } },
        _sum: { amount: true },
      }),
      prisma.expense.aggregate({
        where: { userId, type: 'FIXED', date: { gte: curStart } },
        _sum: { amount: true },
      }),
      prisma.debt.findMany({ where: { userId, isActive: true }, select: { minimumPayment: true } }),
    ]);

    const prevFixedTotal = Number(prevFixed._sum.amount || 0);
    const curFixedTotal  = Number(curFixed._sum.amount || 0);
    const monthlyFixedExpenses = prevFixedTotal > 0 ? prevFixedTotal : curFixedTotal;
    const monthlyDebtPayments  = debts.reduce((s, d) => s + Number(d.minimumPayment), 0);

    res.json({
      monthlyFixedExpenses,
      monthlyDebtPayments,
      hasData: monthlyFixedExpenses > 0 || monthlyDebtPayments > 0,
    });
  } catch (err) {
    next(err);
  }
};

const getAll = async (req, res, next) => {
  try {
    const goals = await prisma.goal.findMany({
      where: { userId: req.user.id },
      include: { contributions: { orderBy: { date: 'desc' }, take: 5 } },
      orderBy: { createdAt: 'desc' },
    });

    res.json(goals.map((g) => ({
      ...g,
      targetAmount: Number(g.targetAmount),
      currentAmount: Number(g.currentAmount),
      progress: Number(g.targetAmount) > 0 ? (Number(g.currentAmount) / Number(g.targetAmount)) * 100 : 0,
      contributions: g.contributions.map((c) => ({ ...c, amount: Number(c.amount) })),
    })));
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const { name, description, targetAmount, deadline, color, icon } = req.body;
    const goal = await prisma.goal.create({
      data: {
        userId: req.user.id,
        name,
        description: description || null,
        targetAmount,
        deadline: deadline ? new Date(deadline) : null,
        color: color || '#6366f1',
        icon: icon || '🎯',
      },
    });
    res.status(201).json({ message: 'Meta creada', goal });
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const existing = await prisma.goal.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!existing) return res.status(404).json({ message: 'Meta no encontrada' });

    const goal = await prisma.goal.update({
      where: { id: req.params.id },
      data: {
        ...req.body,
        ...(req.body.deadline && { deadline: new Date(req.body.deadline) }),
      },
    });
    res.json({ message: 'Meta actualizada', goal });
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    const existing = await prisma.goal.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!existing) return res.status(404).json({ message: 'Meta no encontrada' });
    await prisma.goal.delete({ where: { id: req.params.id } });
    res.json({ message: 'Meta eliminada' });
  } catch (err) {
    next(err);
  }
};

const addContribution = async (req, res, next) => {
  try {
    const goal = await prisma.goal.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!goal) return res.status(404).json({ message: 'Meta no encontrada' });

    const { amount, date, note } = req.body;
    const contribution = await prisma.goalContribution.create({
      data: { goalId: goal.id, amount, date: new Date(date), note: note || null },
    });

    const newAmount = Math.min(Number(goal.currentAmount) + Number(amount), Number(goal.targetAmount));
    const isCompleted = newAmount >= Number(goal.targetAmount);
    await prisma.goal.update({
      where: { id: goal.id },
      data: { currentAmount: newAmount, isCompleted },
    });

    res.status(201).json({ message: 'Contribución registrada', contribution });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, getSavingsCapacity, create, update, remove, addContribution };
