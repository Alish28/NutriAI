const express = require('express');
const router = express.Router();
const recipeController = require('../controllers/recipeController');
const { protect } = require('../middleware/authMiddleware');

// Public routes (anyone can view)
router.get('/all', recipeController.getAllRecipes);
router.get('/:id', recipeController.getRecipeById);

// Protected routes (require authentication)
router.post('/', protect, recipeController.createRecipe);
router.get('/my/recipes', protect, recipeController.getMyRecipes);
router.put('/:id', protect, recipeController.updateRecipe);
router.delete('/:id', protect, recipeController.deleteRecipe);
router.patch('/:id/toggle', protect, recipeController.toggleAvailability);

module.exports = router;