const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/expenseController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/categories', ctrl.getCategories);
router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getOne);
router.post('/', ctrl.create);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;
