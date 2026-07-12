const express = require('express');
const router  = express.Router();
const { getScore } = require('../controllers/scoreController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/', getScore);

module.exports = router;
