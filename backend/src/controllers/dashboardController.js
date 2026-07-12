const financialService = require('../services/financialService');
const scoreService = require('../services/scoreService');
const { generateRecommendations } = require('../services/recommendationService');
const { getCurrentMonthYear } = require('../utils/helpers');

const prisma = require('../lib/prisma');

const getWalletSummary = async (userId) => {
  const wallets = await prisma.wallet.findMany({
    where: { userId, isActive: true },
    orderBy: { balance: 'desc' },
  });

  const totalDigital = wallets
    .filter((w) => !['CASH'].includes(w.type))
    .reduce((s, w) => s + Number(w.balance), 0);
  const totalCash = wallets
    .filter((w) => w.type === 'CASH')
    .reduce((s, w) => s + Number(w.balance), 0);
  const totalOverall = totalDigital + totalCash;

  return { wallets: wallets.map((w) => ({ ...w, balance: Number(w.balance) })), totalDigital, totalCash, totalOverall };
};

const getDashboard = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { month, year } = getCurrentMonthYear();
    const queryMonth = parseInt(req.query.month) || month;
    const queryYear = parseInt(req.query.year) || year;

    const [monthly, trend, expensesByCategory, debtSummary, financialScore, recentTransactions, paymentMethodStats, walletSummary] = await Promise.all([
      financialService.getMonthlyTotals(userId, queryYear, queryMonth),
      financialService.getMonthlyTrend(userId, 6),
      financialService.getExpensesByCategory(userId, queryYear, queryMonth),
      financialService.getDebtSummary(userId),
      scoreService.getDashboardScore(userId),
      getRecentTransactions(userId),
      financialService.getPaymentMethodStats(userId, queryYear, queryMonth),
      getWalletSummary(userId),
    ]);

    // Generate fresh recommendations
    generateRecommendations(userId).catch(console.error);

    const recommendations = await prisma.recommendation.findMany({
      where: { userId, isDismissed: false },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      take: 5,
    });

    res.json({
      monthly,
      trend,
      expensesByCategory,
      debtSummary,
      financialScore,
      recentTransactions,
      recommendations,
      paymentMethodStats,
      walletSummary,
      period: { month: queryMonth, year: queryYear },
    });
  } catch (err) {
    next(err);
  }
};

const getRecentTransactions = async (userId) => {
  const [incomes, expenses] = await Promise.all([
    prisma.income.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: 5,
      include: { category: true },
    }),
    prisma.expense.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: 5,
      include: { category: true },
    }),
  ]);

  const transactions = [
    ...incomes.map((i) => ({ ...i, transactionType: 'income', amount: Number(i.amount) })),
    ...expenses.map((e) => ({ ...e, transactionType: 'expense', amount: Number(e.amount) })),
  ];

  return transactions.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);
};

module.exports = { getDashboard };
