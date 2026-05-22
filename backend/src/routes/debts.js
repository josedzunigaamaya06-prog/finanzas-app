const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/debtController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/strategies', ctrl.getStrategies);
router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getOne);
router.post('/', ctrl.create);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);
router.post('/:id/payments', ctrl.addPayment);

module.exports = router;
