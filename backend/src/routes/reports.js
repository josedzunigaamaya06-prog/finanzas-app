const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/reportController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/monthly', ctrl.getMonthlyReport);
router.get('/annual', ctrl.getAnnualReport);
router.get('/categories', ctrl.getCategories);

module.exports = router;
