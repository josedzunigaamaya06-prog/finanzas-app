const express = require('express');
const router  = express.Router();
const { authenticate } = require('../middleware/auth');
const ctrl    = require('../controllers/aiController');

router.use(authenticate);

router.post('/suggest-category', ctrl.suggestCategoryForExpense);

module.exports = router;
