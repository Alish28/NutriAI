// backend/src/controllers/homecookController.js
// COMPLETE WORKING VERSION - Copy this ENTIRE file

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
    
    // Check if already applied
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
    
    // Update user status
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

// Toggle homecook mode (only if approved)
exports.toggleHomecookMode = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Check if approved
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
    
    // Toggle role between consumer and homecook
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

// Get homecook profile (for marketplace display)
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
      LEFT JOIN homecook_recipes hr ON u.id = hr.homecook_id
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
    
    // Verify user is homecook
    const checkQuery = 'SELECT role FROM users WHERE id = $1';
    const user = await db.query(checkQuery, [userId]);
    
    if (user.rows[0].role !== 'homecook') {
      return res.status(403).json({
        success: false,
        message: 'Only homecooks can access this endpoint'
      });
    }
    
    const query = 'SELECT * FROM homecook_recipes WHERE homecook_id = $1 ORDER BY created_at DESC';
    const result = await db.query(query, [userId]);
    
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

// Add new recipe to marketplace
exports.addRecipe = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Verify user is homecook
    const checkQuery = 'SELECT role FROM users WHERE id = $1';
    const user = await db.query(checkQuery, [userId]);
    
    if (user.rows[0].role !== 'homecook') {
      return res.status(403).json({
        success: false,
        message: 'Only homecooks can add recipes'
      });
    }
    
    const {
      recipe_name,
      description,
      cuisine_type,
      price_npr,
      preparation_time_minutes,
      servings,
      calories,
      protein,
      carbs,
      fats,
      is_vegetarian,
      is_vegan,
      is_gluten_free,
      ingredients,
      instructions,
      image_url,
      max_orders_per_day
    } = req.body;
    
    if (!recipe_name || !price_npr) {
      return res.status(400).json({
        success: false,
        message: 'Recipe name and price are required'
      });
    }
    
    const query = `
      INSERT INTO homecook_recipes (
        homecook_id, recipe_name, description, cuisine_type, price_npr,
        preparation_time_minutes, servings, calories, protein, carbs, fats,
        is_vegetarian, is_vegan, is_gluten_free,
        ingredients, instructions, image_url, max_orders_per_day
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *
    `;
    
    const values = [
      userId, recipe_name, description, cuisine_type, price_npr,
      preparation_time_minutes, servings, calories, protein, carbs, fats,
      is_vegetarian || false, is_vegan || false, is_gluten_free || false,
      ingredients || [], instructions || [], image_url, max_orders_per_day || 10
    ];
    
    const result = await db.query(query, values);
    
    res.status(201).json({
      success: true,
      message: 'Recipe added to marketplace successfully',
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
    const updates = req.body;
    
    // Build dynamic update query
    const fields = Object.keys(updates);
    if (fields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }
    
    const setClause = fields.map((field, i) => `${field} = $${i + 3}`).join(', ');
    const values = Object.values(updates);
    
    const query = `
      UPDATE homecook_recipes 
      SET ${setClause}, updated_at = NOW()
      WHERE id = $1 AND homecook_id = $2
      RETURNING *
    `;
    
    const result = await db.query(query, [recipeId, userId, ...values]);
    
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
    
    const query = 'DELETE FROM homecook_recipes WHERE id = $1 AND homecook_id = $2 RETURNING id';
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

module.exports = exports;