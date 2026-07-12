const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/incomeController');
const { authenticate } = require('../middleware/auth');
const { expenseRules, expenseUpdateRules } = require('../middleware/validate');

router.use(authenticate);
router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getOne);
router.post('/', expenseRules, ctrl.create);
router.put('/:id', expenseUpdateRules, ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;
