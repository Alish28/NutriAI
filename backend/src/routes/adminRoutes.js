// backend/src/routes/adminRoutes.js

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');

// All routes require authentication AND admin role
router.use(authMiddleware);
router.use(adminController.requireAdmin);

// ============================================
// APPLICATION MANAGEMENT
// ============================================

// Get all pending applications
router.get('/applications/pending', adminController.getPendingApplications);

// Get all applications (with optional status filter)
router.get('/applications', adminController.getAllApplications);

// Approve application
router.post('/applications/:id/approve', adminController.approveApplication);

// Reject application
router.post('/applications/:id/reject', adminController.rejectApplication);

// ============================================
// USER MANAGEMENT
// ============================================

// Get all users (with optional filters)
router.get('/users', adminController.getAllUsers);

// ============================================
// STATISTICS
// ============================================

// Get admin dashboard statistics
router.get('/stats', adminController.getAdminStats);

module.exports = router;