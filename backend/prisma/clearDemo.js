const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({ where: { email: 'demo@finanzas.app' } });
  if (!user) { console.log('Usuario demo no encontrado'); return; }

  const uid = user.id;
  await prisma.expense.deleteMany({ where: { userId: uid } });
  await prisma.income.deleteMany({ where: { userId: uid } });
  await prisma.debt.deleteMany({ where: { userId: uid } });
  await prisma.goal.deleteMany({ where: { userId: uid } });
  await prisma.budget.deleteMany({ where: { userId: uid } });
  await prisma.wallet.deleteMany({ where: { userId: uid } });
  await prisma.challenge.deleteMany({ where: { userId: uid } });
  await prisma.recommendation.deleteMany({ where: { userId: uid } });

  console.log('✅ Cuenta demo limpiada');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
