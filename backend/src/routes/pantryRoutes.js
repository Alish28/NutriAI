// backend/src/routes/pantryRoutes.js

const express = require('express');
const router = express.Router();
const pantryController = require('../controllers/pantryController');
const authMiddleware = require('../middleware/authMiddleware');

// All routes require authentication
router.use(authMiddleware);

// Get all pantry items for logged-in user
router.get('/', pantryController.getPantryItems);

// Get items expiring soon
router.get('/expiring-soon', pantryController.getExpiringSoon);

// Get pantry statistics
router.get('/stats', pantryController.getPantryStats);

// Get items by category
router.get('/by-category', pantryController.getByCategory);

// Add new pantry item
router.post('/', pantryController.addPantryItem);

// Update pantry item
router.put('/:id', pantryController.updatePantryItem);

// Delete pantry item
router.delete('/:id', pantryController.deletePantryItem);

module.exports = router;