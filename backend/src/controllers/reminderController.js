const { PrismaClient } = require('@prisma/client');
const { sendReminderEmail } = require('../services/emailService');
const prisma = new PrismaClient();

const fmt = (r) => ({ ...r, amount: r.amount != null ? Number(r.amount) : null });

// Calcular la siguiente fecha según la frecuencia
function getNextDate(date, frequency) {
  const d = new Date(date);
  switch (frequency) {
    case 'DAILY':    d.setDate(d.getDate() + 1);         break;
    case 'WEEKLY':   d.setDate(d.getDate() + 7);         break;
    case 'BIWEEKLY': d.setDate(d.getDate() + 14);        break;
    case 'MONTHLY':  d.setMonth(d.getMonth() + 1);       break;
    case 'YEARLY':   d.setFullYear(d.getFullYear() + 1); break;
  }
  return d;
}

// GET /reminders — todos o filtrado por mes/año
const getAll = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { month, year } = req.query;

    const where = { userId };
    if (month && year) {
      const m = parseInt(month);
      const y = parseInt(year);
      where.dueDate = {
        gte: new Date(y, m - 1, 1),
        lte: new Date(y, m, 0, 23, 59, 59),
      };
    }

    const reminders = await prisma.reminder.findMany({
      where,
      orderBy: { dueDate: 'asc' },
    });

    res.json({ success: true, data: reminders.map(fmt) });
  } catch (err) {
    next(err);
  }
};

// GET /reminders/upcoming — próximos 7 días sin pagar
const getUpcoming = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    const in7 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const reminders = await prisma.reminder.findMany({
      where: { userId, isPaid: false, dueDate: { gte: now, lte: in7 } },
      orderBy: { dueDate: 'asc' },
    });

    res.json({ success: true, data: reminders.map(fmt) });
  } catch (err) {
    next(err);
  }
};

// POST /reminders
const create = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { title, description, amount, dueDate, type, isRecurring, frequency, color } = req.body;

    if (!title || !dueDate || !type) {
      return res.status(400).json({ message: 'title, dueDate y type son requeridos' });
    }

    const reminder = await prisma.reminder.create({
      data: {
        userId,
        title,
        description: description || null,
        amount:      amount ? parseFloat(amount) : null,
        dueDate:     new Date(dueDate),
        type,
        isRecurring: Boolean(isRecurring),
        frequency:   frequency || null,
        color:       color || '#6366f1',
      },
    });

    // Enviar email de confirmación si hay API key configurada
    if (process.env.RESEND_API_KEY) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user) sendReminderEmail({ user, reminder: fmt(reminder) }).catch(console.error);
    }

    res.status(201).json({ success: true, data: fmt(reminder) });
  } catch (err) {
    next(err);
  }
};

// PUT /reminders/:id
const update = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { title, description, amount, dueDate, type, isRecurring, frequency, isPaid, color } = req.body;

    const existing = await prisma.reminder.findFirst({ where: { id, userId } });
    if (!existing) return res.status(404).json({ message: 'Recordatorio no encontrado' });

    // Si se marca como pagado y es recurrente → crear el siguiente
    if (isPaid === true && !existing.isPaid && existing.isRecurring && existing.frequency) {
      const nextDate = getNextDate(existing.dueDate, existing.frequency);
      await prisma.reminder.create({
        data: {
          userId,
          title:       existing.title,
          description: existing.description,
          amount:      existing.amount,
          dueDate:     nextDate,
          type:        existing.type,
          isRecurring: true,
          frequency:   existing.frequency,
          color:       existing.color,
        },
      });
    }

    const reminder = await prisma.reminder.update({
      where: { id },
      data: {
        title:       title       !== undefined ? title       : existing.title,
        description: description !== undefined ? description : existing.description,
        amount:      amount      !== undefined ? (amount ? parseFloat(amount) : null) : existing.amount,
        dueDate:     dueDate     !== undefined ? new Date(dueDate) : existing.dueDate,
        type:        type        !== undefined ? type        : existing.type,
        isRecurring: isRecurring !== undefined ? Boolean(isRecurring) : existing.isRecurring,
        frequency:   frequency   !== undefined ? (frequency || null)  : existing.frequency,
        isPaid:      isPaid      !== undefined ? Boolean(isPaid)      : existing.isPaid,
        color:       color       !== undefined ? color       : existing.color,
      },
    });

    res.json({ success: true, data: fmt(reminder) });
  } catch (err) {
    next(err);
  }
};

// DELETE /reminders/:id
const remove = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const existing = await prisma.reminder.findFirst({ where: { id, userId } });
    if (!existing) return res.status(404).json({ message: 'Recordatorio no encontrado' });

    await prisma.reminder.delete({ where: { id } });
    res.json({ success: true, message: 'Recordatorio eliminado' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, getUpcoming, create, update, remove };
