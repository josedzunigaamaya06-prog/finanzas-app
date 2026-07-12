const prisma = require('../lib/prisma');

const DEFAULT_CATEGORIES = [
  // ── Ingresos ──────────────────────────────────────────────────────────────
  { name: 'Salario',                  icon: '💼', color: '#10b981', type: 'INCOME',   isDefault: true },
  { name: 'Freelance / Independiente',icon: '💻', color: '#6366f1', type: 'INCOME',   isDefault: true },
  { name: 'Negocio propio',           icon: '🏢', color: '#f59e0b', type: 'INCOME',   isDefault: true },
  { name: 'Inversiones',              icon: '📈', color: '#3b82f6', type: 'INCOME',   isDefault: true },
  { name: 'Arriendo recibido',        icon: '🏠', color: '#8b5cf6', type: 'INCOME',   isDefault: true },
  { name: 'Bonificaciones',           icon: '🎁', color: '#ec4899', type: 'INCOME',   isDefault: true },
  { name: 'Otros ingresos',           icon: '💰', color: '#64748b', type: 'INCOME',   isDefault: true },

  // ── Gastos ────────────────────────────────────────────────────────────────
  { name: 'Alimentación',             icon: '🍽️', color: '#f59e0b', type: 'EXPENSE',  isDefault: true },
  { name: 'Transporte',               icon: '🚗', color: '#3b82f6', type: 'EXPENSE',  isDefault: true },
  { name: 'Vivienda / Arriendo',      icon: '🏠', color: '#6366f1', type: 'EXPENSE',  isDefault: true },
  { name: 'Salud y medicina',         icon: '💊', color: '#ef4444', type: 'EXPENSE',  isDefault: true },
  { name: 'Educación',                icon: '📚', color: '#8b5cf6', type: 'EXPENSE',  isDefault: true },
  { name: 'Entretenimiento y ocio',   icon: '🎬', color: '#ec4899', type: 'EXPENSE',  isDefault: true },
  { name: 'Ropa y accesorios',        icon: '👕', color: '#14b8a6', type: 'EXPENSE',  isDefault: true },
  { name: 'Servicios públicos',       icon: '💡', color: '#f59e0b', type: 'EXPENSE',  isDefault: true },
  { name: 'Tecnología',               icon: '💻', color: '#6366f1', type: 'EXPENSE',  isDefault: true },
  { name: 'Deporte y fitness',        icon: '🏋️', color: '#10b981', type: 'EXPENSE',  isDefault: true },
  { name: 'Belleza y cuidado personal',icon:'💅', color: '#ec4899', type: 'EXPENSE',  isDefault: true },
  { name: 'Mascotas',                 icon: '🐾', color: '#f59e0b', type: 'EXPENSE',  isDefault: true },
  { name: 'Regalos',                  icon: '🎁', color: '#ef4444', type: 'EXPENSE',  isDefault: true },
  { name: 'Suscripciones',            icon: '📱', color: '#3b82f6', type: 'EXPENSE',  isDefault: true },
  { name: 'Restaurantes y cafés',     icon: '☕', color: '#f59e0b', type: 'EXPENSE',  isDefault: true },
  { name: 'Supermercado',             icon: '🛒', color: '#10b981', type: 'EXPENSE',  isDefault: true },
  { name: 'Otros gastos',             icon: '📦', color: '#64748b', type: 'EXPENSE',  isDefault: true },

  // ── Ambos ────────────────────────────────────────────────────────────────
  { name: 'Transferencias',           icon: '↔️', color: '#64748b', type: 'BOTH',     isDefault: true },
];

const seedDefaultCategories = async () => {
  try {
    const count = await prisma.category.count({ where: { isDefault: true } });
    if (count > 0) {
      console.log(`✅ Categorías ya existentes: ${count}`);
      return;
    }

    await prisma.category.createMany({ data: DEFAULT_CATEGORIES });
    console.log(`✅ ${DEFAULT_CATEGORIES.length} categorías por defecto creadas`);
  } catch (err) {
    console.error('❌ Error seeding categories:', err.message);
  }
};

module.exports = { seedDefaultCategories };
