const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(protect);

router.get('/weekly', analyticsController.getWeeklyTrends);
router.get('/streak', analyticsController.getStreak);
router.get('/weekly-averages', analyticsController.getWeeklyAverages);

module.exports = router;
