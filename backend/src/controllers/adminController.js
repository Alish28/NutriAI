// backend/src/controllers/adminController.js

const db = require('../config/database');

// ============================================
// ADMIN MIDDLEWARE CHECK
// ============================================

// Check if user is admin (use this in routes)
exports.requireAdmin = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    const query = `SELECT role FROM users WHERE id = $1`;
    const result = await db.query(query, [userId]);
    
    if (!result.rows[0] || result.rows[0].role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }
    
    next();
  } catch (error) {
    console.error('Admin check error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify admin status'
    });
  }
};

// ============================================
// APPLICATION MANAGEMENT
// ============================================

// Get all pending applications
exports.getPendingApplications = async (req, res) => {
  try {
    const query = `
      SELECT 
        ha.*,
        u.full_name,
        u.email,
        u.created_at as user_joined_date
      FROM homecook_applications ha
      JOIN users u ON ha.user_id = u.id
      WHERE ha.status = 'pending'
      ORDER BY ha.applied_at ASC
    `;
    
    const result = await db.query(query);
    
    res.json({
      success: true,
      data: { 
        applications: result.rows,
        count: result.rows.length
      }
    });
  } catch (error) {
    console.error('Error fetching pending applications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending applications'
    });
  }
};

// Get all applications (pending, approved, rejected)
exports.getAllApplications = async (req, res) => {
  try {
    const { status } = req.query; // Optional filter by status
    
    let query = `
      SELECT 
        ha.*,
        u.full_name,
        u.email,
        reviewer.full_name as reviewer_name
      FROM homecook_applications ha
      JOIN users u ON ha.user_id = u.id
      LEFT JOIN users reviewer ON ha.reviewed_by = reviewer.id
    `;
    
    const params = [];
    if (status) {
      query += ` WHERE ha.status = $1`;
      params.push(status);
    }
    
    query += ` ORDER BY 
      CASE ha.status 
        WHEN 'pending' THEN 1
        WHEN 'approved' THEN 2
        WHEN 'rejected' THEN 3
      END,
      ha.applied_at DESC
    `;
    
    const result = await db.query(query, params);
    
    res.json({
      success: true,
      data: { 
        applications: result.rows,
        count: result.rows.length
      }
    });
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch applications'
    });
  }
};

// Approve application
exports.approveApplication = async (req, res) => {
  try {
    const adminId = req.user.id;
    const applicationId = req.params.id;
    
    // Start transaction
    await db.query('BEGIN');
    
    // Get application details
    const appQuery = `
      SELECT user_id FROM homecook_applications WHERE id = $1
    `;
    const app = await db.query(appQuery, [applicationId]);
    
    if (app.rows.length === 0) {
      await db.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }
    
    const userId = app.rows[0].user_id;
    
    // Update application status
    const updateAppQuery = `
      UPDATE homecook_applications
      SET 
        status = 'approved',
        reviewed_at = NOW(),
        reviewed_by = $1
      WHERE id = $2
      RETURNING *
    `;
    
    await db.query(updateAppQuery, [adminId, applicationId]);
    
    // Update user status
    const updateUserQuery = `
      UPDATE users
      SET 
        homecook_status = 'approved',
        homecook_approved = true,
        role = 'homecook'
      WHERE id = $1
    `;
    
    await db.query(updateUserQuery, [userId]);
    
    // Log admin action
    const logQuery = `
      INSERT INTO admin_logs (admin_id, action, target_type, target_id, details)
      VALUES ($1, 'approved_homecook', 'homecook_application', $2, $3)
    `;
    
    await db.query(logQuery, [
      adminId, 
      applicationId,
      JSON.stringify({ user_id: userId })
    ]);
    
    // Commit transaction
    await db.query('COMMIT');
    
    res.json({
      success: true,
      message: 'Application approved successfully'
    });
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Error approving application:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve application'
    });
  }
};

// Reject application
exports.rejectApplication = async (req, res) => {
  try {
    const adminId = req.user.id;
    const applicationId = req.params.id;
    const { rejection_reason } = req.body;
    
    if (!rejection_reason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }
    
    // Start transaction
    await db.query('BEGIN');
    
    // Get application details
    const appQuery = `
      SELECT user_id FROM homecook_applications WHERE id = $1
    `;
    const app = await db.query(appQuery, [applicationId]);
    
    if (app.rows.length === 0) {
      await db.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }
    
    const userId = app.rows[0].user_id;
    
    // Update application status
    const updateAppQuery = `
      UPDATE homecook_applications
      SET 
        status = 'rejected',
        reviewed_at = NOW(),
        reviewed_by = $1,
        rejection_reason = $2
      WHERE id = $3
      RETURNING *
    `;
    
    await db.query(updateAppQuery, [adminId, rejection_reason, applicationId]);
    
    // Update user status
    const updateUserQuery = `
      UPDATE users
      SET homecook_status = 'rejected'
      WHERE id = $1
    `;
    
    await db.query(updateUserQuery, [userId]);
    
    // Log admin action
    const logQuery = `
      INSERT INTO admin_logs (admin_id, action, target_type, target_id, details)
      VALUES ($1, 'rejected_homecook', 'homecook_application', $2, $3)
    `;
    
    await db.query(logQuery, [
      adminId, 
      applicationId,
      JSON.stringify({ user_id: userId, reason: rejection_reason })
    ]);
    
    // Commit transaction
    await db.query('COMMIT');
    
    res.json({
      success: true,
      message: 'Application rejected'
    });
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Error rejecting application:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject application'
    });
  }
};

// ============================================
// USER MANAGEMENT
// ============================================

// Get all users with filters
exports.getAllUsers = async (req, res) => {
  try {
    const { role, search } = req.query;
    
    let query = `
      SELECT 
        id, email, full_name, role, 
        homecook_status, homecook_approved,
        created_at
      FROM users
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 1;
    
    if (role) {
      query += ` AND role = $${paramCount}`;
      params.push(role);
      paramCount++;
    }
    
    if (search) {
      query += ` AND (full_name ILIKE $${paramCount} OR email ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }
    
    query += ` ORDER BY created_at DESC`;
    
    const result = await db.query(query, params);
    
    res.json({
      success: true,
      data: { 
        users: result.rows,
        count: result.rows.length
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users'
    });
  }
};

// Get admin statistics
exports.getAdminStats = async (req, res) => {
  try {
    const statsQuery = `
      SELECT 
        COUNT(*) as total_users,
        COUNT(*) FILTER (WHERE role = 'consumer') as consumers,
        COUNT(*) FILTER (WHERE role = 'homecook') as homecooks,
        COUNT(*) FILTER (WHERE homecook_status = 'pending') as pending_applications,
        COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as new_users_week,
        COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as new_users_month
      FROM users;
      
      SELECT COUNT(*) as total_meals FROM meals;
      
      SELECT COUNT(*) as total_pantry_items FROM pantry_items;
      
      SELECT 
        COUNT(*) as total_recipes,
        COUNT(*) FILTER (WHERE available = true) as available_recipes
      FROM homecook_recipes;
    `;
    
    // Execute multiple queries
    const userStatsQuery = `
      SELECT 
        COUNT(*) as total_users,
        COUNT(*) FILTER (WHERE role = 'consumer') as consumers,
        COUNT(*) FILTER (WHERE role = 'homecook') as homecooks,
        COUNT(*) FILTER (WHERE homecook_status = 'pending') as pending_applications,
        COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as new_users_week
      FROM users
    `;
    
    const mealStatsQuery = `SELECT COUNT(*) as total_meals FROM meals`;
    const pantryStatsQuery = `SELECT COUNT(*) as total_pantry_items FROM pantry_items`;
    
    const [userStats, mealStats, pantryStats] = await Promise.all([
      db.query(userStatsQuery),
      db.query(mealStatsQuery),
      db.query(pantryStatsQuery)
    ]);
    
    res.json({
      success: true,
      data: {
        users: userStats.rows[0],
        meals: mealStats.rows[0],
        pantry: pantryStats.rows[0]
      }
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics'
    });
  }
};

module.exports = exports;