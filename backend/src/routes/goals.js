const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/goalController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/', ctrl.getAll);
router.post('/', ctrl.create);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);
router.post('/:id/contributions', ctrl.addContribution);

module.exports = router;
