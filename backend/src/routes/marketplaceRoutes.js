const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getMarketplaceListings,
  getListingDetail,
  placeOrder,
  getMyOrders,
  getHomecookOrders,
  updateOrderStatus,
  cancelOrder,
  submitReview,
  getRecipeReviews
} = require('../controllers/marketplaceController');

// MARKETPLACE LISTING ROUTES (Public/Protected)

// Public routes (no auth required)
router.get('/listings', getMarketplaceListings);
router.get('/listings/:id', getListingDetail);
router.get('/reviews/recipe/:recipeId', getRecipeReviews);

// Protected routes (auth required)
router.post('/orders', protect, placeOrder);
router.get('/orders/my-orders', protect, getMyOrders);
router.get('/orders/homecook-orders', protect, getHomecookOrders);
router.put('/orders/:id/status', protect, updateOrderStatus);
router.put('/orders/:id/cancel', protect, cancelOrder);
router.post('/reviews', protect, submitReview);

module.exports = router;