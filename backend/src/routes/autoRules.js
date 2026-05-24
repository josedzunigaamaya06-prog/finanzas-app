const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/autoRulesController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/',         ctrl.getAll);
router.post('/',        ctrl.create);
router.post('/check',   ctrl.check);
router.put('/:id',      ctrl.update);
router.delete('/:id',   ctrl.remove);

module.exports = router;
