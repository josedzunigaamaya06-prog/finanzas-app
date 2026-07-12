const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/walletController');
const { authenticate } = require('../middleware/auth');
const { walletRules } = require('../middleware/validate');

router.use(authenticate);
router.get('/', ctrl.getAll);
router.post('/', walletRules, ctrl.create);
router.put('/:id', walletRules, ctrl.update);
router.patch('/:id/balance', ctrl.adjustBalance);
router.delete('/:id', ctrl.remove);

module.exports = router;
