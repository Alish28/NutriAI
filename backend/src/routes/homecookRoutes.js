// backend/src/routes/homecookRoutes.js

const express = require('express');
const router = express.Router();
const homecookController = require('../controllers/homecookController');
const authMiddleware = require('../middleware/authMiddleware');

// All routes require authentication
router.use(authMiddleware);

// ============================================
// APPLICATION ROUTES
// ============================================

// Apply to become a homecook
router.post('/apply', homecookController.applyHomecook);

// Get own application status
router.get('/application', homecookController.getApplicationStatus);

// Toggle between consumer and homecook mode (if approved)
router.post('/toggle-mode', homecookController.toggleHomecookMode);

// ============================================
// RECIPE MANAGEMENT ROUTES (for homecooks)
// ============================================

// Get own recipes
router.get('/my-recipes', homecookController.getMyRecipes);

// Add new recipe to marketplace
router.post('/recipes', homecookController.addRecipe);

// Update own recipe
router.put('/recipes/:id', homecookController.updateRecipe);

// Delete own recipe
router.delete('/recipes/:id', homecookController.deleteRecipe);

// ============================================
// PUBLIC PROFILE ROUTES
// ============================================

// Get homecook profile (viewable by anyone)
router.get('/profile/:id', homecookController.getHomecookProfile);

module.exports = router;