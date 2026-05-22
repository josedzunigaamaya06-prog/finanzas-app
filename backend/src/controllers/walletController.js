const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const getAll = async (req, res, next) => {
  try {
    const wallets = await prisma.wallet.findMany({
      where: { userId: req.user.id, isActive: true },
      orderBy: { createdAt: 'asc' },
    });

    const totalDigital = wallets
      .filter((w) => w.type !== 'CASH')
      .reduce((s, w) => s + Number(w.balance), 0);

    const totalCash = wallets
      .filter((w) => w.type === 'CASH')
      .reduce((s, w) => s + Number(w.balance), 0);

    res.json({
      wallets: wallets.map((w) => ({ ...w, balance: Number(w.balance), description: w.notes })),
      summary: {
        totalDigital,
        totalCash,
        totalOverall: totalDigital + totalCash,
        count: wallets.length,
      },
    });
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const { name, type, balance, icon, color, notes, description } = req.body;
    const wallet = await prisma.wallet.create({
      data: {
        userId: req.user.id,
        name,
        type,
        balance: balance || 0,
        icon: icon || null,
        color: color || '#6366f1',
        notes: notes || description || null,
      },
    });
    res.status(201).json({ message: 'Monedero creado', wallet: { ...wallet, balance: Number(wallet.balance), description: wallet.notes } });
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const existing = await prisma.wallet.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!existing) return res.status(404).json({ message: 'Monedero no encontrado' });

    const { description, ...rest } = req.body;
    const data = { ...rest };
    if (description !== undefined) data.notes = description;

    const wallet = await prisma.wallet.update({
      where: { id: req.params.id },
      data,
    });
    res.json({ message: 'Monedero actualizado', wallet: { ...wallet, balance: Number(wallet.balance), description: wallet.notes } });
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    const existing = await prisma.wallet.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!existing) return res.status(404).json({ message: 'Monedero no encontrado' });
    await prisma.wallet.update({ where: { id: req.params.id }, data: { isActive: false } });
    res.json({ message: 'Monedero eliminado' });
  } catch (err) {
    next(err);
  }
};

const adjustBalance = async (req, res, next) => {
  try {
    const { amount, type, note } = req.body;
    const existing = await prisma.wallet.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!existing) return res.status(404).json({ message: 'Monedero no encontrado' });

    const currentBalance = Number(existing.balance);
    let newBalance;
    if (type === 'add')      newBalance = currentBalance + Number(amount);
    else if (type === 'subtract') newBalance = Math.max(0, currentBalance - Number(amount));
    else                     newBalance = Number(amount); // 'set'

    const wallet = await prisma.wallet.update({
      where: { id: req.params.id },
      data: { balance: newBalance },
    });
    res.json({ message: 'Saldo actualizado', wallet: { ...wallet, balance: Number(wallet.balance), description: wallet.notes } });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, create, update, remove, adjustBalance };
