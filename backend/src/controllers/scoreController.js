const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getScore = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const now    = new Date();
    const year   = now.getFullYear();
    const month  = now.getMonth();

    const monthStart      = new Date(year, month, 1);
    const lastMonthStart  = new Date(year, month - 1, 1);
    const lastMonthEnd    = new Date(year, month, 0, 23, 59, 59);
    const threeMonthsAgo  = new Date(year, month - 3, 1);

    // ── Datos necesarios ──────────────────────────────────────────────────────
    const [
      currentExpenses, currentIncomes,
      lastMonthExpenses, lastMonthIncomes,
      budgets, goals, debts,
    ] = await Promise.all([
      prisma.expense.findMany({ where: { userId, date: { gte: monthStart } } }),
      prisma.income.findMany({  where: { userId, date: { gte: monthStart } } }),
      prisma.expense.findMany({ where: { userId, date: { gte: lastMonthStart, lte: lastMonthEnd } } }),
      prisma.income.findMany({  where: { userId, date: { gte: lastMonthStart, lte: lastMonthEnd } } }),
      prisma.budget.findMany({
        where:   { userId, month: month + 1, year },
        include: { category: true },
      }),
      prisma.goal.findMany({ where: { userId, isCompleted: false } }),
      prisma.debt.findMany({ where: { userId, isActive: true } }),
    ]);

    // ── Totales base ──────────────────────────────────────────────────────────
    const income   = lastMonthIncomes.reduce((s, i) => s + Number(i.amount), 0);
    const expenses = lastMonthExpenses.reduce((s, e) => s + Number(e.amount), 0);
    const curExp   = currentExpenses.reduce((s, e) => s + Number(e.amount), 0);
    const curInc   = currentIncomes.reduce((s, i)  => s + Number(i.amount), 0);

    const components = [];
    let totalScore   = 0;

    // ── 1. TASA DE AHORRO (25 pts) ────────────────────────────────────────────
    let savingsScore = 0;
    let savingsRate  = 0;
    let savingsTip   = '';

    if (income > 0) {
      savingsRate = Math.max(0, (income - expenses) / income) * 100;
      if      (savingsRate >= 20) { savingsScore = 25; savingsTip = '¡Excelente! Estás ahorrando más del 20% de tus ingresos.'; }
      else if (savingsRate >= 10) { savingsScore = 17; savingsTip = 'Buen ritmo. Intenta llegar al 20% de ahorro mensual.'; }
      else if (savingsRate >= 5)  { savingsScore = 10; savingsTip = 'Estás ahorrando poco. Revisa tus gastos variables para liberar más margen.'; }
      else                        { savingsScore = 0;  savingsTip = 'Tus gastos superan o igualan tus ingresos. Necesitas reducir gastos urgentemente.'; }
    } else {
      savingsScore = 5;
      savingsTip   = 'Registra tus ingresos para calcular tu tasa de ahorro real.';
    }

    totalScore += savingsScore;
    components.push({ label: 'Tasa de ahorro', score: savingsScore, max: 25, value: `${Math.round(savingsRate)}%`, tip: savingsTip, icon: '💰' });

    // ── 2. CONTROL DE PRESUPUESTO (20 pts) ───────────────────────────────────
    let budgetScore = 0;
    let budgetTip   = '';

    if (budgets.length === 0) {
      budgetScore = 8;
      budgetTip   = 'Crea presupuestos por categoría para llevar un control más preciso.';
    } else {
      // Calcular gasto por categoría en el mes actual
      const catSpending = {};
      currentExpenses.forEach((e) => {
        if (e.categoryId) catSpending[e.categoryId] = (catSpending[e.categoryId] || 0) + Number(e.amount);
      });

      const exceeded  = budgets.filter((b) => (catSpending[b.categoryId] || 0) > Number(b.amount)).length;
      const nearLimit = budgets.filter((b) => {
        const pct = (catSpending[b.categoryId] || 0) / Number(b.amount);
        return pct >= 0.8 && pct <= 1;
      }).length;

      if (exceeded === 0 && nearLimit === 0)      { budgetScore = 20; budgetTip = '¡Todos tus presupuestos están bajo control!'; }
      else if (exceeded === 0)                     { budgetScore = 14; budgetTip = `${nearLimit} categoría(s) cerca del límite. Modera el gasto en ellas.`; }
      else if (exceeded <= budgets.length * 0.25) { budgetScore = 8;  budgetTip = `${exceeded} presupuesto(s) excedido(s). Revisa esas categorías.`; }
      else                                         { budgetScore = 0;  budgetTip = `${exceeded} presupuesto(s) excedido(s). Tu control de gastos necesita mejora urgente.`; }
    }

    totalScore += budgetScore;
    components.push({ label: 'Control de presupuesto', score: budgetScore, max: 20, value: `${budgets.length} presupuesto(s)`, tip: budgetTip, icon: '📊' });

    // ── 3. GASTOS FIJOS VS VARIABLES (15 pts) ────────────────────────────────
    let fixedScore = 0;
    let fixedTip   = '';

    const fixedExp    = lastMonthExpenses.filter((e) => e.type === 'FIXED').reduce((s, e) => s + Number(e.amount), 0);
    const fixedRatio  = expenses > 0 ? (fixedExp / expenses) * 100 : 0;

    if      (fixedRatio <= 50) { fixedScore = 15; fixedTip = 'Buena flexibilidad financiera. Tus gastos fijos no comprometen tu libertad.'; }
    else if (fixedRatio <= 65) { fixedScore = 10; fixedTip = 'Tus compromisos fijos son altos. Intenta reducir algún gasto fijo prescindible.'; }
    else if (fixedRatio <= 80) { fixedScore = 5;  fixedTip = 'Alta rigidez financiera. Más del 65% de tu gasto son compromisos fijos.'; }
    else                       { fixedScore = 0;  fixedTip = 'Tus gastos fijos consumen casi todo tu presupuesto. Muy poco margen de maniobra.'; }

    totalScore += fixedScore;
    components.push({ label: 'Gastos fijos vs variables', score: fixedScore, max: 15, value: `${Math.round(fixedRatio)}% fijos`, tip: fixedTip, icon: '⚖️' });

    // ── 4. METAS DE AHORRO (20 pts) ───────────────────────────────────────────
    let goalsScore = 0;
    let goalsTip   = '';

    if (goals.length === 0) {
      goalsScore = 0;
      goalsTip   = 'No tienes metas de ahorro. Crear una meta te ayuda a ser más disciplinado.';
    } else {
      const avgProgress = goals.reduce((s, g) => {
        return s + (Number(g.currentAmount) / Number(g.targetAmount)) * 100;
      }, 0) / goals.length;

      if      (avgProgress >= 50) { goalsScore = 20; goalsTip = `¡Excelente! Tus ${goals.length} meta(s) tienen un progreso promedio del ${Math.round(avgProgress)}%.`; }
      else if (avgProgress >= 20) { goalsScore = 13; goalsTip = `Buen avance en tus metas (${Math.round(avgProgress)}% promedio). Sigue contribuyendo regularmente.`; }
      else                        { goalsScore = 6;  goalsTip = `Tienes metas pero el progreso es bajo (${Math.round(avgProgress)}%). Intenta aportar algo cada mes.`; }
    }

    totalScore += goalsScore;
    components.push({ label: 'Metas de ahorro', score: goalsScore, max: 20, value: `${goals.length} meta(s)`, tip: goalsTip, icon: '🎯' });

    // ── 5. SITUACIÓN DE DEUDAS (20 pts) ──────────────────────────────────────
    let debtsScore = 0;
    let debtsTip   = '';

    if (debts.length === 0) {
      debtsScore = 20;
      debtsTip   = '¡Sin deudas activas! Excelente posición financiera.';
    } else {
      const totalDebtBalance   = debts.reduce((s, d) => s + Number(d.currentBalance), 0);
      const totalMinPayments   = debts.reduce((s, d) => s + Number(d.minimumPayment), 0);
      const debtToIncomeRatio  = income > 0 ? (totalMinPayments / income) * 100 : 100;

      if      (debtToIncomeRatio <= 15) { debtsScore = 16; debtsTip = `Tus pagos de deuda son manejables (${Math.round(debtToIncomeRatio)}% de ingresos).`; }
      else if (debtToIncomeRatio <= 30) { debtsScore = 10; debtsTip = `Tus deudas consumen el ${Math.round(debtToIncomeRatio)}% de tus ingresos. Considera pagar las de mayor interés primero.`; }
      else if (debtToIncomeRatio <= 50) { debtsScore = 4;  debtsTip = `Nivel de deuda alto (${Math.round(debtToIncomeRatio)}% de ingresos). Prioriza reducir deudas antes de otros gastos.`; }
      else                              { debtsScore = 0;  debtsTip = `Nivel de deuda crítico (${Math.round(debtToIncomeRatio)}% de ingresos). Busca reestructurar o negociar tus deudas.`; }
    }

    totalScore += debtsScore;
    components.push({ label: 'Situación de deudas', score: debtsScore, max: 20, value: `${debts.length} deuda(s)`, tip: debtsTip, icon: '🏦' });

    // ── Clasificación del score ───────────────────────────────────────────────
    let label, color;
    if      (totalScore >= 80) { label = 'Excelente'; color = 'green';  }
    else if (totalScore >= 60) { label = 'Bueno';     color = 'blue';   }
    else if (totalScore >= 40) { label = 'Regular';   color = 'amber';  }
    else                       { label = 'Crítico';   color = 'red';    }

    // Top 3 recomendaciones (las de peor score relativo)
    const recommendations = components
      .map((c) => ({ ...c, ratio: c.score / c.max }))
      .sort((a, b) => a.ratio - b.ratio)
      .slice(0, 3)
      .map((c) => ({ icon: c.icon, label: c.label, tip: c.tip }));

    res.json({ score: totalScore, label, color, components, recommendations });
  } catch (err) {
    next(err);
  }
};

module.exports = { getScore };
