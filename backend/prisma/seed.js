const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Default categories
  const defaultCategories = [
    { name: 'Salario', icon: '💼', color: '#10b981', type: 'INCOME', isDefault: true },
    { name: 'Freelance', icon: '💻', color: '#6366f1', type: 'INCOME', isDefault: true },
    { name: 'Inversiones', icon: '📈', color: '#f59e0b', type: 'INCOME', isDefault: true },
    { name: 'Otros Ingresos', icon: '💰', color: '#14b8a6', type: 'INCOME', isDefault: true },
    { name: 'Comida', icon: '🍔', color: '#ef4444', type: 'EXPENSE', isDefault: true },
    { name: 'Transporte', icon: '🚗', color: '#f97316', type: 'EXPENSE', isDefault: true },
    { name: 'Vivienda', icon: '🏠', color: '#8b5cf6', type: 'EXPENSE', isDefault: true },
    { name: 'Entretenimiento', icon: '🎮', color: '#ec4899', type: 'EXPENSE', isDefault: true },
    { name: 'Salud', icon: '🏥', color: '#06b6d4', type: 'EXPENSE', isDefault: true },
    { name: 'Educación', icon: '📚', color: '#84cc16', type: 'EXPENSE', isDefault: true },
    { name: 'Servicios', icon: '⚡', color: '#eab308', type: 'EXPENSE', isDefault: true },
    { name: 'Suscripciones', icon: '📱', color: '#a855f7', type: 'EXPENSE', isDefault: true },
    { name: 'Ropa', icon: '👕', color: '#f43f5e', type: 'EXPENSE', isDefault: true },
    { name: 'Otros Gastos', icon: '🛍️', color: '#64748b', type: 'EXPENSE', isDefault: true },
  ];

  for (const cat of defaultCategories) {
    await prisma.category.upsert({
      where: { id: `default-${cat.name.toLowerCase().replace(/\s+/g, '-')}` },
      update: {},
      create: {
        id: `default-${cat.name.toLowerCase().replace(/\s+/g, '-')}`,
        ...cat,
      },
    });
  }

  // Demo user
  const existingUser = await prisma.user.findUnique({ where: { email: 'demo@finanzas.app' } });
  if (existingUser) {
    console.log('✅ Demo user already exists, skipping seed.');
    return;
  }

  const hashedPassword = await bcrypt.hash('Demo123!', 12);
  const user = await prisma.user.create({
    data: {
      email: 'demo@finanzas.app',
      password: hashedPassword,
      name: 'Usuario Demo',
      currency: 'COP',
    },
  });

  const cats = await prisma.category.findMany({ where: { isDefault: true } });
  const catMap = Object.fromEntries(cats.map((c) => [c.name, c.id]));

  // Wallets
  await prisma.wallet.createMany({
    data: [
      { userId: user.id, name: 'Bancolombia Ahorros', type: 'SAVINGS_ACCOUNT', balance: 1850000, color: '#FFCD00', icon: '🏦', notes: 'Cuenta de ahorros principal' },
      { userId: user.id, name: 'Nequi', type: 'DIGITAL_WALLET', balance: 320000, color: '#8B5CF6', icon: '💜', notes: 'Billetera digital Nequi' },
      { userId: user.id, name: 'Daviplata', type: 'DIGITAL_WALLET', balance: 150000, color: '#E31837', icon: '❤️', notes: 'Billetera digital Daviplata' },
      { userId: user.id, name: 'Nu Colombia', type: 'DIGITAL_WALLET', balance: 480000, color: '#820AD1', icon: '💜', notes: 'Tarjeta Nu' },
      { userId: user.id, name: 'Efectivo en mano', type: 'CASH', balance: 200000, color: '#10B981', icon: '💵', notes: 'Dinero en efectivo' },
    ],
  });

  const now = new Date();
  const months = [-5, -4, -3, -2, -1, 0];

  for (const offset of months) {
    const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    const year = d.getFullYear();
    const month = d.getMonth();

    // Incomes
    await prisma.income.createMany({
      data: [
        {
          userId: user.id,
          categoryId: catMap['Salario'],
          amount: 4500000,
          description: 'Salario mensual',
          date: new Date(year, month, 1),
          isRecurring: true,
          frequency: 'MONTHLY',
          paymentMethod: 'DIGITAL',
        },
        {
          userId: user.id,
          categoryId: catMap['Freelance'],
          amount: Math.floor(Math.random() * 800000 + 200000),
          description: 'Proyecto freelance',
          date: new Date(year, month, 15),
          isRecurring: false,
          paymentMethod: 'DIGITAL',
        },
      ],
    });

    // Expenses
    const expenses = [
      { cat: 'Vivienda',        amount: 900000,                                    desc: 'Arriendo',                   fixed: true,  method: 'DIGITAL' },
      { cat: 'Comida',          amount: Math.floor(Math.random() * 200000 + 400000), desc: 'Supermercado y restaurantes', fixed: false, method: 'CASH' },
      { cat: 'Transporte',      amount: Math.floor(Math.random() * 100000 + 150000), desc: 'Gasolina y transporte',       fixed: false, method: 'CASH' },
      { cat: 'Servicios',       amount: 180000,                                    desc: 'Servicios públicos',          fixed: true,  method: 'DIGITAL' },
      { cat: 'Entretenimiento', amount: Math.floor(Math.random() * 150000 + 50000),  desc: 'Salidas y ocio',             fixed: false, method: 'CASH' },
      { cat: 'Suscripciones',   amount: 85000,                                     desc: 'Netflix, Spotify, etc.',      fixed: true,  method: 'DIGITAL' },
      { cat: 'Salud',           amount: Math.floor(Math.random() * 80000 + 20000),   desc: 'Medicina y salud',           fixed: false, method: 'DIGITAL' },
      { cat: 'Educación',       amount: 120000,                                    desc: 'Cursos online',               fixed: true,  method: 'DIGITAL' },
    ];

    for (const exp of expenses) {
      await prisma.expense.create({
        data: {
          userId: user.id,
          categoryId: catMap[exp.cat],
          amount: exp.amount,
          description: exp.desc,
          date: new Date(year, month, Math.floor(Math.random() * 25 + 1)),
          type: exp.fixed ? 'FIXED' : 'VARIABLE',
          isRecurring: exp.fixed,
          frequency: exp.fixed ? 'MONTHLY' : null,
          paymentMethod: exp.method,
        },
      });
    }
  }

  // Debts — with debtCategory and interestPeriod
  await prisma.debt.createMany({
    data: [
      {
        userId: user.id,
        name: 'Tarjeta de Crédito Visa',
        entity: 'Bancolombia',
        debtCategory: 'CREDIT_CARD',
        totalAmount: 5000000,
        currentBalance: 3200000,
        interestRate: 0.2799,
        interestPeriod: 'ANNUAL',
        minimumPayment: 160000,
        dueDate: 15,
        interestType: 'COMPOUND',
        isNegotiable: true,
        startDate: new Date(now.getFullYear(), now.getMonth() - 8, 1),
      },
      {
        userId: user.id,
        name: 'Crédito de Vehículo',
        entity: 'Banco de Bogotá',
        debtCategory: 'VEHICLE',
        totalAmount: 35000000,
        currentBalance: 22000000,
        interestRate: 0.155,
        interestPeriod: 'ANNUAL',
        minimumPayment: 750000,
        dueDate: 5,
        interestType: 'COMPOUND',
        isNegotiable: false,
        startDate: new Date(now.getFullYear() - 2, 0, 1),
      },
      {
        userId: user.id,
        name: 'Préstamo familiar con interés',
        entity: 'Prestamista particular',
        debtCategory: 'THIRD_PARTY_INTEREST',
        totalAmount: 2000000,
        currentBalance: 800000,
        interestRate: 0.05,
        interestPeriod: 'MONTHLY',
        minimumPayment: 100000,
        dueDate: 20,
        interestType: 'SIMPLE',
        isNegotiable: true,
        startDate: new Date(now.getFullYear(), now.getMonth() - 4, 1),
      },
    ],
  });

  // Goals
  await prisma.goal.createMany({
    data: [
      {
        userId: user.id,
        name: 'Fondo de Emergencia',
        description: '3 meses de gastos cubiertos',
        targetAmount: 6000000,
        currentAmount: 2400000,
        deadline: new Date(now.getFullYear(), now.getMonth() + 8, 1),
        color: '#10b981',
        icon: '🛡️',
      },
      {
        userId: user.id,
        name: 'Vacaciones Cartagena',
        description: 'Viaje familiar a Cartagena',
        targetAmount: 3500000,
        currentAmount: 850000,
        deadline: new Date(now.getFullYear(), 11, 15),
        color: '#6366f1',
        icon: '✈️',
      },
      {
        userId: user.id,
        name: 'Computador Nuevo',
        description: 'MacBook Pro para trabajo',
        targetAmount: 8000000,
        currentAmount: 1200000,
        color: '#f59e0b',
        icon: '💻',
      },
    ],
  });

  // Budgets for current month
  const budgetMonth = now.getMonth() + 1;
  const budgetYear = now.getFullYear();
  const budgetCats = [
    { cat: 'Comida', amount: 700000 },
    { cat: 'Transporte', amount: 300000 },
    { cat: 'Entretenimiento', amount: 200000 },
    { cat: 'Servicios', amount: 200000 },
    { cat: 'Suscripciones', amount: 100000 },
    { cat: 'Salud', amount: 150000 },
    { cat: 'Educación', amount: 150000 },
  ];

  for (const b of budgetCats) {
    if (catMap[b.cat]) {
      await prisma.budget.create({
        data: {
          userId: user.id,
          categoryId: catMap[b.cat],
          amount: b.amount,
          month: budgetMonth,
          year: budgetYear,
        },
      });
    }
  }

  console.log(`✅ Seed completed.`);
  console.log(`📧 Demo user: demo@finanzas.app`);
  console.log(`🔑 Password: Demo123!`);
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
