const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

// All AI routes require authentication
router.use(protect);

// Get AI meal recommendations
router.get('/recommendations', aiController.getRecommendations);

// GET /api/ai/weekly-plan
// Generate a simple 7-day meal plan using the existing recommendation engine
router.get('/weekly-plan', aiController.getWeeklyMealPlan);

// POST /api/ai/feedback
// Submit feedback on recommendation (accepted/rejected)
router.post('/feedback', aiController.submitFeedback);

// GET /api/ai/insights
// Get AI insights about eating patterns
router.get('/insights', aiController.getInsights);

module.exports = router;
