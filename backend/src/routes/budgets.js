const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/budgetController');
const { authenticate } = require('../middleware/auth');
const { budgetRules } = require('../middleware/validate');

router.use(authenticate);
router.get('/', ctrl.getAll);
router.post('/', budgetRules, ctrl.create);
router.put('/:id', budgetRules, ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;
