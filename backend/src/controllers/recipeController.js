// backend/src/controllers/recipeController.js
// UPDATED to match YOUR database schema

const pool = require('../config/database');

// Create new recipe
exports.createRecipe = async (req, res) => {
  try {
    console.log('📥 Create recipe request:', req.body);
    console.log('👤 User ID:', req.user.id);
    
    const {
      recipe_name,
      description,
      cuisine_type,
      price,
      prep_time_minutes,
      servings,
      ingredients,
      instructions,
      is_vegan,
      is_vegetarian,
      is_gluten_free,
      is_dairy_free
    } = req.body;

    // Check if user is approved homecook
    const userCheck = await pool.query(
      'SELECT homecook_approved FROM users WHERE id = $1',
      [req.user.id]
    );

    if (!userCheck.rows[0] || !userCheck.rows[0].homecook_approved) {
      return res.status(403).json({
        success: false,
        message: 'Only approved homecooks can create recipes'
      });
    }

    // Insert recipe
    const result = await pool.query(
      `INSERT INTO homecook_recipes (
        user_id, recipe_name, description, cuisine_type,
        price, prep_time_minutes, servings,
        ingredients, instructions,
        is_vegan, is_vegetarian, is_gluten_free, is_dairy_free,
        is_available, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, true, NOW(), NOW())
      RETURNING *`,
      [
        req.user.id,
        recipe_name,
        description,
        cuisine_type,
        price,
        prep_time_minutes || 30,
        servings || 2,
        Array.isArray(ingredients) ? ingredients : [],
        Array.isArray(instructions) ? instructions : [],
        is_vegan || false,
        is_vegetarian || false,
        is_gluten_free || false,
        is_dairy_free || false
      ]
    );

    console.log('✅ Recipe created:', result.rows[0]);

    res.status(201).json({
      success: true,
      message: 'Recipe created successfully',
      data: {
        recipe: result.rows[0]
      }
    });
  } catch (error) {
    console.error('❌ Error creating recipe:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create recipe',
      error: error.message
    });
  }
};

// Get all recipes (public)
exports.getAllRecipes = async (req, res) => {
  try {
    const { cuisine, min_price, max_price, dietary } = req.query;
    
    let query = `
      SELECT r.*, u.full_name as homecook_name 
      FROM homecook_recipes r
      JOIN users u ON r.user_id = u.id
      WHERE r.is_available = true
    `;
    const params = [];
    let paramCount = 1;

    if (cuisine) {
      query += ` AND r.cuisine_type = $${paramCount}`;
      params.push(cuisine);
      paramCount++;
    }

    if (min_price) {
      query += ` AND r.price >= $${paramCount}`;
      params.push(min_price);
      paramCount++;
    }

    if (max_price) {
      query += ` AND r.price <= $${paramCount}`;
      params.push(max_price);
      paramCount++;
    }

    if (dietary) {
      if (dietary === 'vegan') query += ' AND r.is_vegan = true';
      if (dietary === 'vegetarian') query += ' AND r.is_vegetarian = true';
      if (dietary === 'gluten_free') query += ' AND r.is_gluten_free = true';
      if (dietary === 'dairy_free') query += ' AND r.is_dairy_free = true';
    }

    query += ' ORDER BY r.created_at DESC';

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: {
        recipes: result.rows
      }
    });
  } catch (error) {
    console.error('Error getting recipes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get recipes',
      error: error.message
    });
  }
};

// Get single recipe by ID
exports.getRecipeById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT r.*, u.full_name as homecook_name, u.email as homecook_email
       FROM homecook_recipes r
       JOIN users u ON r.user_id = u.id
       WHERE r.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Recipe not found'
      });
    }

    res.json({
      success: true,
      data: {
        recipe: result.rows[0]
      }
    });
  } catch (error) {
    console.error('Error getting recipe:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get recipe',
      error: error.message
    });
  }
};

// Get my recipes (homecook only)
exports.getMyRecipes = async (req, res) => {
  try {
    console.log('📥 Get my recipes - User ID:', req.user.id);
    
    const result = await pool.query(
      `SELECT * FROM homecook_recipes 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [req.user.id]
    );

    console.log('✅ Found recipes:', result.rows.length);

    res.json({
      success: true,
      data: {
        recipes: result.rows
      }
    });
  } catch (error) {
    console.error('❌ Error getting my recipes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get recipes',
      error: error.message
    });
  }
};

// Update recipe (owner only)
exports.updateRecipe = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      recipe_name,
      description,
      cuisine_type,
      price,
      prep_time_minutes,
      servings,
      ingredients,
      instructions,
      is_vegan,
      is_vegetarian,
      is_gluten_free,
      is_dairy_free
    } = req.body;

    // Check ownership
    const ownerCheck = await pool.query(
      'SELECT user_id FROM homecook_recipes WHERE id = $1',
      [id]
    );

    if (ownerCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Recipe not found'
      });
    }

    if (ownerCheck.rows[0].user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this recipe'
      });
    }

    // Update recipe
    const result = await pool.query(
      `UPDATE homecook_recipes SET
        recipe_name = $1,
        description = $2,
        cuisine_type = $3,
        price = $4,
        prep_time_minutes = $5,
        servings = $6,
        ingredients = $7,
        instructions = $8,
        is_vegan = $9,
        is_vegetarian = $10,
        is_gluten_free = $11,
        is_dairy_free = $12,
        updated_at = NOW()
       WHERE id = $13
       RETURNING *`,
      [
        recipe_name,
        description,
        cuisine_type,
        price,
        prep_time_minutes,
        servings,
        Array.isArray(ingredients) ? ingredients : [],
        Array.isArray(instructions) ? instructions : [],
        is_vegan || false,
        is_vegetarian || false,
        is_gluten_free || false,
        is_dairy_free || false,
        id
      ]
    );

    res.json({
      success: true,
      message: 'Recipe updated successfully',
      data: {
        recipe: result.rows[0]
      }
    });
  } catch (error) {
    console.error('Error updating recipe:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update recipe',
      error: error.message
    });
  }
};

// Delete recipe (owner only)
exports.deleteRecipe = async (req, res) => {
  try {
    const { id } = req.params;

    // Check ownership
    const ownerCheck = await pool.query(
      'SELECT user_id FROM homecook_recipes WHERE id = $1',
      [id]
    );

    if (ownerCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Recipe not found'
      });
    }

    if (ownerCheck.rows[0].user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this recipe'
      });
    }

    await pool.query('DELETE FROM homecook_recipes WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Recipe deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting recipe:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete recipe',
      error: error.message
    });
  }
};

// Toggle recipe availability (owner only)
exports.toggleAvailability = async (req, res) => {
  try {
    const { id } = req.params;

    // Check ownership
    const ownerCheck = await pool.query(
      'SELECT user_id, is_available FROM homecook_recipes WHERE id = $1',
      [id]
    );

    if (ownerCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Recipe not found'
      });
    }

    if (ownerCheck.rows[0].user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this recipe'
      });
    }

    // Toggle availability
    const newAvailability = !ownerCheck.rows[0].is_available;
    
    const result = await pool.query(
      'UPDATE homecook_recipes SET is_available = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [newAvailability, id]
    );

    res.json({
      success: true,
      message: `Recipe ${newAvailability ? 'shown' : 'hidden'} successfully`,
      data: {
        recipe: result.rows[0]
      }
    });
  } catch (error) {
    console.error('Error toggling availability:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle availability',
      error: error.message
    });
  }
};