const pool = require('../config/database');

// ==========================================
// CREATE RECIPE (Homecook only)
// ==========================================
exports.createRecipe = async (req, res) => {
  try {
    const userId = req.user.id;
    
    console.log('📥 Create recipe request:', req.body);
    console.log('👤 User ID:', userId);
    
    // Check if user is an approved homecook
    const userCheck = await pool.query(
      'SELECT role, homecook_approved FROM users WHERE id = $1',
      [userId]
    );
    
    if (!userCheck.rows[0] || userCheck.rows[0].homecook_approved !== true) {
      return res.status(403).json({
        success: false,
        message: 'Only approved homecooks can create recipes'
      });
    }
    
    const {
      recipe_name,
      description,
      cuisine_type = 'Other',
      price,
      prep_time_minutes = 30,
      servings = 2,
      ingredients = [],
      instructions = [],
      is_vegan = false,
      is_vegetarian = false,
      is_gluten_free = false,
      is_dairy_free = false,
      image_url = null
    } = req.body;
    
    // Validation
    if (!recipe_name || !description || !price) {
      return res.status(400).json({
        success: false,
        message: 'Recipe name, description, and price are required'
      });
    }
    
    // Insert recipe
    const result = await pool.query(
      `INSERT INTO homecook_recipes (
        user_id, recipe_name, description, cuisine_type, price,
        prep_time_minutes, servings, ingredients, instructions,
        is_vegan, is_vegetarian, is_gluten_free, is_dairy_free,
        is_available, image_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *`,
      [
        userId,
        recipe_name,
        description,
        cuisine_type,
        price,
        prep_time_minutes,
        servings,
        Array.isArray(ingredients) ? ingredients : [ingredients],
        Array.isArray(instructions) ? instructions : [instructions],
        is_vegan,
        is_vegetarian,
        is_gluten_free,
        is_dairy_free,
        true, // is_available - default to true
        image_url
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
      message: 'Server error while creating recipe',
      error: error.message
    });
  }
};

// ==========================================
// GET ALL AVAILABLE RECIPES (Public)
// ==========================================
exports.getAllRecipes = async (req, res) => {
  try {
    const { cuisine, min_price, max_price, dietary } = req.query;
    
    let query = `
      SELECT 
        r.*,
        u.full_name as homecook_name,
        u.email as homecook_email
      FROM homecook_recipes r
      JOIN users u ON r.user_id = u.id
      WHERE r.is_available = true
        AND u.homecook_approved = true
    `;
    
    const params = [];
    let paramCount = 1;
    
    // Apply filters
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
      const dietaryMap = {
        'vegan': 'is_vegan',
        'vegetarian': 'is_vegetarian',
        'gluten-free': 'is_gluten_free',
        'dairy-free': 'is_dairy_free'
      };
      
      if (dietaryMap[dietary]) {
        query += ` AND r.${dietaryMap[dietary]} = true`;
      }
    }
    
    query += ' ORDER BY r.created_at DESC';
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      data: {
        recipes: result.rows,
        count: result.rows.length
      }
    });
    
  } catch (error) {
    console.error('Error getting recipes:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while getting recipes',
      error: error.message
    });
  }
};

// ==========================================
// GET MY RECIPES (Homecook's own recipes)
// ==========================================
exports.getMyRecipes = async (req, res) => {
  try {
    const userId = req.user.id;
    
    console.log('📥 Get my recipes - User ID:', userId);
    
    const result = await pool.query(
      `SELECT * FROM homecook_recipes 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [userId]
    );
    
    console.log(`✅ Found ${result.rows.length} recipes`);
    
    res.json({
      success: true,
      data: {
        recipes: result.rows,
        count: result.rows.length
      }
    });
    
  } catch (error) {
    console.error('❌ Error getting recipes:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while getting recipes',
      error: error.message
    });
  }
};

// ==========================================
// GET SINGLE RECIPE BY ID (Public)
// ==========================================
exports.getRecipeById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `SELECT 
        r.*,
        u.full_name as homecook_name,
        u.email as homecook_email
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
      message: 'Server error while getting recipe',
      error: error.message
    });
  }
};

// ==========================================
// UPDATE RECIPE (Homecook - own recipes only)
// ==========================================
exports.updateRecipe = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Check ownership
    const ownerCheck = await pool.query(
      'SELECT * FROM homecook_recipes WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    
    if (ownerCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Recipe not found or unauthorized'
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
      image_url
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
        image_url = COALESCE($13, image_url),
        updated_at = NOW()
      WHERE id = $14 AND user_id = $15
      RETURNING *`,
      [
        recipe_name,
        description,
        cuisine_type,
        price,
        prep_time_minutes,
        servings,
        Array.isArray(ingredients) ? ingredients : null,
        Array.isArray(instructions) ? instructions : null,
        is_vegan,
        is_vegetarian,
        is_gluten_free,
        is_dairy_free,
        image_url,
        id,
        userId
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
      message: 'Server error while updating recipe',
      error: error.message
    });
  }
};

// ==========================================
// DELETE RECIPE (Homecook - own recipes only)
// ==========================================
exports.deleteRecipe = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const result = await pool.query(
      'DELETE FROM homecook_recipes WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Recipe not found or unauthorized'
      });
    }
    
    res.json({
      success: true,
      message: 'Recipe deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting recipe:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting recipe',
      error: error.message
    });
  }
};

// ==========================================
// TOGGLE RECIPE AVAILABILITY
// ==========================================
exports.toggleRecipeAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const result = await pool.query(
      `UPDATE homecook_recipes 
       SET is_available = NOT is_available, updated_at = NOW()
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [id, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Recipe not found or unauthorized'
      });
    }
    
    res.json({
      success: true,
      message: 'Recipe availability toggled',
      data: {
        recipe: result.rows[0]
      }
    });
    
  } catch (error) {
    console.error('Error toggling availability:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while toggling availability',
      error: error.message
    });
  }
};