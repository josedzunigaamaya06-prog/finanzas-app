const prisma = require('../lib/prisma');

const getAll = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    const month = parseInt(req.query.month) || now.getMonth() + 1;
    const year  = parseInt(req.query.year)  || now.getFullYear();

    const challenges = await prisma.challenge.findMany({
      where: { userId, month, year },
      orderBy: { createdAt: 'desc' },
    });

    res.json(challenges.map((c) => ({
      ...c,
      targetAmount: Number(c.targetAmount),
      savedAmount:  Number(c.savedAmount),
      progress: Number(c.targetAmount) > 0
        ? Math.min((Number(c.savedAmount) / Number(c.targetAmount)) * 100, 100)
        : 0,
    })));
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    const { title, description, targetAmount, month, year, emoji } = req.body;

    const challenge = await prisma.challenge.create({
      data: {
        userId,
        title,
        description,
        targetAmount,
        month: month || now.getMonth() + 1,
        year:  year  || now.getFullYear(),
        emoji: emoji || '🎯',
      },
    });

    res.status(201).json({ ...challenge, targetAmount: Number(challenge.targetAmount), savedAmount: Number(challenge.savedAmount) });
  } catch (err) { next(err); }
};

const addProgress = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { amount } = req.body;

    const challenge = await prisma.challenge.findFirst({ where: { id, userId } });
    if (!challenge) return res.status(404).json({ message: 'Reto no encontrado' });

    const newSaved = Number(challenge.savedAmount) + Number(amount);
    const isCompleted = newSaved >= Number(challenge.targetAmount);

    const updated = await prisma.challenge.update({
      where: { id },
      data: { savedAmount: newSaved, isCompleted },
    });

    res.json({
      ...updated,
      targetAmount: Number(updated.targetAmount),
      savedAmount:  Number(updated.savedAmount),
      progress: Math.min((Number(updated.savedAmount) / Number(updated.targetAmount)) * 100, 100),
      justCompleted: isCompleted && !challenge.isCompleted,
    });
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    await prisma.challenge.deleteMany({ where: { id, userId } });
    res.json({ message: 'Reto eliminado' });
  } catch (err) { next(err); }
};

module.exports = { getAll, create, addProgress, remove };
