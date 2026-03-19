const express = require('express');
const router = express.Router();
const marketplaceController = require('../controllers/marketplaceController');
const { protect } = require('../middleware/authMiddleware');

// All marketplace routes require authentication
router.use(protect);

// ── Listings (public browsing) ─────────────────────────────
router.get('/listings',     marketplaceController.getListings);
router.get('/listings/:id', marketplaceController.getListingById);

// ── Orders ─────────────────────────────────────────────────
router.post('/orders',                      marketplaceController.placeOrder);
router.get('/orders/my-orders',             marketplaceController.getMyOrders);
router.get('/orders/homecook-orders',       marketplaceController.getHomecookOrders);
router.put('/orders/:id/status',            marketplaceController.updateOrderStatus);
router.put('/orders/:id/cancel',            marketplaceController.cancelOrder);

// ── Reviews ────────────────────────────────────────────────
router.post('/reviews',                     marketplaceController.submitReview);
router.get('/reviews/recipe/:id',           marketplaceController.getRecipeReviews);

module.exports = router;