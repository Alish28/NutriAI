const pool = require('../config/database');

// ==========================================
// GET ALL MARKETPLACE LISTINGS (Public)
// ==========================================
exports.getMarketplaceListings = async (req, res) => {
  try {
    const { cuisine_type, is_vegetarian, is_vegan, is_gluten_free, max_price, search } = req.query;
    console.log('📥 Marketplace query params:', req.query);

    // Try with pickup location columns first, fall back if they don't exist
    let query = `
      SELECT r.*, u.full_name AS homecook_name, u.email AS homecook_email
      FROM homecook_recipes r
      JOIN users u ON r.user_id = u.id
      WHERE r.is_available = true AND u.homecook_approved = true
    `;

    const params = [];
    let p = 1;

    if (cuisine_type) { query += ` AND LOWER(r.cuisine_type) = LOWER($${p})`; params.push(cuisine_type); p++; }
    if (is_vegetarian === 'true') query += ` AND r.is_vegetarian = true`;
    if (is_vegan === 'true') query += ` AND r.is_vegan = true`;
    if (is_gluten_free === 'true') query += ` AND r.is_gluten_free = true`;
    if (max_price) { query += ` AND r.price <= $${p}`; params.push(parseFloat(max_price)); p++; }
    if (search) {
      query += ` AND (LOWER(r.recipe_name) LIKE LOWER($${p}) OR LOWER(r.description) LIKE LOWER($${p}) OR LOWER(u.full_name) LIKE LOWER($${p}))`;
      params.push(`%${search}%`); p++;
    }
    query += ' ORDER BY r.created_at DESC';

    const result = await pool.query(query, params);
    console.log(`✅ Found ${result.rows.length} marketplace listings`);

    // Try to add pickup location data from users table (may not exist yet)
    let rows = result.rows;
    try {
      const withLocation = await pool.query(
        `SELECT r.*, u.full_name AS homecook_name, u.email AS homecook_email,
                u.pickup_lat, u.pickup_lng, u.pickup_address
         FROM homecook_recipes r JOIN users u ON r.user_id = u.id
         WHERE r.is_available = true AND u.homecook_approved = true
         ORDER BY r.created_at DESC`
      );
      rows = withLocation.rows;
    } catch (e) {
      // pickup columns not added yet — use rows without them
    }

    res.json({ success: true, data: { listings: rows, count: rows.length } });
  } catch (error) {
    console.error('❌ Error getting marketplace listings:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ==========================================
// GET SINGLE LISTING DETAIL
// ==========================================
exports.getListingDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT r.*, u.full_name AS homecook_name, u.email AS homecook_email
       FROM homecook_recipes r JOIN users u ON r.user_id = u.id WHERE r.id = $1`,
      [id]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'Listing not found' });
    res.json({ success: true, data: { listing: result.rows[0] } });
  } catch (error) {
    console.error('❌ Error getting listing:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ==========================================
// PLACE ORDER
// FIX: pickup_time column is TIMESTAMP — combine pickup_date + pickup_time into one value
// ==========================================
exports.placeOrder = async (req, res) => {
  try {
    const buyerId = req.user.id;
    const { recipe_id, quantity, pickup_date, pickup_time, special_notes } = req.body;
    console.log('📥 Place order request:', { buyerId, recipe_id, quantity, pickup_date, pickup_time });

    if (!recipe_id || !quantity)
      return res.status(400).json({ success: false, message: 'Recipe ID and quantity are required' });

    // Get recipe + homecook
    const recipeResult = await pool.query(
      `SELECT r.*, u.id AS homecook_user_id FROM homecook_recipes r
       JOIN users u ON r.user_id = u.id WHERE r.id = $1 AND r.is_available = true`,
      [recipe_id]
    );
    if (!recipeResult.rows.length)
      return res.status(404).json({ success: false, message: 'Recipe not found or not available' });

    const recipe = recipeResult.rows[0];
    const homecookId = recipe.homecook_user_id;
    const totalPrice = parseFloat(recipe.price) * parseInt(quantity);

    if (buyerId === homecookId)
      return res.status(400).json({ success: false, message: 'You cannot order your own listing' });

    // Detect actual columns in orders table
    const colResult = await pool.query(
      `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'orders'`
    );
    const colMap = {};
    colResult.rows.forEach(r => { colMap[r.column_name] = r.data_type; });
    const cols = Object.keys(colMap);
    console.log('📋 Orders table columns:', cols);

    const insertCols = ['buyer_id', 'homecook_id', 'recipe_id', 'quantity', 'total_price', 'status'];
    const insertVals = [buyerId, homecookId, recipe_id, quantity, totalPrice, 'pending'];

    // FIX: pickup_time column is TIMESTAMP — combine date + time into a proper timestamp
    if (cols.includes('pickup_time') && pickup_date) {
      const timeStr = pickup_time || '12:00';
      // Build a proper timestamp string: "2024-01-15 16:00:00"
      const timestampValue = `${pickup_date} ${timeStr}:00`;
      insertCols.push('pickup_time');
      insertVals.push(timestampValue);
    }

    // Handle special_requests (the actual column name in your DB)
    if (cols.includes('special_requests') && special_notes) {
      insertCols.push('special_requests');
      insertVals.push(special_notes);
    } else if (cols.includes('special_notes') && special_notes) {
      insertCols.push('special_notes');
      insertVals.push(special_notes);
    } else if (cols.includes('notes') && special_notes) {
      insertCols.push('notes');
      insertVals.push(special_notes);
    }

    const placeholders = insertVals.map((_, i) => `$${i + 1}`).join(', ');
    const orderResult = await pool.query(
      `INSERT INTO orders (${insertCols.join(', ')}) VALUES (${placeholders}) RETURNING *`,
      insertVals
    );

    console.log('✅ Order created:', orderResult.rows[0].id);
    res.status(201).json({ success: true, message: 'Order placed successfully', data: { order: orderResult.rows[0] } });
  } catch (error) {
    console.error('❌ Error placing order:', error);
    res.status(500).json({ success: false, message: 'Server error while placing order', error: error.message });
  }
};

// ==========================================
// GET MY ORDERS (Buyer)
// ==========================================
exports.getMyOrders = async (req, res) => {
  try {
    const buyerId = req.user.id;
    const result = await pool.query(
      `SELECT o.*, r.recipe_name, r.cuisine_type, r.price,
              u.full_name AS homecook_name, u.email AS homecook_email,
              -- check if buyer has already reviewed this order
              EXISTS(
                SELECT 1 FROM reviews rv
                WHERE rv.order_id = o.id AND rv.reviewer_id = $1
              ) AS has_reviewed
       FROM orders o
       JOIN homecook_recipes r ON o.recipe_id = r.id
       JOIN users u ON o.homecook_id = u.id
       WHERE o.buyer_id = $1 ORDER BY o.created_at DESC`,
      [buyerId]
    );
    res.json({ success: true, data: { orders: result.rows, count: result.rows.length } });
  } catch (error) {
    console.error('❌ Error getting orders:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ==========================================
// GET HOMECOOK ORDERS
// ==========================================
exports.getHomecookOrders = async (req, res) => {
  try {
    const homecookId = req.user.id;
    const result = await pool.query(
      `SELECT o.*, r.recipe_name, r.cuisine_type, r.price,
              u.full_name AS buyer_name, u.email AS buyer_email,
              EXISTS(
                SELECT 1 FROM reviews rv
                WHERE rv.order_id = o.id AND rv.reviewer_id = $1
              ) AS has_reviewed
       FROM orders o
       JOIN homecook_recipes r ON o.recipe_id = r.id
       JOIN users u ON o.buyer_id = u.id
       WHERE o.homecook_id = $1 ORDER BY o.created_at DESC`,
      [homecookId]
    );
    res.json({ success: true, data: { orders: result.rows, count: result.rows.length } });
  } catch (error) {
    console.error('❌ Error getting homecook orders:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ==========================================
// UPDATE ORDER STATUS (Homecook)
// ==========================================
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const homecookId = req.user.id;
    const { status } = req.body;
    const valid = ['confirmed', 'ready_for_pickup', 'completed', 'no_show'];
    if (!valid.includes(status))
      return res.status(400).json({ success: false, message: 'Invalid status' });

    const result = await pool.query(
      `UPDATE orders SET status=$1, updated_at=NOW() WHERE id=$2 AND homecook_id=$3 RETURNING *`,
      [status, id, homecookId]
    );
    if (!result.rows.length)
      return res.status(404).json({ success: false, message: 'Order not found or unauthorized' });

    res.json({ success: true, message: 'Order status updated', data: { order: result.rows[0] } });
  } catch (error) {
    console.error('❌ Error updating order:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ==========================================
// CANCEL ORDER (Buyer)
// ==========================================
exports.cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const buyerId = req.user.id;
    const result = await pool.query(
      `UPDATE orders SET status='cancelled', updated_at=NOW()
       WHERE id=$1 AND buyer_id=$2 AND status='pending' RETURNING *`,
      [id, buyerId]
    );
    if (!result.rows.length)
      return res.status(404).json({ success: false, message: 'Order not found or cannot be cancelled' });

    res.json({ success: true, message: 'Order cancelled', data: { order: result.rows[0] } });
  } catch (error) {
    console.error('❌ Error cancelling order:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ==========================================
// SUBMIT REVIEW
// Reviews can only be left after order is COMPLETED
// ==========================================
exports.submitReview = async (req, res) => {
  try {
    const reviewerId = req.user.id;
    const { order_id, recipe_id, rating, comment, review_type } = req.body;

    if (!order_id || !rating || !review_type)
      return res.status(400).json({ success: false, message: 'order_id, rating, review_type required' });
    if (rating < 1 || rating > 5)
      return res.status(400).json({ success: false, message: 'Rating must be 1-5' });

    // Verify order is completed
    const orderCheck = await pool.query(
      'SELECT * FROM orders WHERE id=$1 AND status=$2', [order_id, 'completed']
    );
    if (!orderCheck.rows.length)
      return res.status(400).json({
        success: false,
        message: 'Order must be completed before leaving a review'
      });

    // Check if already reviewed
    const dupCheck = await pool.query(
      'SELECT id FROM reviews WHERE order_id=$1 AND reviewer_id=$2', [order_id, reviewerId]
    );
    if (dupCheck.rows.length)
      return res.status(400).json({ success: false, message: 'You have already reviewed this order' });

    // Detect comment column name
    const colResult = await pool.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name='reviews'`
    );
    const cols = colResult.rows.map(r => r.column_name);
    const commentCol = cols.includes('comment') ? 'comment'
      : cols.includes('review_text') ? 'review_text' : 'comment';

    const result = await pool.query(
      `INSERT INTO reviews (order_id, recipe_id, reviewer_id, rating, ${commentCol}, review_type)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [order_id, recipe_id, reviewerId, rating, comment || '', review_type]
    );
    res.status(201).json({ success: true, message: 'Review submitted successfully', data: { review: result.rows[0] } });
  } catch (error) {
    console.error('❌ Error submitting review:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ==========================================
// GET RECIPE REVIEWS
// ==========================================
exports.getRecipeReviews = async (req, res) => {
  try {
    const { recipeId } = req.params;
    const result = await pool.query(
      `SELECT r.*, u.full_name AS reviewer_name FROM reviews r
       JOIN users u ON r.reviewer_id = u.id WHERE r.recipe_id=$1 ORDER BY r.created_at DESC`,
      [recipeId]
    );
    res.json({ success: true, data: { reviews: result.rows, count: result.rows.length } });
  } catch (error) {
    console.error('❌ Error getting reviews:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};