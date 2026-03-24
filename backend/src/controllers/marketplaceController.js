const pool = require('../config/database');

// ==========================================
// GET ALL MARKETPLACE LISTINGS (Public)
// ==========================================
exports.getMarketplaceListings = async (req, res) => {
  try {
    const {
      cuisine_type,
      is_vegetarian,
      is_vegan,
      is_gluten_free,
      max_price,
      search
    } = req.query;

    console.log('📥 Marketplace query params:', req.query);

    // FIX: removed non-existent columns (cook_name, total_orders, average_rating)
    // Backend JOINs users table, so homecook_name comes from u.full_name
    let query = `
      SELECT 
        r.*,
        u.full_name  AS homecook_name,
        u.email      AS homecook_email
      FROM homecook_recipes r
      JOIN users u ON r.user_id = u.id
      WHERE r.is_available = true
        AND u.homecook_approved = true
    `;

    const params = [];
    let paramCount = 1;

    if (cuisine_type) {
      query += ` AND LOWER(r.cuisine_type) = LOWER($${paramCount})`;
      params.push(cuisine_type);
      paramCount++;
    }

    if (is_vegetarian === 'true') {
      query += ` AND r.is_vegetarian = true`;
    }

    if (is_vegan === 'true') {
      query += ` AND r.is_vegan = true`;
    }

    if (is_gluten_free === 'true') {
      query += ` AND r.is_gluten_free = true`;
    }

    if (max_price) {
      // FIX: column is 'price' not 'price_npr'
      query += ` AND r.price <= $${paramCount}`;
      params.push(parseFloat(max_price));
      paramCount++;
    }

    if (search) {
      query += ` AND (
        LOWER(r.recipe_name) LIKE LOWER($${paramCount}) OR
        LOWER(r.description)  LIKE LOWER($${paramCount}) OR
        LOWER(u.full_name)    LIKE LOWER($${paramCount})
      )`;
      params.push(`%${search}%`);
      paramCount++;
    }

    query += ' ORDER BY r.created_at DESC';

    const result = await pool.query(query, params);

    console.log(`✅ Found ${result.rows.length} marketplace listings`);

    res.json({
      success: true,
      data: {
        // FIX: frontend reads data.data.listings
        listings: result.rows,
        count: result.rows.length
      }
    });

  } catch (error) {
    console.error('❌ Error getting marketplace listings:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while getting marketplace listings',
      error: error.message
    });
  }
};

// ==========================================
// GET SINGLE LISTING DETAIL
// ==========================================
exports.getListingDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT 
        r.*,
        u.full_name AS homecook_name,
        u.email     AS homecook_email
      FROM homecook_recipes r
      JOIN users u ON r.user_id = u.id
      WHERE r.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found'
      });
    }

    res.json({
      success: true,
      data: {
        listing: result.rows[0]
      }
    });

  } catch (error) {
    console.error('❌ Error getting listing:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while getting listing',
      error: error.message
    });
  }
};

// ==========================================
// PLACE ORDER (Buyer)
// ==========================================
exports.placeOrder = async (req, res) => {
  try {
    const buyerId = req.user.id;
    const { recipe_id, quantity, pickup_date, pickup_time, special_notes } = req.body;

    console.log('📥 Place order request:', { buyerId, recipe_id, quantity });

    if (!recipe_id || !quantity) {
      return res.status(400).json({
        success: false,
        message: 'Recipe ID and quantity are required'
      });
    }

    // Get recipe details — FIX: use user_id (not homecook_id) in join
    const recipeResult = await pool.query(
      `SELECT r.*, u.id AS homecook_user_id
       FROM homecook_recipes r
       JOIN users u ON r.user_id = u.id
       WHERE r.id = $1 AND r.is_available = true`,
      [recipe_id]
    );

    if (recipeResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Recipe not found or not available'
      });
    }

    const recipe     = recipeResult.rows[0];
    const homecookId = recipe.homecook_user_id;
    // FIX: use recipe.price (not price_npr)
    const totalPrice = parseFloat(recipe.price) * parseInt(quantity);

    // Prevent ordering your own listing
    if (buyerId === homecookId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot order your own listing'
      });
    }

    const orderResult = await pool.query(
      `INSERT INTO orders (
        buyer_id, homecook_id, recipe_id, quantity,
        total_price, pickup_date, pickup_time, special_notes, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')
      RETURNING *`,
      [buyerId, homecookId, recipe_id, quantity, totalPrice, pickup_date, pickup_time, special_notes]
    );

    console.log('✅ Order created:', orderResult.rows[0].id);

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      data: {
        order: orderResult.rows[0]
      }
    });

  } catch (error) {
    console.error('❌ Error placing order:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while placing order',
      error: error.message
    });
  }
};

// ==========================================
// GET MY ORDERS (Buyer)
// ==========================================
exports.getMyOrders = async (req, res) => {
  try {
    const buyerId = req.user.id;

    const result = await pool.query(
      `SELECT 
        o.*,
        r.recipe_name,
        r.cuisine_type,
        r.price,
        u.full_name AS homecook_name,
        u.email     AS homecook_email
      FROM orders o
      JOIN homecook_recipes r ON o.recipe_id = r.id
      JOIN users u ON o.homecook_id = u.id
      WHERE o.buyer_id = $1
      ORDER BY o.created_at DESC`,
      [buyerId]
    );

    res.json({
      success: true,
      data: {
        orders: result.rows,
        count: result.rows.length
      }
    });

  } catch (error) {
    console.error('❌ Error getting orders:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while getting orders',
      error: error.message
    });
  }
};

// ==========================================
// GET HOMECOOK ORDERS (Incoming orders)
// ==========================================
exports.getHomecookOrders = async (req, res) => {
  try {
    const homecookId = req.user.id;

    const result = await pool.query(
      `SELECT 
        o.*,
        r.recipe_name,
        r.cuisine_type,
        r.price,
        u.full_name AS buyer_name,
        u.email     AS buyer_email
      FROM orders o
      JOIN homecook_recipes r ON o.recipe_id = r.id
      JOIN users u ON o.buyer_id = u.id
      WHERE o.homecook_id = $1
      ORDER BY o.created_at DESC`,
      [homecookId]
    );

    res.json({
      success: true,
      data: {
        orders: result.rows,
        count: result.rows.length
      }
    });

  } catch (error) {
    console.error('❌ Error getting homecook orders:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while getting orders',
      error: error.message
    });
  }
};

// ==========================================
// UPDATE ORDER STATUS (Homecook)
// ==========================================
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id }     = req.params;
    const homecookId = req.user.id;
    const { status } = req.body;

    const validStatuses = ['confirmed', 'ready_for_pickup', 'completed', 'no_show'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be one of: ' + validStatuses.join(', ')
      });
    }

    const result = await pool.query(
      `UPDATE orders
       SET status = $1, updated_at = NOW()
       WHERE id = $2 AND homecook_id = $3
       RETURNING *`,
      [status, id, homecookId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found or unauthorized'
      });
    }

    res.json({
      success: true,
      message: 'Order status updated',
      data: {
        order: result.rows[0]
      }
    });

  } catch (error) {
    console.error('❌ Error updating order:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating order',
      error: error.message
    });
  }
};

// ==========================================
// CANCEL ORDER (Buyer)
// ==========================================
exports.cancelOrder = async (req, res) => {
  try {
    const { id }  = req.params;
    const buyerId = req.user.id;

    const result = await pool.query(
      `UPDATE orders
       SET status = 'cancelled', updated_at = NOW()
       WHERE id = $1 AND buyer_id = $2 AND status = 'pending'
       RETURNING *`,
      [id, buyerId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found, unauthorized, or cannot be cancelled'
      });
    }

    res.json({
      success: true,
      message: 'Order cancelled',
      data: {
        order: result.rows[0]
      }
    });

  } catch (error) {
    console.error('❌ Error cancelling order:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while cancelling order',
      error: error.message
    });
  }
};

// ==========================================
// SUBMIT REVIEW
// ==========================================
exports.submitReview = async (req, res) => {
  try {
    const reviewerId = req.user.id;
    const { order_id, recipe_id, rating, comment, review_type } = req.body;

    if (!order_id || !rating || !review_type) {
      return res.status(400).json({
        success: false,
        message: 'Order ID, rating, and review type are required'
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    // Check order is completed
    const orderCheck = await pool.query(
      'SELECT * FROM orders WHERE id = $1 AND status = $2',
      [order_id, 'completed']
    );

    if (orderCheck.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order not found or not completed'
      });
    }

    // FIX: use 'comment' column name (frontend sends 'comment', not 'review_text')
    const result = await pool.query(
      `INSERT INTO reviews (
        order_id, recipe_id, reviewer_id, rating, comment, review_type
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [order_id, recipe_id, reviewerId, rating, comment, review_type]
    );

    res.status(201).json({
      success: true,
      message: 'Review submitted',
      data: {
        review: result.rows[0]
      }
    });

  } catch (error) {
    console.error('❌ Error submitting review:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while submitting review',
      error: error.message
    });
  }
};

// ==========================================
// GET RECIPE REVIEWS
// ==========================================
exports.getRecipeReviews = async (req, res) => {
  try {
    const { recipeId } = req.params;

    const result = await pool.query(
      `SELECT 
        r.*,
        u.full_name AS reviewer_name
      FROM reviews r
      JOIN users u ON r.reviewer_id = u.id
      WHERE r.recipe_id = $1
      ORDER BY r.created_at DESC`,
      [recipeId]
    );

    res.json({
      success: true,
      data: {
        reviews: result.rows,
        count: result.rows.length
      }
    });

  } catch (error) {
    console.error('❌ Error getting reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while getting reviews',
      error: error.message
    });
  }
};