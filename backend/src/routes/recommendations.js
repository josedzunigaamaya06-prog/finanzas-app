const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/recommendationController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/', ctrl.getAll);
router.patch('/read-all', ctrl.markAllRead);
router.patch('/:id/read', ctrl.markRead);
router.patch('/:id/dismiss', ctrl.dismiss);

module.exports = router;
