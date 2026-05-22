const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/walletController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/', ctrl.getAll);
router.post('/', ctrl.create);
router.put('/:id', ctrl.update);
router.patch('/:id/balance', ctrl.adjustBalance);
router.delete('/:id', ctrl.remove);

module.exports = router;
