const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const { protect } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(protect);

// Get user profile
router.get('/', profileController.getProfile);

// Update user profile
router.put('/', profileController.updateProfile);

// Update password
router.put('/password', profileController.updatePassword);

// Export user data
router.get('/export', profileController.exportData);

// Delete account
router.delete('/', profileController.deleteAccount);

module.exports = router;