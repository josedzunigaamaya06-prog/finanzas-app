const express = require('express');
const router  = express.Router();
const { getComparison } = require('../controllers/comparisonController');
const { authenticate } = require('../middleware/auth');
router.use(authenticate);
router.get('/', getComparison);
module.exports = router;
