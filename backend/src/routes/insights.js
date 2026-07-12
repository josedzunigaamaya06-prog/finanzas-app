const express = require('express');
const router  = express.Router();
const { authenticate } = require('../middleware/auth');
const ctrl    = require('../controllers/insightsController');

router.use(authenticate);
router.get('/', ctrl.getInsights);

module.exports = router;
