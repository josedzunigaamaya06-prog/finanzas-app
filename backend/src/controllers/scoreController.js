const scoreService = require('../services/scoreService');

const getScore = async (req, res, next) => {
  try {
    const result = await scoreService.calculateScore(req.user.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

module.exports = { getScore };
