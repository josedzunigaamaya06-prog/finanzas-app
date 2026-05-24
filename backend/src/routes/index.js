const express = require('express');
const router = express.Router();
const { apiLimiter } = require('../middleware/rateLimiter');

router.use(apiLimiter);

router.use('/auth',            require('./auth'));
router.use('/wallets',         require('./wallets'));
router.use('/incomes',         require('./incomes'));
router.use('/expenses',        require('./expenses'));
router.use('/debts',           require('./debts'));
router.use('/goals',           require('./goals'));
router.use('/budgets',         require('./budgets'));
router.use('/dashboard',       require('./dashboard'));
router.use('/recommendations', require('./recommendations'));
router.use('/reports',         require('./reports'));
router.use('/reminders',       require('./reminders'));
router.use('/auto-rules',      require('./autoRules'));
router.use('/ai',              require('./ai'));
router.use('/insights',        require('./insights'));
router.use('/prediction',      require('./prediction'));
router.use('/score',           require('./score'));

module.exports = router;
