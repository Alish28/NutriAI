const pool = require('../config/database');

// Create a new recipe (homecooks only)
exports.createRecipe = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Check if user is an approved homecook
    const userCheck = await pool.query(
      'SELECT role, homecook_approved FROM users WHERE id = $1',
      [userId]
    );
    
    if (!userCheck.rows[0] || !userCheck.rows[0].homecook_approved) {
      return res.status(403).json({
        success: false,
        message: 'Only approved homecooks can create recipes'
      });
    }
    
    const {
      recipe_name,
      description,
      cuisine_type,
      price,
      prep_time_minutes,
      servings,
      ingredients, // array
      instructions, // array
      is_vegan,
      is_vegetarian,
      is_gluten_free,
      is_dairy_free
    } = req.body;
    
    // Validation
    if (!recipe_name || !description || !price) {
      return res.status(400).json({
        success: false,
        message: 'Recipe name, description, and price are required'
      });
    }
    
    const result = await pool.query(
      `INSERT INTO homecook_recipes (
        homecook_id, recipe_name, description, cuisine_type, 
        price, prep_time_minutes, servings, ingredients, instructions,
        is_vegan, is_vegetarian, is_gluten_free, is_dairy_free
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        userId,
        recipe_name,
        description,
        cuisine_type || 'Other',
        parseFloat(price),
        parseInt(prep_time_minutes) || 30,
        parseInt(servings) || 2,
        JSON.stringify(ingredients || []),
        JSON.stringify(instructions || []),
        is_vegan || false,
        is_vegetarian || false,
        is_gluten_free || false,
        is_dairy_free || false
      ]
    );
    
    res.status(201).json({
      success: true,
      message: 'Recipe created successfully',
      recipe: result.rows[0]
    });
    
  } catch (error) {
    console.error('Create recipe error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create recipe',
      error: error.message
    });
  }
};

// Get all recipes (marketplace - public)
exports.getAllRecipes = async (req, res) => {
  try {
    const { cuisine, min_price, max_price, dietary } = req.query;
    
    let query = `
      SELECT 
        r.*,
        u.full_name as homecook_name,
        u.email as homecook_email
      FROM homecook_recipes r
      JOIN users u ON r.homecook_id = u.id
      WHERE r.is_available = true
    `;
    
    const params = [];
    let paramCount = 0;
    
    // Filter by cuisine
    if (cuisine && cuisine !== 'all') {
      paramCount++;
      query += ` AND r.cuisine_type = $${paramCount}`;
      params.push(cuisine);
    }
    
    // Filter by price range
    if (min_price) {
      paramCount++;
      query += ` AND r.price >= $${paramCount}`;
      params.push(parseFloat(min_price));
    }
    
    if (max_price) {
      paramCount++;
      query += ` AND r.price <= $${paramCount}`;
      params.push(parseFloat(max_price));
    }
    
    // Filter by dietary preferences
    if (dietary === 'vegan') {
      query += ` AND r.is_vegan = true`;
    } else if (dietary === 'vegetarian') {
      query += ` AND r.is_vegetarian = true`;
    } else if (dietary === 'gluten_free') {
      query += ` AND r.is_gluten_free = true`;
    } else if (dietary === 'dairy_free') {
      query += ` AND r.is_dairy_free = true`;
    }
    
    query += ` ORDER BY r.created_at DESC`;
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      count: result.rows.length,
      recipes: result.rows
    });
    
  } catch (error) {
    console.error('Get recipes error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recipes',
      error: error.message
    });
  }
};

// Get recipes by homecook (their own recipes)
exports.getMyRecipes = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await pool.query(
      `SELECT * FROM homecook_recipes 
       WHERE homecook_id = $1 
       ORDER BY created_at DESC`,
      [userId]
    );
    
    res.json({
      success: true,
      count: result.rows.length,
      recipes: result.rows
    });
    
  } catch (error) {
    console.error('Get my recipes error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch your recipes',
      error: error.message
    });
  }
};

// Get single recipe by ID
exports.getRecipeById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `SELECT 
        r.*,
        u.full_name as homecook_name,
        u.email as homecook_email
      FROM homecook_recipes r
      JOIN users u ON r.homecook_id = u.id
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
      recipe: result.rows[0]
    });
    
  } catch (error) {
    console.error('Get recipe error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recipe',
      error: error.message
    });
  }
};

// Update recipe (homecook can only update their own)
exports.updateRecipe = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    
    // Check ownership
    const ownerCheck = await pool.query(
      'SELECT homecook_id FROM homecook_recipes WHERE id = $1',
      [id]
    );
    
    if (ownerCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Recipe not found'
      });
    }
    
    if (ownerCheck.rows[0].homecook_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own recipes'
      });
    }
    
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
      is_dairy_free,
      is_available
    } = req.body;
    
    const result = await pool.query(
      `UPDATE homecook_recipes SET
        recipe_name = COALESCE($1, recipe_name),
        description = COALESCE($2, description),
        cuisine_type = COALESCE($3, cuisine_type),
        price = COALESCE($4, price),
        prep_time_minutes = COALESCE($5, prep_time_minutes),
        servings = COALESCE($6, servings),
        ingredients = COALESCE($7, ingredients),
        instructions = COALESCE($8, instructions),
        is_vegan = COALESCE($9, is_vegan),
        is_vegetarian = COALESCE($10, is_vegetarian),
        is_gluten_free = COALESCE($11, is_gluten_free),
        is_dairy_free = COALESCE($12, is_dairy_free),
        is_available = COALESCE($13, is_available),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $14
      RETURNING *`,
      [
        recipe_name,
        description,
        cuisine_type,
        price ? parseFloat(price) : null,
        prep_time_minutes ? parseInt(prep_time_minutes) : null,
        servings ? parseInt(servings) : null,
        ingredients ? JSON.stringify(ingredients) : null,
        instructions ? JSON.stringify(instructions) : null,
        is_vegan,
        is_vegetarian,
        is_gluten_free,
        is_dairy_free,
        is_available,
        id
      ]
    );
    
    res.json({
      success: true,
      message: 'Recipe updated successfully',
      recipe: result.rows[0]
    });
    
  } catch (error) {
    console.error('Update recipe error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update recipe',
      error: error.message
    });
  }
};

// Delete recipe (homecook can only delete their own)
exports.deleteRecipe = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    
    // Check ownership
    const ownerCheck = await pool.query(
      'SELECT homecook_id FROM homecook_recipes WHERE id = $1',
      [id]
    );
    
    if (ownerCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Recipe not found'
      });
    }
    
    if (ownerCheck.rows[0].homecook_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own recipes'
      });
    }
    
    await pool.query('DELETE FROM homecook_recipes WHERE id = $1', [id]);
    
    res.json({
      success: true,
      message: 'Recipe deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete recipe error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete recipe',
      error: error.message
    });
  }
};

// Toggle recipe availability
exports.toggleAvailability = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    
    // Check ownership
    const ownerCheck = await pool.query(
      'SELECT homecook_id, is_available FROM homecook_recipes WHERE id = $1',
      [id]
    );
    
    if (ownerCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Recipe not found'
      });
    }
    
    if (ownerCheck.rows[0].homecook_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only modify your own recipes'
      });
    }
    
    const newStatus = !ownerCheck.rows[0].is_available;
    
    const result = await pool.query(
      `UPDATE homecook_recipes 
       SET is_available = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 
       RETURNING *`,
      [newStatus, id]
    );
    
    res.json({
      success: true,
      message: `Recipe ${newStatus ? 'enabled' : 'disabled'} successfully`,
      recipe: result.rows[0]
    });
    
  } catch (error) {
    console.error('Toggle availability error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle availability',
      error: error.message
    });
  }
};