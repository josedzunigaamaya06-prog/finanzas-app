const express = require('express');
const router  = express.Router();
const { getWrapped } = require('../controllers/wrappedController');
const { authenticate } = require('../middleware/auth');
router.use(authenticate);
router.get('/', getWrapped);
module.exports = router;
