const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ─── Aplicar reglas a una descripción (exportado para usar en otros controladores) ──

const applyRules = async (userId, description) => {
  if (!description) return null;

  const rules = await prisma.autoRule.findMany({
    where: { userId, isActive: true },
    orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }],
  });

  const desc = description.toLowerCase().trim();

  for (const rule of rules) {
    // Soporta múltiples palabras clave separadas por coma: "netflix, spotify, hbo"
    const keywords = rule.keyword.toLowerCase().split(',').map((k) => k.trim()).filter(Boolean);
    let matches = false;

    for (const keyword of keywords) {
      switch (rule.condition) {
        case 'contains':    matches = desc.includes(keyword);    break;
        case 'starts_with': matches = desc.startsWith(keyword);  break;
        case 'ends_with':   matches = desc.endsWith(keyword);    break;
        case 'equals':      matches = desc === keyword;           break;
      }
      if (matches) break;
    }

    if (matches) {
      // Incrementar contador en background sin bloquear
      prisma.autoRule.update({
        where: { id: rule.id },
        data: { matchCount: { increment: 1 } },
      }).catch(() => {});
      return rule.categoryId;
    }
  }

  return null;
};

// ─── CRUD ────────────────────────────────────────────────────────────────────

const getAll = async (req, res, next) => {
  try {
    const rules = await prisma.autoRule.findMany({
      where: { userId: req.user.id },
      include: { category: true },
      orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }],
    });
    res.json(rules);
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const { name, keyword, condition, categoryId, priority } = req.body;

    if (!keyword || !categoryId) {
      return res.status(400).json({ message: 'keyword y categoryId son requeridos' });
    }

    const rule = await prisma.autoRule.create({
      data: {
        userId:     req.user.id,
        name:       name      || null,
        keyword,
        condition:  condition || 'contains',
        categoryId,
        priority:   priority  ?? 0,
      },
      include: { category: true },
    });

    res.status(201).json({ message: 'Regla creada', rule });
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const existing = await prisma.autoRule.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!existing) return res.status(404).json({ message: 'Regla no encontrada' });

    const { name, keyword, condition, categoryId, isActive, priority } = req.body;

    const rule = await prisma.autoRule.update({
      where: { id: req.params.id },
      data: {
        ...(name       !== undefined && { name: name || null }),
        ...(keyword    !== undefined && { keyword }),
        ...(condition  !== undefined && { condition }),
        ...(categoryId !== undefined && { categoryId }),
        ...(isActive   !== undefined && { isActive }),
        ...(priority   !== undefined && { priority }),
      },
      include: { category: true },
    });

    res.json({ message: 'Regla actualizada', rule });
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    const existing = await prisma.autoRule.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!existing) return res.status(404).json({ message: 'Regla no encontrada' });

    await prisma.autoRule.delete({ where: { id: req.params.id } });
    res.json({ message: 'Regla eliminada' });
  } catch (err) {
    next(err);
  }
};

// Endpoint para probar una regla antes de guardarla
const check = async (req, res, next) => {
  try {
    const { description } = req.body;
    const categoryId = await applyRules(req.user.id, description);
    if (categoryId) {
      const category = await prisma.category.findUnique({ where: { id: categoryId } });
      return res.json({ matched: true, categoryId, category });
    }
    res.json({ matched: false });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, create, update, remove, check, applyRules };
