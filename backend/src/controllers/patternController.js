const prisma = require('../lib/prisma');

const THRESHOLD = 3; // veces necesarias para crear regla automática

// Palabras comunes en español que no sirven como keywords
const STOPWORDS = new Set([
  'para', 'pago', 'pagar', 'pague', 'compra', 'gasto', 'con', 'del', 'los', 'las',
  'una', 'uno', 'por', 'que', 'esta', 'este', 'mes', 'dia', 'semana', 'hace',
  'desde', 'hasta', 'entre', 'sobre', 'ante', 'bajo', 'sin', 'tras',
]);

// Extraer palabras significativas de una descripción
const extractKeywords = (description) => {
  return description
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // quitar tildes
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 4 && !STOPWORDS.has(w));
};

// Registrar un patrón y crear regla automática si se alcanza el umbral
const trackPattern = async (userId, description, categoryId) => {
  if (!userId || !description || !categoryId) return null;

  const keywords = extractKeywords(description);
  if (keywords.length === 0) return null;

  for (const keyword of keywords) {
    try {
      // Upsert del patrón
      await prisma.categoryPattern.upsert({
        where:  { userId_keyword_categoryId: { userId, keyword, categoryId } },
        update: { count: { increment: 1 } },
        create: { userId, keyword, categoryId, count: 1 },
      });

      // Leer el estado actualizado
      const pattern = await prisma.categoryPattern.findUnique({
        where: { userId_keyword_categoryId: { userId, keyword, categoryId } },
      });

      if (!pattern || pattern.count < THRESHOLD || pattern.ruleCreated) continue;

      // Verificar si ya existe una regla para este keyword y categoría
      const existingRule = await prisma.autoRule.findFirst({
        where: {
          userId,
          categoryId,
          isActive: true,
          keyword:  { contains: keyword, mode: 'insensitive' },
        },
      });

      if (existingRule) {
        // Marcar como procesado para no volver a entrar
        await prisma.categoryPattern.update({
          where: { userId_keyword_categoryId: { userId, keyword, categoryId } },
          data:  { ruleCreated: true },
        });
        continue;
      }

      // Crear regla automática
      await prisma.autoRule.create({
        data: {
          userId,
          keyword,
          condition:  'contains',
          categoryId,
          name:       'Aprendido automáticamente',
          isActive:   true,
        },
      });

      // Marcar patrón como convertido en regla
      await prisma.categoryPattern.update({
        where: { userId_keyword_categoryId: { userId, keyword, categoryId } },
        data:  { ruleCreated: true },
      });

      // Retornar info de la regla creada para notificar al usuario
      const category = await prisma.category.findUnique({ where: { id: categoryId } });
      return { keyword, category };

    } catch (err) {
      console.error('trackPattern error:', err.message);
    }
  }

  return null;
};

module.exports = { trackPattern };
