const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Categorías por defecto (globales, no pertenecen a ningún usuario)
  const defaultCategories = [
    { name: 'Salario',          icon: '💼', color: '#10b981', type: 'INCOME',   isDefault: true },
    { name: 'Freelance',        icon: '💻', color: '#6366f1', type: 'INCOME',   isDefault: true },
    { name: 'Inversiones',      icon: '📈', color: '#f59e0b', type: 'INCOME',   isDefault: true },
    { name: 'Otros Ingresos',   icon: '💰', color: '#14b8a6', type: 'INCOME',   isDefault: true },
    { name: 'Comida',           icon: '🍔', color: '#ef4444', type: 'EXPENSE',  isDefault: true },
    { name: 'Transporte',       icon: '🚗', color: '#f97316', type: 'EXPENSE',  isDefault: true },
    { name: 'Vivienda',         icon: '🏠', color: '#8b5cf6', type: 'EXPENSE',  isDefault: true },
    { name: 'Entretenimiento',  icon: '🎮', color: '#ec4899', type: 'EXPENSE',  isDefault: true },
    { name: 'Salud',            icon: '🏥', color: '#06b6d4', type: 'EXPENSE',  isDefault: true },
    { name: 'Educación',        icon: '📚', color: '#84cc16', type: 'EXPENSE',  isDefault: true },
    { name: 'Servicios',        icon: '⚡', color: '#eab308', type: 'EXPENSE',  isDefault: true },
    { name: 'Suscripciones',    icon: '📱', color: '#a855f7', type: 'EXPENSE',  isDefault: true },
    { name: 'Ropa',             icon: '👕', color: '#f43f5e', type: 'EXPENSE',  isDefault: true },
    { name: 'Otros Gastos',     icon: '🛍️', color: '#64748b', type: 'EXPENSE',  isDefault: true },
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

  // Usuario demo — siempre limpio, sin datos de ejemplo
  let demoUser = await prisma.user.findUnique({ where: { email: 'demo@finanzas.app' } });

  if (demoUser) {
    // Limpiar todos los datos del usuario demo
    const uid = demoUser.id;
    await prisma.expense.deleteMany({ where: { userId: uid } });
    await prisma.income.deleteMany({ where: { userId: uid } });
    await prisma.debt.deleteMany({ where: { userId: uid } });
    await prisma.goal.deleteMany({ where: { userId: uid } });
    await prisma.budget.deleteMany({ where: { userId: uid } });
    await prisma.wallet.deleteMany({ where: { userId: uid } });
    await prisma.challenge.deleteMany({ where: { userId: uid } });
    await prisma.recommendation.deleteMany({ where: { userId: uid } });
    console.log('🧹 Datos demo limpiados');
  } else {
    const hashedPassword = await bcrypt.hash('Demo123!', 12);
    await prisma.user.create({
      data: {
        email:    'demo@finanzas.app',
        password: hashedPassword,
        name:     'Usuario Demo',
        currency: 'COP',
      },
    });
    console.log('✅ Usuario demo creado (cuenta vacía)');
  }

  console.log('📧 demo@finanzas.app  |  🔑 Demo123!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
