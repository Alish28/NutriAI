const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  createRecipe,
  getAllRecipes,
  getMyRecipes,
  getRecipeById,
  updateRecipe,
  deleteRecipe,
  toggleRecipeAvailability
} = require('../controllers/recipeController');


// PUBLIC ROUTES (no auth required)
// Get all available recipes (public marketplace)
router.get('/all', getAllRecipes);

// Get single recipe by ID (public)
router.get('/:id', getRecipeById);

// PROTECTED ROUTES (auth required)

// Get MY recipes (homecook's own recipes)
router.get('/my/recipes', protect, getMyRecipes);

// Create new recipe (homecook only - checked in controller)
router.post('/', protect, createRecipe);

// Update recipe (homecook - own recipes only)
router.put('/:id', protect, updateRecipe);

// Delete recipe (homecook - own recipes only)
router.delete('/:id', protect, deleteRecipe);

// Toggle recipe availability (homecook - own recipes only)
router.patch('/:id/toggle', protect, toggleRecipeAvailability);

module.exports = router;