
const prisma = require('../lib/prisma');

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

module.exports = { getAll, create, update, remove, addContribution };
