const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/recommendations', aiController.getRecommendations);
router.get('/weekly-plan', aiController.getWeeklyMealPlan);
router.post('/feedback', aiController.submitFeedback);
router.get('/insights', aiController.getInsights);

module.exports = router;