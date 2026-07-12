const debtService = require('../services/debtService');

const prisma = require('../lib/prisma');

const getAll = async (req, res, next) => {
  try {
    const debts = await prisma.debt.findMany({
      where: { userId: req.user.id },
      include: { payments: { orderBy: { date: 'desc' }, take: 3 } },
      orderBy: { currentBalance: 'desc' },
    });

    const enriched = debts.map((d) => {
      const annualRate = debtService.toAnnualRate(d.interestRate, d.interestPeriod) * 100;
      const monthlyInterest = debtService.calculateMonthlyInterest(
        Number(d.currentBalance), d.interestRate, d.interestPeriod, d.interestType
      );
      const payoff = debtService.calculatePayoffTime(
        Number(d.currentBalance), d.interestRate, d.interestPeriod,
        Number(d.minimumPayment), d.interestType
      );
      const recommendation = debtService.getDebtRecommendation(d);
      const riskLevel = debtService.getDebtRiskLevel(d);

      return {
        ...d,
        totalAmount:    Number(d.totalAmount),
        currentBalance: Number(d.currentBalance),
        interestRate:   Number(d.interestRate),
        minimumPayment: Number(d.minimumPayment),
        annualRate:     Math.round(annualRate * 100) / 100,
        monthlyInterest: Math.round(monthlyInterest * 100) / 100,
        payoff,
        recommendation,
        riskLevel,
        payments: d.payments.map((p) => ({ ...p, amount: Number(p.amount) })),
      };
    });

    res.json(enriched);
  } catch (err) {
    next(err);
  }
};

const getOne = async (req, res, next) => {
  try {
    const debt = await prisma.debt.findFirst({
      where: { id: req.params.id, userId: req.user.id },
      include: { payments: { orderBy: { date: 'desc' } } },
    });
    if (!debt) return res.status(404).json({ message: 'Deuda no encontrada' });

    const schedule = debtService.generatePaymentSchedule(
      Number(debt.currentBalance), debt.interestRate, debt.interestPeriod,
      Number(debt.minimumPayment), debt.interestType, 24
    );
    const recommendation = debtService.getDebtRecommendation(debt);

    res.json({
      ...debt,
      totalAmount:    Number(debt.totalAmount),
      currentBalance: Number(debt.currentBalance),
      interestRate:   Number(debt.interestRate),
      minimumPayment: Number(debt.minimumPayment),
      annualRate:     Math.round(debtService.toAnnualRate(debt.interestRate, debt.interestPeriod) * 10000) / 100,
      payments:       debt.payments.map((p) => ({ ...p, amount: Number(p.amount) })),
      schedule,
      recommendation,
    });
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const {
      name, entity, debtCategory, totalAmount, currentBalance,
      interestRate, interestPeriod, minimumPayment, dueDate,
      interestType, startDate, notes, isNegotiable,
    } = req.body;

    const debt = await prisma.debt.create({
      data: {
        userId:         req.user.id,
        name,
        entity,
        debtCategory:   debtCategory   || 'OTHER',
        totalAmount,
        currentBalance: currentBalance || totalAmount,
        interestRate,
        interestPeriod: interestPeriod || 'ANNUAL',
        minimumPayment,
        dueDate,
        interestType:   interestType   || 'COMPOUND',
        startDate:      new Date(startDate),
        notes:          notes          || null,
        isNegotiable:   isNegotiable   !== undefined ? isNegotiable : true,
      },
    });
    res.status(201).json({ message: 'Deuda registrada', debt });
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const existing = await prisma.debt.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!existing) return res.status(404).json({ message: 'Deuda no encontrada' });

    // Solo extraemos los campos válidos del modelo Debt (ignoramos campos calculados)
    const {
      name, entity, debtCategory, totalAmount, currentBalance,
      interestRate, interestPeriod, minimumPayment, dueDate,
      interestType, startDate, endDate, notes, isNegotiable, isActive,
    } = req.body;

    const debt = await prisma.debt.update({
      where: { id: req.params.id },
      data: {
        ...(name              !== undefined && { name }),
        ...(entity            !== undefined && { entity }),
        ...(debtCategory      !== undefined && { debtCategory }),
        ...(totalAmount       !== undefined && { totalAmount }),
        ...(currentBalance    !== undefined && { currentBalance }),
        ...(interestRate      !== undefined && { interestRate }),
        ...(interestPeriod    !== undefined && { interestPeriod }),
        ...(minimumPayment    !== undefined && { minimumPayment }),
        ...(dueDate           !== undefined && { dueDate: Number(dueDate) }),
        ...(interestType      !== undefined && { interestType }),
        ...(startDate                       && { startDate: new Date(startDate) }),
        ...(endDate                         && { endDate: new Date(endDate) }),
        ...(notes             !== undefined && { notes: notes || null }),
        ...(isNegotiable      !== undefined && { isNegotiable: Boolean(isNegotiable) }),
        ...(isActive          !== undefined && { isActive }),
      },
    });
    res.json({ message: 'Deuda actualizada', debt });
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    const existing = await prisma.debt.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!existing) return res.status(404).json({ message: 'Deuda no encontrada' });
    await prisma.debt.delete({ where: { id: req.params.id } });
    res.json({ message: 'Deuda eliminada' });
  } catch (err) {
    next(err);
  }
};

const addPayment = async (req, res, next) => {
  try {
    const debt = await prisma.debt.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!debt) return res.status(404).json({ message: 'Deuda no encontrada' });

    const { amount, date, note } = req.body;
    const payment = await prisma.debtPayment.create({
      data: { debtId: debt.id, amount, date: new Date(date), note: note || null },
    });

    const newBalance = Math.max(0, Number(debt.currentBalance) - Number(amount));
    await prisma.debt.update({
      where: { id: debt.id },
      data: { currentBalance: newBalance, isActive: newBalance > 0 },
    });

    res.status(201).json({ message: 'Pago registrado', payment });
  } catch (err) {
    next(err);
  }
};

const getStrategies = async (req, res, next) => {
  try {
    const debts = await prisma.debt.findMany({ where: { userId: req.user.id, isActive: true } });
    const extraPayment   = parseFloat(req.query.extra) || 0;
    const monthlySurplus = parseFloat(req.query.surplus) || extraPayment;

    const comparison    = debtService.compareStrategies(debts, extraPayment);
    const optimalPlan   = debtService.getOptimalPaymentPlan(debts, monthlySurplus);

    res.json({ comparison, optimalPlan });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, getOne, create, update, remove, addPayment, getStrategies };
