const express = require('express');
const router = express.Router();
const mealController = require('../controllers/mealController');
const { protect } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(protect);

// Create meal
router.post('/', mealController.createMeal);

// Get all meals for user
router.get('/', mealController.getUserMeals);

// Get meals by date
router.get('/date/:date', mealController.getMealsByDate);

// Get meals by week
router.get('/week', mealController.getMealsByWeek);

// Get nutrition summary for date
router.get('/nutrition/:date', mealController.getNutritionSummary);

// Get nutrition summary for range
router.get('/nutrition-range', mealController.getNutritionSummaryRange);

// Get single meal
router.get('/:id', mealController.getMeal);

// Update meal
router.put('/:id', mealController.updateMeal);

// Delete meal
router.delete('/:id', mealController.deleteMeal);

module.exports = router;