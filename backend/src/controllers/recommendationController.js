const { generateRecommendations } = require('../services/recommendationService');

const prisma = require('../lib/prisma');

const getAll = async (req, res, next) => {
  try {
    await generateRecommendations(req.user.id);
    const recommendations = await prisma.recommendation.findMany({
      where: { userId: req.user.id, isDismissed: false },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });
    res.json(recommendations);
  } catch (err) {
    next(err);
  }
};

const markRead = async (req, res, next) => {
  try {
    await prisma.recommendation.updateMany({
      where: { userId: req.user.id, id: req.params.id },
      data: { isRead: true },
    });
    res.json({ message: 'Marcada como leída' });
  } catch (err) {
    next(err);
  }
};

const dismiss = async (req, res, next) => {
  try {
    await prisma.recommendation.updateMany({
      where: { userId: req.user.id, id: req.params.id },
      data: { isDismissed: true },
    });
    res.json({ message: 'Recomendación descartada' });
  } catch (err) {
    next(err);
  }
};

const markAllRead = async (req, res, next) => {
  try {
    await prisma.recommendation.updateMany({
      where: { userId: req.user.id, isRead: false },
      data: { isRead: true },
    });
    res.json({ message: 'Todas marcadas como leídas' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, markRead, dismiss, markAllRead };
