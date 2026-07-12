const express = require('express');
const router  = express.Router();
const { authenticate } = require('../middleware/auth');
const ctrl    = require('../controllers/predictionController');

router.use(authenticate);
router.get('/', ctrl.getPrediction);

module.exports = router;
