// backend/src/controllers/pantryController.js
const db = require('../config/database');

// Get all pantry items for user
exports.getPantryItems = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const query = `
      SELECT * FROM pantry_items 
      WHERE user_id = $1 
      ORDER BY 
        CASE status
          WHEN 'expired' THEN 1
          WHEN 'expiring_soon' THEN 2
          WHEN 'fresh' THEN 3
        END,
        expiry_date ASC NULLS LAST,
        created_at DESC
    `;
    
    const result = await db.query(query, [userId]);
    
    res.json({
      success: true,
      data: { items: result.rows }
    });
  } catch (error) {
    console.error('Error fetching pantry items:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pantry items',
      error: error.message
    });
  }
};

// Get items expiring soon
exports.getExpiringSoon = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const query = `
      SELECT * FROM pantry_items 
      WHERE user_id = $1 
      AND status IN ('expiring_soon', 'expired')
      ORDER BY expiry_date ASC
    `;
    
    const result = await db.query(query, [userId]);
    
    res.json({
      success: true,
      data: { items: result.rows }
    });
  } catch (error) {
    console.error('Error fetching expiring items:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch expiring items',
      error: error.message
    });
  }
};

// Add pantry item
exports.addPantryItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      item_name,
      category,
      quantity,
      unit,
      purchase_date,
      expiry_date,
      storage_location,
      notes
    } = req.body;
    
    if (!item_name) {
      return res.status(400).json({
        success: false,
        message: 'Item name is required'
      });
    }
    
    const query = `
      INSERT INTO pantry_items (
        user_id, item_name, category, quantity, unit, 
        purchase_date, expiry_date, storage_location, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    
    const values = [
      userId, 
      item_name, 
      category || null, 
      quantity || null, 
      unit || null,
      purchase_date || null, 
      expiry_date || null, 
      storage_location || null, 
      notes || null
    ];
    
    const result = await db.query(query, values);
    
    res.status(201).json({
      success: true,
      message: 'Pantry item added successfully',
      data: { item: result.rows[0] }
    });
  } catch (error) {
    console.error('Error adding pantry item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add pantry item',
      error: error.message
    });
  }
};

// Update pantry item
exports.updatePantryItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const itemId = req.params.id;
    const {
      item_name,
      category,
      quantity,
      unit,
      purchase_date,
      expiry_date,
      storage_location,
      notes
    } = req.body;
    
    const query = `
      UPDATE pantry_items 
      SET 
        item_name = COALESCE($1, item_name),
        category = COALESCE($2, category),
        quantity = COALESCE($3, quantity),
        unit = COALESCE($4, unit),
        purchase_date = COALESCE($5, purchase_date),
        expiry_date = COALESCE($6, expiry_date),
        storage_location = COALESCE($7, storage_location),
        notes = COALESCE($8, notes)
      WHERE id = $9 AND user_id = $10
      RETURNING *
    `;
    
    const values = [
      item_name, category, quantity, unit,
      purchase_date, expiry_date, storage_location, notes,
      itemId, userId
    ];
    
    const result = await db.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pantry item not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Pantry item updated successfully',
      data: { item: result.rows[0] }
    });
  } catch (error) {
    console.error('Error updating pantry item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update pantry item',
      error: error.message
    });
  }
};

// Delete pantry item
exports.deletePantryItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const itemId = req.params.id;
    
    const query = `
      DELETE FROM pantry_items 
      WHERE id = $1 AND user_id = $2
      RETURNING id
    `;
    
    const result = await db.query(query, [itemId, userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pantry item not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Pantry item deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting pantry item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete pantry item',
      error: error.message
    });
  }
};

// Get pantry statistics
exports.getPantryStats = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const query = `
      SELECT 
        COUNT(*) as total_items,
        COUNT(*) FILTER (WHERE status = 'fresh') as fresh_items,
        COUNT(*) FILTER (WHERE status = 'expiring_soon') as expiring_soon,
        COUNT(*) FILTER (WHERE status = 'expired') as expired_items,
        COUNT(DISTINCT category) as categories_count
      FROM pantry_items
      WHERE user_id = $1
    `;
    
    const result = await db.query(query, [userId]);
    
    res.json({
      success: true,
      data: { stats: result.rows[0] }
    });
  } catch (error) {
    console.error('Error fetching pantry stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pantry stats',
      error: error.message
    });
  }
};

// Get items by category
exports.getByCategory = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const query = `
      SELECT 
        category,
        COUNT(*) as item_count,
        COUNT(*) FILTER (WHERE status = 'expiring_soon' OR status = 'expired') as items_needing_attention
      FROM pantry_items
      WHERE user_id = $1 AND category IS NOT NULL
      GROUP BY category
      ORDER BY category
    `;
    
    const result = await db.query(query, [userId]);
    
    res.json({
      success: true,
      data: { categories: result.rows }
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: error.message
    });
  }
};

module.exports = exports;