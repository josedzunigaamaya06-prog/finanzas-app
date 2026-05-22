// ─── Conversión de tasa ─────────────────────────────────────────────────────
const toAnnualRate = (rate, period) => {
  if (period === 'MONTHLY') return Math.pow(1 + Number(rate), 12) - 1;
  return Number(rate);
};

const toMonthlyRate = (rate, period) => {
  if (period === 'MONTHLY') return Number(rate);
  return Math.pow(1 + Number(rate), 1 / 12) - 1;
};

// ─── Interés mensual ────────────────────────────────────────────────────────
const calculateMonthlyInterest = (balance, rate, period, type) => {
  const monthly = toMonthlyRate(rate, period);
  if (type === 'SIMPLE') return Number(balance) * monthly;
  return Number(balance) * (Math.pow(1 + monthly, 1) - 1);
};

// ─── Tiempo para pagar ──────────────────────────────────────────────────────
const calculatePayoffTime = (balance, rate, period, monthlyPayment, interestType) => {
  if (monthlyPayment <= 0) return null;
  const monthly = toMonthlyRate(rate, period);
  let remaining = Number(balance);
  let months = 0;
  let totalInterest = 0;
  const maxMonths = 600;

  while (remaining > 0.01 && months < maxMonths) {
    const interest = interestType === 'SIMPLE'
      ? remaining * monthly
      : remaining * (Math.pow(1 + monthly, 1) - 1);
    if (monthlyPayment <= interest) return null;
    totalInterest += interest;
    remaining = remaining + interest - monthlyPayment;
    months++;
  }

  return {
    months,
    years: Math.floor(months / 12),
    remainingMonths: months % 12,
    totalInterestPaid: Math.round(totalInterest * 100) / 100,
    totalPaid: Math.round((Number(balance) + totalInterest) * 100) / 100,
  };
};

// ─── Tabla de amortización ──────────────────────────────────────────────────
const generatePaymentSchedule = (balance, rate, period, monthlyPayment, interestType, periods = 12) => {
  const schedule = [];
  let remaining = Number(balance);
  const monthly = toMonthlyRate(rate, period);

  for (let i = 0; i < periods && remaining > 0.01; i++) {
    const interest = interestType === 'SIMPLE'
      ? remaining * monthly
      : remaining * (Math.pow(1 + monthly, 1) - 1);
    const principal = Math.min(monthlyPayment - interest, remaining);
    remaining = Math.max(0, remaining - principal);

    const d = new Date();
    d.setMonth(d.getMonth() + i + 1);
    schedule.push({
      period: i + 1,
      date: d.toISOString().split('T')[0],
      payment: Math.round(monthlyPayment * 100) / 100,
      principal: Math.round(principal * 100) / 100,
      interest: Math.round(interest * 100) / 100,
      balance: Math.round(remaining * 100) / 100,
    });
  }
  return schedule;
};

// ─── Clasificación de riesgo de deuda ───────────────────────────────────────
const getDebtRiskLevel = (debt) => {
  const annualRate = toAnnualRate(debt.interestRate, debt.interestPeriod) * 100;

  // Gota a gota / prestamista informal: siempre CRÍTICO
  if (['INFORMAL', 'THIRD_PARTY_INTEREST'].includes(debt.debtCategory)) {
    if (annualRate > 100) return 'CRITICAL';
    if (annualRate > 50)  return 'CRITICAL';
    return 'HIGH';
  }

  // Tarjetas de crédito
  if (debt.debtCategory === 'CREDIT_CARD') {
    if (annualRate > 35) return 'CRITICAL';
    if (annualRate > 25) return 'HIGH';
    return 'MEDIUM';
  }

  // Por tasa general
  if (annualRate > 50)  return 'CRITICAL';
  if (annualRate > 25)  return 'HIGH';
  if (annualRate > 15)  return 'MEDIUM';
  return 'LOW';
};

// ─── Recomendaciones por deuda ──────────────────────────────────────────────
const getDebtRecommendation = (debt) => {
  const annualRate = toAnnualRate(debt.interestRate, debt.interestPeriod) * 100;
  const monthlyRate = toMonthlyRate(debt.interestRate, debt.interestPeriod) * 100;
  const risk = getDebtRiskLevel(debt);
  const rec = { action: '', negotiation: '', optimalRate: null };

  switch (debt.debtCategory) {
    case 'INFORMAL':
    case 'THIRD_PARTY_INTEREST':
      rec.action = `⚠️ URGENTE: Esta deuda cobra el ${monthlyRate.toFixed(1)}% mensual (${annualRate.toFixed(0)}% anual). Busca un crédito bancario o de libre inversión para cancelarla inmediatamente. Cualquier banco te cobra menos.`;
      rec.negotiation = 'Negocia de inmediato: ofrece pagar el capital más solo 1–2 cuotas de interés como arreglo total. Muchos prestamistas aceptan.';
      rec.optimalRate = 18;
      break;

    case 'CREDIT_CARD':
      if (annualRate > 30) {
        rec.action = `Tu tarjeta cobra el ${annualRate.toFixed(1)}% anual. Considera una transferencia de saldo a una tarjeta con menor tasa o un crédito de libre inversión.`;
        rec.negotiation = 'Llama a tu banco y solicita una reducción de tasa. Si llevas +6 meses como cliente, suelen ofrecer entre 18–24% anual.';
        rec.optimalRate = 22;
      } else {
        rec.action = `Mantén el pago mínimo más un extra para reducir el capital más rápido.`;
        rec.negotiation = 'Puedes solicitar un aumento de plazo o consolidación si tienes varias tarjetas.';
        rec.optimalRate = annualRate;
      }
      break;

    case 'BANK_LOAN':
      if (annualRate > 20) {
        rec.action = `Tasa del ${annualRate.toFixed(1)}% anual. Solicita refinanciación con tu banco o busca una entidad que ofrezca mejor tasa.`;
        rec.negotiation = 'Con historial de pagos puntual, puedes negociar reducir la tasa entre 2–5 puntos porcentuales o ampliar el plazo.';
        rec.optimalRate = 16;
      } else {
        rec.action = 'Tasa competitiva. Mantén el pago puntual para proteger tu historial crediticio.';
        rec.negotiation = 'Podrías solicitar un periodo de gracia si tienes dificultades temporales.';
        rec.optimalRate = annualRate;
      }
      break;

    case 'STORE_CREDIT':
      rec.action = `Créditos de tienda suelen tener tasas entre 25–45%. La tuya es ${annualRate.toFixed(1)}% anual. Prioriza cancelarla.`;
      rec.negotiation = 'Pregunta por opción de pago anticipado con descuento en intereses. Muchas tiendas ofrecen 10–20% de descuento al pago total.';
      rec.optimalRate = 20;
      break;

    case 'TELECOM':
      rec.action = 'Las deudas de telefonía afectan tu historial crediticio. Prioriza ponerte al día.';
      rec.negotiation = 'Llama al operador y negocia un plan de pagos en cuotas sin interés por mora.';
      rec.optimalRate = 0;
      break;

    case 'VEHICLE':
      rec.action = `Crédito de vehículo al ${annualRate.toFixed(1)}% anual. Son obligaciones estructuradas — mantén la puntualidad.`;
      rec.negotiation = annualRate > 18
        ? 'Puedes solicitar pre-pago parcial del capital para reducir el plazo y los intereses totales.'
        : 'Tasa razonable para vehículos. Mantén el plan de pago original.';
      rec.optimalRate = 15;
      break;

    case 'MORTGAGE':
      rec.action = 'Hipoteca: protege este pago a toda costa. Es tu patrimonio.';
      rec.negotiation = 'Considera pre-pagos de capital cuando tengas excedente para reducir el plazo de la deuda significativamente.';
      rec.optimalRate = 12;
      break;

    case 'THIRD_PARTY':
      rec.action = 'Deuda sin interés con tercero. Mantén la promesa de pago para preservar la relación.';
      rec.negotiation = 'Si hay dificultades, comunica la situación y acuerda un nuevo plazo. La confianza vale más que el dinero.';
      rec.optimalRate = 0;
      break;

    default:
      rec.action = 'Mantén el pago puntual y busca liquidarla lo antes posible.';
      rec.negotiation = 'Evalúa si es posible consolidar esta deuda con otras para simplificar tus pagos.';
      rec.optimalRate = 15;
  }

  return { ...rec, risk, annualRate: Math.round(annualRate * 100) / 100 };
};

// ─── Plan de pago óptimo ────────────────────────────────────────────────────
const CATEGORY_PRIORITY = {
  INFORMAL: 100,
  THIRD_PARTY_INTEREST: 95,
  CREDIT_CARD: 80,
  STORE_CREDIT: 70,
  TELECOM: 65,
  BANK_LOAN: 50,
  VEHICLE: 40,
  STUDENT_LOAN: 35,
  MORTGAGE: 30,
  THIRD_PARTY: 20,
  OTHER: 25,
};

const getOptimalPaymentPlan = (debts, monthlySurplus = 0) => {
  if (!debts.length) return [];

  const enriched = debts
    .filter((d) => d.isActive && Number(d.currentBalance) > 0)
    .map((d) => {
      const annualRate = toAnnualRate(d.interestRate, d.interestPeriod) * 100;
      const catPriority = CATEGORY_PRIORITY[d.debtCategory] || 25;
      // Score = categoría base + tasa de interés normalizada
      const score = catPriority + Math.min(annualRate, 50);
      return {
        ...d,
        annualRate,
        score,
        currentBalance: Number(d.currentBalance),
        minimumPayment: Number(d.minimumPayment),
      };
    })
    .sort((a, b) => b.score - a.score);

  let remaining = monthlySurplus;
  return enriched.map((debt, i) => {
    const extra = i === 0 && remaining > 0 ? remaining : 0;
    if (i === 0) remaining = 0;
    const recommended = debt.minimumPayment + extra;
    const payoff = calculatePayoffTime(debt.currentBalance, debt.interestRate, debt.interestPeriod, recommended, debt.interestType);
    const rec = getDebtRecommendation(debt);

    return {
      id: debt.id,
      name: debt.name,
      entity: debt.entity,
      debtCategory: debt.debtCategory,
      currentBalance: debt.currentBalance,
      annualRate: debt.annualRate,
      minimumPayment: debt.minimumPayment,
      recommendedPayment: Math.round(recommended * 100) / 100,
      extraPayment: Math.round(extra * 100) / 100,
      isPriority: i === 0,
      payoff,
      recommendation: rec,
      score: debt.score,
    };
  });
};

// ─── Comparar estrategias ───────────────────────────────────────────────────
const compareStrategies = (debts, extraPayment = 0) => {
  const simulate = (sorted) => {
    const ds = sorted.map((d) => ({
      ...d,
      balance: Number(d.currentBalance),
      rate: toMonthlyRate(d.interestRate, d.interestPeriod || 'ANNUAL'),
      minPay: Number(d.minimumPayment),
    }));

    let months = 0;
    let totalInterest = 0;

    while (ds.some((d) => d.balance > 0.01) && months < 600) {
      let available = extraPayment;
      for (const d of ds) {
        if (d.balance <= 0.01) continue;
        const interest = d.balance * d.rate;
        totalInterest += interest;
        d.balance = Math.max(0, d.balance + interest - d.minPay);
      }
      for (const d of ds) {
        if (d.balance <= 0.01 || available <= 0) continue;
        const pay = Math.min(available, d.balance);
        d.balance -= pay;
        available -= pay;
      }
      months++;
    }
    return { months, totalInterest: Math.round(totalInterest * 100) / 100 };
  };

  const byPriority = [...debts].sort((a, b) => {
    const pa = CATEGORY_PRIORITY[a.debtCategory] || 25;
    const pb = CATEGORY_PRIORITY[b.debtCategory] || 25;
    return pb - pa;
  });

  const byRate = [...debts].sort((a, b) =>
    toAnnualRate(b.interestRate, b.interestPeriod) - toAnnualRate(a.interestRate, a.interestPeriod)
  );

  const byBalance = [...debts].sort((a, b) => Number(a.currentBalance) - Number(b.currentBalance));

  return {
    smart:     simulate(byPriority),
    avalanche: simulate(byRate),
    snowball:  simulate(byBalance),
  };
};

module.exports = {
  toAnnualRate,
  toMonthlyRate,
  calculateMonthlyInterest,
  calculatePayoffTime,
  generatePaymentSchedule,
  getDebtRiskLevel,
  getDebtRecommendation,
  getOptimalPaymentPlan,
  compareStrategies,
};
