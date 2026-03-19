const db = require('../config/database');

// ============================================================
// PUBLIC LISTINGS — all authenticated users
// ============================================================

// GET /api/marketplace/listings
// Returns all available homecook_recipes with cook name joined
exports.getListings = async (req, res) => {
  try {
    const { search, is_vegetarian, is_vegan, is_gluten_free, max_price, cuisine_type } = req.query;

    let conditions = ['hr.available = true'];
    const values = [];
    let idx = 1;

    if (search) {
      conditions.push(`(
        hr.recipe_name ILIKE $${idx} OR
        hr.description ILIKE $${idx} OR
        hr.cuisine_type ILIKE $${idx} OR
        u.full_name ILIKE $${idx}
      )`);
      values.push(`%${search}%`);
      idx++;
    }
    if (is_vegetarian === 'true') { conditions.push(`hr.is_vegetarian = true`); }
    if (is_vegan === 'true')      { conditions.push(`hr.is_vegan = true`); }
    if (is_gluten_free === 'true') { conditions.push(`hr.is_gluten_free = true`); }
    if (max_price)  { conditions.push(`hr.price_npr <= $${idx}`); values.push(parseFloat(max_price)); idx++; }
    if (cuisine_type) { conditions.push(`hr.cuisine_type ILIKE $${idx}`); values.push(cuisine_type); idx++; }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const query = `
      SELECT
        hr.*,
        u.full_name AS cook_name
      FROM homecook_recipes hr
      JOIN users u ON hr.homecook_id = u.id
      ${where}
      ORDER BY hr.average_rating DESC NULLS LAST, hr.created_at DESC
    `;

    const result = await db.query(query, values);

    res.json({
      success: true,
      data: { recipes: result.rows }
    });
  } catch (error) {
    console.error('Get listings error:', error);
    res.status(500).json({ success: false, message: 'Failed to get listings', error: error.message });
  }
};

// GET /api/marketplace/listings/:id
exports.getListingById = async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT hr.*, u.full_name AS cook_name
      FROM homecook_recipes hr
      JOIN users u ON hr.homecook_id = u.id
      WHERE hr.id = $1
    `;

    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Recipe not found' });
    }

    res.json({ success: true, data: { recipe: result.rows[0] } });
  } catch (error) {
    console.error('Get listing error:', error);
    res.status(500).json({ success: false, message: 'Failed to get listing', error: error.message });
  }
};

// ============================================================
// ORDERS
// ============================================================

// POST /api/marketplace/orders
exports.placeOrder = async (req, res) => {
  try {
    const buyerId = req.user.id;
    const { recipe_id, quantity, pickup_date, pickup_time, special_notes } = req.body;

    if (!recipe_id) {
      return res.status(400).json({ success: false, message: 'Recipe ID is required' });
    }

    // Get recipe to verify it exists, is available, and get price + homecook
    const recipeResult = await db.query(
      'SELECT * FROM homecook_recipes WHERE id = $1 AND available = true',
      [recipe_id]
    );

    if (recipeResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Recipe not found or not available' });
    }

    const recipe = recipeResult.rows[0];

    // Prevent homecooks from ordering their own food
    if (recipe.homecook_id === buyerId) {
      return res.status(400).json({ success: false, message: 'You cannot order your own listing' });
    }

    const qty = parseInt(quantity) || 1;
    const totalPrice = parseFloat(recipe.price_npr) * qty;

    const query = `
      INSERT INTO marketplace_orders
        (recipe_id, buyer_id, homecook_id, quantity, total_price_npr, pickup_date, pickup_time, special_notes, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')
      RETURNING *
    `;

    const result = await db.query(query, [
      recipe_id, buyerId, recipe.homecook_id,
      qty, totalPrice, pickup_date || null, pickup_time || null, special_notes || null
    ]);

    // Increment total_orders on recipe
    await db.query(
      'UPDATE homecook_recipes SET total_orders = COALESCE(total_orders, 0) + 1 WHERE id = $1',
      [recipe_id]
    );

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      data: { order: result.rows[0] }
    });
  } catch (error) {
    console.error('Place order error:', error);
    res.status(500).json({ success: false, message: 'Failed to place order', error: error.message });
  }
};

// GET /api/marketplace/orders/my-orders  (buyer's own orders)
exports.getMyOrders = async (req, res) => {
  try {
    const buyerId = req.user.id;

    const query = `
      SELECT
        mo.*,
        hr.recipe_name,
        hr.cuisine_type,
        u.full_name AS cook_name,
        CASE WHEN rr.id IS NOT NULL THEN true ELSE false END AS has_reviewed
      FROM marketplace_orders mo
      JOIN homecook_recipes hr ON mo.recipe_id = hr.id
      JOIN users u ON mo.homecook_id = u.id
      LEFT JOIN recipe_reviews rr
        ON rr.order_id = mo.id AND rr.reviewer_id = $1 AND rr.review_type = 'buyer_to_homecook'
      WHERE mo.buyer_id = $1
      ORDER BY mo.created_at DESC
    `;

    const result = await db.query(query, [buyerId]);

    res.json({ success: true, data: { orders: result.rows } });
  } catch (error) {
    console.error('Get my orders error:', error);
    res.status(500).json({ success: false, message: 'Failed to get orders', error: error.message });
  }
};

// GET /api/marketplace/orders/homecook-orders  (incoming orders for homecook)
exports.getHomecookOrders = async (req, res) => {
  try {
    const homecookId = req.user.id;

    // Verify homecook role
    const userResult = await db.query('SELECT role FROM users WHERE id = $1', [homecookId]);
    if (userResult.rows[0]?.role !== 'homecook') {
      return res.status(403).json({ success: false, message: 'Only homecooks can access this' });
    }

    const query = `
      SELECT
        mo.*,
        hr.recipe_name,
        hr.cuisine_type,
        u.full_name AS buyer_name,
        CASE WHEN rr.id IS NOT NULL THEN true ELSE false END AS has_reviewed
      FROM marketplace_orders mo
      JOIN homecook_recipes hr ON mo.recipe_id = hr.id
      JOIN users u ON mo.buyer_id = u.id
      LEFT JOIN recipe_reviews rr
        ON rr.order_id = mo.id AND rr.reviewer_id = $1 AND rr.review_type = 'homecook_to_buyer'
      WHERE mo.homecook_id = $1
      ORDER BY mo.created_at DESC
    `;

    const result = await db.query(query, [homecookId]);

    res.json({ success: true, data: { orders: result.rows } });
  } catch (error) {
    console.error('Get homecook orders error:', error);
    res.status(500).json({ success: false, message: 'Failed to get orders', error: error.message });
  }
};

// PUT /api/marketplace/orders/:id/status  (homecook updates order status)
exports.updateOrderStatus = async (req, res) => {
  try {
    const homecookId = req.user.id;
    const orderId = req.params.id;
    const { status } = req.body;

    const validStatuses = ['confirmed', 'ready_for_pickup', 'completed', 'no_show', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    // Verify this order belongs to this homecook
    const orderCheck = await db.query(
      'SELECT * FROM marketplace_orders WHERE id = $1 AND homecook_id = $2',
      [orderId, homecookId]
    );

    if (orderCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Order not found or not authorized' });
    }

    const result = await db.query(
      'UPDATE marketplace_orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [status, orderId]
    );

    res.json({
      success: true,
      message: `Order status updated to ${status}`,
      data: { order: result.rows[0] }
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ success: false, message: 'Failed to update order', error: error.message });
  }
};

// PUT /api/marketplace/orders/:id/cancel  (buyer cancels their pending order)
exports.cancelOrder = async (req, res) => {
  try {
    const buyerId = req.user.id;
    const orderId = req.params.id;

    const orderCheck = await db.query(
      "SELECT * FROM marketplace_orders WHERE id = $1 AND buyer_id = $2 AND status = 'pending'",
      [orderId, buyerId]
    );

    if (orderCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found, not yours, or cannot be cancelled (only pending orders can be cancelled)'
      });
    }

    const result = await db.query(
      "UPDATE marketplace_orders SET status = 'cancelled', updated_at = NOW() WHERE id = $1 RETURNING *",
      [orderId]
    );

    res.json({
      success: true,
      message: 'Order cancelled',
      data: { order: result.rows[0] }
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ success: false, message: 'Failed to cancel order', error: error.message });
  }
};

// ============================================================
// REVIEWS
// ============================================================

// POST /api/marketplace/reviews
exports.submitReview = async (req, res) => {
  try {
    const reviewerId = req.user.id;
    const { order_id, recipe_id, reviewee_id, review_type, rating, comment } = req.body;

    if (!order_id || !recipe_id || !reviewee_id || !review_type || !rating) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }

    // Verify order exists and is completed
    const orderCheck = await db.query(
      "SELECT * FROM marketplace_orders WHERE id = $1 AND status = 'completed'",
      [order_id]
    );

    if (orderCheck.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Can only review completed orders'
      });
    }

    // Check reviewer is part of this order
    const order = orderCheck.rows[0];
    if (order.buyer_id !== reviewerId && order.homecook_id !== reviewerId) {
      return res.status(403).json({ success: false, message: 'Not authorized to review this order' });
    }

    // Prevent duplicate reviews
    const dupCheck = await db.query(
      'SELECT id FROM recipe_reviews WHERE order_id = $1 AND reviewer_id = $2 AND review_type = $3',
      [order_id, reviewerId, review_type]
    );

    if (dupCheck.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'You have already reviewed this order' });
    }

    const result = await db.query(
      `INSERT INTO recipe_reviews (recipe_id, order_id, reviewer_id, reviewee_id, review_type, rating, comment)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [recipe_id, order_id, reviewerId, reviewee_id, review_type, rating, comment || null]
    );

    // Recalculate average rating for recipe (buyer_to_homecook reviews only)
    if (review_type === 'buyer_to_homecook') {
      await db.query(
        `UPDATE homecook_recipes
         SET average_rating = (
           SELECT AVG(rating) FROM recipe_reviews
           WHERE recipe_id = $1 AND review_type = 'buyer_to_homecook'
         )
         WHERE id = $1`,
        [recipe_id]
      );
    }

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      data: { review: result.rows[0] }
    });
  } catch (error) {
    console.error('Submit review error:', error);
    res.status(500).json({ success: false, message: 'Failed to submit review', error: error.message });
  }
};

// GET /api/marketplace/reviews/recipe/:id
exports.getRecipeReviews = async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT
        rr.*,
        u.full_name AS reviewer_name
      FROM recipe_reviews rr
      JOIN users u ON rr.reviewer_id = u.id
      WHERE rr.recipe_id = $1 AND rr.review_type = 'buyer_to_homecook'
      ORDER BY rr.created_at DESC
    `;

    const result = await db.query(query, [id]);

    res.json({ success: true, data: { reviews: result.rows } });
  } catch (error) {
    console.error('Get recipe reviews error:', error);
    res.status(500).json({ success: false, message: 'Failed to get reviews', error: error.message });
  }
};

module.exports = exports;