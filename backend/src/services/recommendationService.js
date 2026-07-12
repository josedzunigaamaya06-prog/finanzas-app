const { getMonthRange } = require('../utils/helpers');
const debtService = require('./debtService');

const prisma = require('../lib/prisma');

const generateRecommendations = async (userId) => {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
  const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;

  const { start: curStart, end: curEnd } = getMonthRange(currentYear, currentMonth);
  const { start: prevStart, end: prevEnd } = getMonthRange(prevYear, prevMonth);

  const [currentExpenses, prevExpenses, currentIncomes, debts, budgets, goals, wallets] = await Promise.all([
    prisma.expense.findMany({ where: { userId, date: { gte: curStart, lte: curEnd } }, include: { category: true } }),
    prisma.expense.findMany({ where: { userId, date: { gte: prevStart, lte: prevEnd } }, include: { category: true } }),
    prisma.income.findMany({ where: { userId, date: { gte: curStart, lte: curEnd } } }),
    prisma.debt.findMany({ where: { userId, isActive: true } }),
    prisma.budget.findMany({ where: { userId, month: currentMonth, year: currentYear }, include: { category: true } }),
    prisma.goal.findMany({ where: { userId, isCompleted: false } }),
    prisma.wallet.findMany({ where: { userId, isActive: true } }),
  ]);

  const recommendations = [];

  const totalCurrentExpenses = currentExpenses.reduce((s, e) => s + Number(e.amount), 0);
  const totalPrevExpenses = prevExpenses.reduce((s, e) => s + Number(e.amount), 0);
  const totalIncome = currentIncomes.reduce((s, i) => s + Number(i.amount), 0);

  // Category spending alerts
  const groupByCategory = (expenses) => {
    return expenses.reduce((acc, e) => {
      const name = e.category?.name || 'Sin categoría';
      acc[name] = (acc[name] || 0) + Number(e.amount);
      return acc;
    }, {});
  };

  const curByCat = groupByCategory(currentExpenses);
  const prevByCat = groupByCategory(prevExpenses);

  for (const [cat, curAmt] of Object.entries(curByCat)) {
    const prevAmt = prevByCat[cat] || 0;
    if (prevAmt > 0) {
      const pctChange = ((curAmt - prevAmt) / prevAmt) * 100;
      if (pctChange > 25) {
        recommendations.push({
          type: 'SPENDING_ALERT',
          title: `Aumento en ${cat}`,
          message: `Tus gastos en ${cat} aumentaron un ${pctChange.toFixed(0)}% respecto al mes anterior. Considera revisar estos gastos.`,
          priority: pctChange > 50 ? 'HIGH' : 'MEDIUM',
          data: { category: cat, currentAmount: curAmt, previousAmount: prevAmt, percentageChange: pctChange },
        });
      }
    }
  }

  // Savings rate warning
  const netSavings = totalIncome - totalCurrentExpenses;
  const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

  if (savingsRate < 0) {
    recommendations.push({
      type: 'CASH_FLOW_RISK',
      title: 'Flujo de caja negativo',
      message: `Este mes gastas más de lo que ganas. Déficit de ${Math.abs(netSavings).toLocaleString('es-CO')} COP. Es urgente reducir gastos o aumentar ingresos.`,
      priority: 'CRITICAL',
      data: { savingsRate, deficit: Math.abs(netSavings) },
    });
  } else if (savingsRate < 10) {
    recommendations.push({
      type: 'SAVINGS_OPPORTUNITY',
      title: 'Tasa de ahorro muy baja',
      message: `Solo estás ahorrando el ${savingsRate.toFixed(1)}% de tus ingresos. Se recomienda ahorrar al menos el 20%. Intenta reducir gastos variables.`,
      priority: 'HIGH',
      data: { savingsRate },
    });
  }

  // Subscription spending analysis
  const subscriptionSpend = curByCat['Suscripciones'] || 0;
  if (subscriptionSpend > totalIncome * 0.05 && totalIncome > 0) {
    recommendations.push({
      type: 'EXPENSE_REDUCTION',
      title: 'Gasto alto en suscripciones',
      message: `Gastas ${subscriptionSpend.toLocaleString('es-CO')} COP en suscripciones (${((subscriptionSpend / totalIncome) * 100).toFixed(1)}% de tus ingresos). Revisa cuáles realmente usas.`,
      priority: 'MEDIUM',
      data: { amount: subscriptionSpend },
    });
  }

  // Debt recommendations
  const totalDebtBalance = debts.reduce((s, d) => s + Number(d.currentBalance), 0);
  const totalMinPayment = debts.reduce((s, d) => s + Number(d.minimumPayment), 0);
  const highInterestDebt = debts.filter((d) => Number(d.interestRate) > 0.25);

  if (highInterestDebt.length > 0) {
    recommendations.push({
      type: 'DEBT_STRATEGY',
      title: 'Deuda con interés muy alto',
      message: `Tienes ${highInterestDebt.length} deuda(s) con tasas superiores al 25% anual. Considera la estrategia avalanche: paga primero las deudas más caras para minimizar intereses.`,
      priority: 'HIGH',
      data: { debts: highInterestDebt.map((d) => ({ name: d.name, rate: d.interestRate })) },
    });
  }

  if (totalIncome > 0 && totalMinPayment / totalIncome > 0.40) {
    recommendations.push({
      type: 'CASH_FLOW_RISK',
      title: 'Carga de deuda crítica',
      message: `El ${((totalMinPayment / totalIncome) * 100).toFixed(0)}% de tus ingresos se va en pagos mínimos de deuda. Esto limita tu capacidad de ahorro e inversión.`,
      priority: 'CRITICAL',
      data: { debtToIncomeRatio: totalMinPayment / totalIncome },
    });
  }

  // Budget exceeded alerts
  for (const budget of budgets) {
    const catExpenses = currentExpenses
      .filter((e) => e.categoryId === budget.categoryId)
      .reduce((s, e) => s + Number(e.amount), 0);
    const budgetAmt = Number(budget.amount);
    const usedPct = budgetAmt > 0 ? (catExpenses / budgetAmt) * 100 : 0;

    if (usedPct > 100) {
      recommendations.push({
        type: 'BUDGET_EXCEEDED',
        title: `Presupuesto excedido: ${budget.category.name}`,
        message: `Has superado en un ${(usedPct - 100).toFixed(0)}% el presupuesto de ${budget.category.name}. Llevas ${catExpenses.toLocaleString('es-CO')} de ${budgetAmt.toLocaleString('es-CO')} COP.`,
        priority: 'HIGH',
        data: { category: budget.category.name, spent: catExpenses, budget: budgetAmt, percentage: usedPct },
      });
    } else if (usedPct > 80) {
      recommendations.push({
        type: 'BUDGET_EXCEEDED',
        title: `Presupuesto casi agotado: ${budget.category.name}`,
        message: `Has usado el ${usedPct.toFixed(0)}% del presupuesto de ${budget.category.name}. Te quedan ${(budgetAmt - catExpenses).toLocaleString('es-CO')} COP.`,
        priority: 'MEDIUM',
        data: { category: budget.category.name, spent: catExpenses, budget: budgetAmt, percentage: usedPct },
      });
    }
  }

  // Goal progress
  for (const goal of goals) {
    if (goal.deadline) {
      const daysLeft = Math.floor((new Date(goal.deadline) - now) / (1000 * 60 * 60 * 24));
      const progress = (Number(goal.currentAmount) / Number(goal.targetAmount)) * 100;
      const remaining = Number(goal.targetAmount) - Number(goal.currentAmount);

      if (daysLeft > 0 && daysLeft <= 30 && progress < 80) {
        recommendations.push({
          type: 'GOAL_PROGRESS',
          title: `Meta próxima a vencer: ${goal.name}`,
          message: `Tu meta "${goal.name}" vence en ${daysLeft} días y llevas el ${progress.toFixed(0)}%. Necesitas ahorrar ${remaining.toLocaleString('es-CO')} COP más.`,
          priority: daysLeft <= 7 ? 'HIGH' : 'MEDIUM',
          data: { goalName: goal.name, progress, daysLeft, remaining },
        });
      }
    }
  }

  // ── Deudas urgentes: gota a gota / terceros con interés ─────────────────
  const urgentDebts = debts.filter((d) => ['INFORMAL', 'THIRD_PARTY_INTEREST'].includes(d.debtCategory));
  if (urgentDebts.length > 0) {
    const annualRate = debtService.toAnnualRate(urgentDebts[0].interestRate, urgentDebts[0].interestPeriod || 'ANNUAL') * 100;
    recommendations.push({
      type: 'DEBT_NEGOTIATION',
      title: `⚠️ Deuda urgente: ${urgentDebts[0].name}`,
      message: `Tienes ${urgentDebts.length} deuda(s) con prestamistas informales o terceros con interés. La tasa de "${urgentDebts[0].name}" equivale al ${annualRate.toFixed(0)}% anual. Busca refinanciarla con un banco de inmediato.`,
      priority: 'CRITICAL',
      data: { debts: urgentDebts.map((d) => d.name) },
    });
  }

  // ── Deudas negociables (tarjetas, créditos banco con alta tasa) ───────────
  const negotiableDebts = debts.filter((d) => {
    const annual = debtService.toAnnualRate(d.interestRate, d.interestPeriod || 'ANNUAL') * 100;
    return d.isNegotiable && annual > 20 && !['INFORMAL', 'THIRD_PARTY_INTEREST'].includes(d.debtCategory);
  });
  if (negotiableDebts.length > 0) {
    recommendations.push({
      type: 'DEBT_NEGOTIATION',
      title: 'Puedes negociar mejores tasas',
      message: `${negotiableDebts.length} de tus deudas tienen tasas altas pero son negociables: ${negotiableDebts.map((d) => d.name).join(', ')}. Llama a tu banco y solicita una reducción de tasa o refinanciación.`,
      priority: 'MEDIUM',
      data: { debts: negotiableDebts.map((d) => ({ name: d.name, rate: d.interestRate })) },
    });
  }

  // ── Análisis método de pago ─────────────────────────────────────────────
  const cashExpenses = currentExpenses.filter((e) => e.paymentMethod === 'CASH').reduce((s, e) => s + Number(e.amount), 0);
  const digitalExpenses = currentExpenses.filter((e) => e.paymentMethod === 'DIGITAL').reduce((s, e) => s + Number(e.amount), 0);
  const totalTrackedExpenses = cashExpenses + digitalExpenses;

  if (totalTrackedExpenses > 0 && cashExpenses / totalTrackedExpenses > 0.6) {
    recommendations.push({
      type: 'PAYMENT_METHOD_INSIGHT',
      title: 'Gastos mayormente en efectivo',
      message: `El ${((cashExpenses / totalTrackedExpenses) * 100).toFixed(0)}% de tus gastos son en efectivo. Los pagos digitales te permiten rastrear mejor tus finanzas y a veces ofrecen beneficios (cashback, puntos).`,
      priority: 'LOW',
      data: { cashPct: (cashExpenses / totalTrackedExpenses) * 100 },
    });
  }

  // ── Billeteras con saldo bajo ──────────────────────────────────────────
  const lowWallets = wallets.filter((w) => Number(w.balance) < 50000 && w.type !== 'CASH');
  for (const w of lowWallets) {
    recommendations.push({
      type: 'WALLET_LOW_BALANCE',
      title: `Saldo bajo: ${w.name}`,
      message: `Tu billetera "${w.name}" tiene un saldo de ${Number(w.balance).toLocaleString('es-CO')} COP. Considera recargarla para evitar inconvenientes en pagos digitales.`,
      priority: 'LOW',
      data: { walletName: w.name, balance: Number(w.balance) },
    });
  }

  // Store new recommendations (replace old ones)
  await prisma.recommendation.deleteMany({ where: { userId } });
  if (recommendations.length > 0) {
    await prisma.recommendation.createMany({
      data: recommendations.map((r) => ({ ...r, userId })),
    });
  }

  return recommendations;
};

module.exports = { generateRecommendations };
