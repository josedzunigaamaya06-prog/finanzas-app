const express = require('express');
const router  = express.Router();
const { getStreak } = require('../controllers/streakController');
const { authenticate } = require('../middleware/auth');
router.use(authenticate);
router.get('/', getStreak);
module.exports = router;
