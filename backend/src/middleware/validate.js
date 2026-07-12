const { body, validationResult } = require('express-validator');

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: 'Datos inválidos', errors: errors.array() });
  }
  next();
};

const validateAmount = body('amount')
  .notEmpty().withMessage('El monto es requerido')
  .isFloat({ gt: 0 }).withMessage('El monto debe ser un número mayor a 0');

const validateDate = body('date')
  .notEmpty().withMessage('La fecha es requerida')
  .isISO8601().withMessage('Fecha inválida');

const validateDescription = body('description')
  .notEmpty().withMessage('La descripción es requerida')
  .isString().isLength({ max: 500 }).withMessage('La descripción no puede superar 500 caracteres');

const expenseRules = [validateAmount, validateDate, validateDescription, handleValidation];

const expenseUpdateRules = [
  body('amount').optional().isFloat({ gt: 0 }).withMessage('El monto debe ser mayor a 0'),
  body('date').optional().isISO8601().withMessage('Fecha inválida'),
  body('description').optional().isString().isLength({ max: 500 }),
  handleValidation,
];

const walletRules = [
  body('name').notEmpty().withMessage('El nombre es requerido').isString().isLength({ max: 100 }),
  body('balance').optional().isFloat({ min: 0 }).withMessage('El saldo inicial no puede ser negativo'),
  handleValidation,
];

const budgetRules = [
  body('amount').notEmpty().isFloat({ gt: 0 }).withMessage('El monto debe ser mayor a 0'),
  body('month').notEmpty().isInt({ min: 1, max: 12 }).withMessage('Mes inválido (1-12)'),
  body('year').notEmpty().isInt({ min: 2000, max: 2100 }).withMessage('Año inválido'),
  handleValidation,
];

const goalRules = [
  body('name').notEmpty().withMessage('El nombre es requerido'),
  body('targetAmount').notEmpty().isFloat({ gt: 0 }).withMessage('La meta debe ser mayor a 0'),
  handleValidation,
];

module.exports = { expenseRules, expenseUpdateRules, walletRules, budgetRules, goalRules };
