// backend/src/routes/recipeRoutes.js
// Recipe management routes

const express = require('express');
const router = express.Router();
const recipeController = require('../controllers/recipeController');
const { authenticateToken } = require('../middleware/auth');

// Public routes (anyone can view)
router.get('/all', recipeController.getAllRecipes);
router.get('/:id', recipeController.getRecipeById);

// Protected routes (require authentication)
router.post('/', authenticateToken, recipeController.createRecipe);
router.get('/my/recipes', authenticateToken, recipeController.getMyRecipes);
router.put('/:id', authenticateToken, recipeController.updateRecipe);
router.delete('/:id', authenticateToken, recipeController.deleteRecipe);
router.patch('/:id/toggle', authenticateToken, recipeController.toggleAvailability);

module.exports = router;