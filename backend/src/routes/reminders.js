const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const ctrl = require('../controllers/reminderController');

router.use(authenticate);

router.get('/upcoming', ctrl.getUpcoming);
router.get('/',         ctrl.getAll);
router.post('/',        ctrl.create);
router.put('/:id',      ctrl.update);
router.delete('/:id',   ctrl.remove);

module.exports = router;
