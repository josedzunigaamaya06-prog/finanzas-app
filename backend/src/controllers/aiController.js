const { PrismaClient } = require('@prisma/client');
const { suggestCategory } = require('../services/aiService');

const prisma = new PrismaClient();

const suggestCategoryForExpense = async (req, res, next) => {
  try {
    const { description } = req.body;
    if (!description?.trim()) return res.json({ category: null });

    // Categorías disponibles para el usuario
    const categories = await prisma.category.findMany({
      where: {
        OR: [{ isDefault: true }, { userId: req.user.id }],
        type: { in: ['EXPENSE', 'BOTH'] },
      },
      orderBy: { name: 'asc' },
    });

    const category = await suggestCategory(description, categories);
    res.json({ category });
  } catch (err) {
    // No bloquear con error si la IA falla — simplemente no sugerir
    console.error('AI suggestion error:', err.message);
    res.json({ category: null });
  }
};

module.exports = { suggestCategoryForExpense };
