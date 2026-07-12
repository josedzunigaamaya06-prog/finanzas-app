const prisma = require('../lib/prisma');

const getStreak = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Traer fechas de todos los gastos (últimos 365 días)
    const since = new Date();
    since.setDate(since.getDate() - 365);

    const expenses = await prisma.expense.findMany({
      where: { userId, date: { gte: since } },
      select: { date: true },
      orderBy: { date: 'desc' },
    });

    // Días únicos con registro
    const daySet = new Set(
      expenses.map((e) => new Date(e.date).toISOString().split('T')[0])
    );
    const days = [...daySet].sort().reverse();

    // Calcular racha actual (desde hoy hacia atrás)
    const today = new Date();
    let currentStreak = 0;
    let check = new Date(today);

    for (let i = 0; i < 366; i++) {
      const key = check.toISOString().split('T')[0];
      if (daySet.has(key)) {
        currentStreak++;
        check.setDate(check.getDate() - 1);
      } else if (i === 0) {
        // Si hoy no tiene registro, verificar ayer (gracia de 1 día)
        check.setDate(check.getDate() - 1);
      } else {
        break;
      }
    }

    // Calcular racha máxima histórica
    let maxStreak = 0;
    let tempStreak = 0;
    let prevDay = null;

    for (const day of [...days].reverse()) {
      const d = new Date(day);
      if (prevDay) {
        const diff = (d - prevDay) / (1000 * 60 * 60 * 24);
        if (diff === 1) {
          tempStreak++;
        } else {
          tempStreak = 1;
        }
      } else {
        tempStreak = 1;
      }
      maxStreak = Math.max(maxStreak, tempStreak);
      prevDay = d;
    }

    // Total días registrados en este mes
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const daysThisMonth = expenses.filter((e) => new Date(e.date) >= startOfMonth).length > 0
      ? new Set(expenses.filter((e) => new Date(e.date) >= startOfMonth).map((e) => new Date(e.date).toISOString().split('T')[0])).size
      : 0;

    res.json({
      currentStreak,
      maxStreak,
      totalDays: daySet.size,
      daysThisMonth,
      lastRecorded: days[0] || null,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getStreak };
