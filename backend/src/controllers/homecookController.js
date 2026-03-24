const db = require('../config/database');

// Apply to become homecook
exports.applyHomecook = async (req, res) => {
  try {
    const userId = req.user.id;
    const { application_text, specialties, experience_years, sample_dishes, certifications } = req.body;
    
    if (!application_text) {
      return res.status(400).json({
        success: false,
        message: 'Application text is required'
      });
    }
    
    const check = await db.query('SELECT id, status FROM homecook_applications WHERE user_id = $1', [userId]);
    
    if (check.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: `You have already applied. Status: ${check.rows[0].status}`
      });
    }
    
    const query = `
      INSERT INTO homecook_applications (user_id, application_text, specialties, experience_years, sample_dishes, certifications)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    
    const result = await db.query(query, [
      userId, 
      application_text, 
      specialties || [], 
      experience_years || 0, 
      sample_dishes || [],
      certifications || null
    ]);
    
    await db.query('UPDATE users SET homecook_status = $1 WHERE id = $2', ['pending', userId]);
    
    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      data: { application: result.rows[0] }
    });
  } catch (error) {
    console.error('Apply homecook error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit application',
      error: error.message
    });
  }
};

// Get application status
exports.getApplicationStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const query = `
      SELECT ha.*, u.full_name as reviewer_name
      FROM homecook_applications ha
      LEFT JOIN users u ON ha.reviewed_by = u.id
      WHERE ha.user_id = $1
    `;
    
    const result = await db.query(query, [userId]);
    
    res.json({
      success: true,
      data: { application: result.rows[0] || null }
    });
  } catch (error) {
    console.error('Get application error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get application status',
      error: error.message
    });
  }
};

// Toggle homecook mode
exports.toggleHomecookMode = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const userQuery = 'SELECT role, homecook_approved, homecook_status FROM users WHERE id = $1';
    const user = await db.query(userQuery, [userId]);
    
    if (!user.rows[0]) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    if (!user.rows[0].homecook_approved) {
      return res.status(403).json({
        success: false,
        message: 'You are not an approved homecook',
        current_status: user.rows[0].homecook_status
      });
    }
    
    const currentRole = user.rows[0].role;
    const newRole = currentRole === 'homecook' ? 'consumer' : 'homecook';
    
    await db.query('UPDATE users SET role = $1 WHERE id = $2', [newRole, userId]);
    
    res.json({
      success: true,
      message: `Switched to ${newRole} mode`,
      data: { 
        previous_role: currentRole,
        new_role: newRole 
      }
    });
  } catch (error) {
    console.error('Toggle mode error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle homecook mode',
      error: error.message
    });
  }
};

// Get homecook profile
exports.getHomecookProfile = async (req, res) => {
  try {
    const homecookId = req.params.id;
    
    const query = `
      SELECT 
        u.id,
        u.full_name,
        u.created_at as member_since,
        ha.specialties,
        ha.experience_years,
        COUNT(hr.id) as total_recipes,
        AVG(hr.average_rating) as average_rating
      FROM users u
      LEFT JOIN homecook_applications ha ON u.id = ha.user_id
      LEFT JOIN homecook_recipes hr ON u.id = hr.user_id
      WHERE u.id = $1 AND u.homecook_approved = true
      GROUP BY u.id, u.full_name, u.created_at, ha.specialties, ha.experience_years
    `;
    
    const result = await db.query(query, [homecookId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Homecook not found'
      });
    }
    
    res.json({
      success: true,
      data: { homecook: result.rows[0] }
    });
  } catch (error) {
    console.error('Get homecook profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get homecook profile',
      error: error.message
    });
  }
};

// Get homecook's own recipes
exports.getMyRecipes = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('📥 Get my recipes - User ID:', userId);

    const query = 'SELECT * FROM homecook_recipes WHERE user_id = $1 ORDER BY created_at DESC';
    const result = await db.query(query, [userId]);

    console.log(`✅ Found ${result.rows.length} recipes`);
    
    res.json({
      success: true,
      data: { recipes: result.rows }
    });
  } catch (error) {
    console.error('Get recipes error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get recipes',
      error: error.message
    });
  }
};

// Add new recipe
exports.addRecipe = async (req, res) => {
  try {
    const userId = req.user.id;
    
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
    
    if (!recipe_name || !description || !price) {
      return res.status(400).json({
        success: false,
        message: 'Recipe name, description, and price are required'
      });
    }
    
    const query = `
      INSERT INTO homecook_recipes (
        user_id, recipe_name, description, cuisine_type, price,
        prep_time_minutes, servings, ingredients, instructions,
        is_vegan, is_vegetarian, is_gluten_free, is_dairy_free
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;
    
    const values = [
      userId,
      recipe_name,
      description,
      cuisine_type || 'Nepali',
      parseFloat(price),
      parseInt(prep_time_minutes) || 30,
      parseInt(servings) || 2,
      ingredients || [],
      instructions || [],
      is_vegan || false,
      is_vegetarian || false,
      is_gluten_free || false,
      is_dairy_free || false
    ];
    
    const result = await db.query(query, values);
    
    res.status(201).json({
      success: true,
      message: 'Recipe added successfully',
      data: { recipe: result.rows[0] }
    });
  } catch (error) {
    console.error('Add recipe error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add recipe',
      error: error.message
    });
  }
};

// Update recipe
exports.updateRecipe = async (req, res) => {
  try {
    const userId = req.user.id;
    const recipeId = req.params.id;
    
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
    
    const query = `
      UPDATE homecook_recipes 
      SET 
        recipe_name = COALESCE($3, recipe_name),
        description = COALESCE($4, description),
        cuisine_type = COALESCE($5, cuisine_type),
        price = COALESCE($6, price),
        prep_time_minutes = COALESCE($7, prep_time_minutes),
        servings = COALESCE($8, servings),
        ingredients = COALESCE($9, ingredients),
        instructions = COALESCE($10, instructions),
        is_vegan = COALESCE($11, is_vegan),
        is_vegetarian = COALESCE($12, is_vegetarian),
        is_gluten_free = COALESCE($13, is_gluten_free),
        is_dairy_free = COALESCE($14, is_dairy_free),
        updated_at = NOW()
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `;
    
    const result = await db.query(query, [
      recipeId, userId,
      recipe_name, description, cuisine_type,
      price ? parseFloat(price) : null,
      prep_time_minutes ? parseInt(prep_time_minutes) : null,
      servings ? parseInt(servings) : null,
      ingredients, instructions,
      is_vegan, is_vegetarian, is_gluten_free, is_dairy_free
    ]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Recipe not found or you don\'t have permission'
      });
    }
    
    res.json({
      success: true,
      message: 'Recipe updated successfully',
      data: { recipe: result.rows[0] }
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

// Delete recipe
exports.deleteRecipe = async (req, res) => {
  try {
    const userId = req.user.id;
    const recipeId = req.params.id;
    
    const query = 'DELETE FROM homecook_recipes WHERE id = $1 AND user_id = $2 RETURNING id';
    const result = await db.query(query, [recipeId, userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Recipe not found or you don\'t have permission'
      });
    }
    
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
    const recipeId = req.params.id;
    
    const query = `
      UPDATE homecook_recipes 
      SET is_available = NOT is_available, updated_at = NOW()
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `;
    
    const result = await db.query(query, [recipeId, userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Recipe not found or you don\'t have permission'
      });
    }
    
    res.json({
      success: true,
      message: `Recipe is now ${result.rows[0].is_available ? 'available' : 'hidden'}`,
      data: { recipe: result.rows[0] }
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

module.exports = exports;