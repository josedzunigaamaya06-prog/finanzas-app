const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/goalController');
const { authenticate } = require('../middleware/auth');
const { goalRules } = require('../middleware/validate');

router.use(authenticate);
router.get('/', ctrl.getAll);
router.get('/savings-capacity', ctrl.getSavingsCapacity);
router.post('/', goalRules, ctrl.create);
router.put('/:id', goalRules, ctrl.update);
router.delete('/:id', ctrl.remove);
router.post('/:id/contributions', ctrl.addContribution);

module.exports = router;
