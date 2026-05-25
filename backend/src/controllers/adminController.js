const db = require('../config/database');

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

exports.getPendingApplications = async (req, res) => {
  try {
    const query = `
      SELECT 
        ha.*,
        u.full_name,
        u.email,
        u.phone_number,
        u.phone_verified,
        u.phone_verified_at,
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

exports.getAllApplications = async (req, res) => {
  try {
    const { status } = req.query;

    let query = `
      SELECT 
        ha.*,
        u.full_name,
        u.email,
        u.phone_number,
        u.phone_verified,
        u.phone_verified_at,
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

    query += `
      ORDER BY 
        CASE ha.status 
          WHEN 'pending' THEN 1
          WHEN 'approved' THEN 2
          WHEN 'rejected' THEN 3
          ELSE 4
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

exports.approveApplication = async (req, res) => {
  try {
    const adminId = req.user.id;
    const applicationId = req.params.id;

    await db.query('BEGIN');

    const appQuery = `
      SELECT user_id
      FROM homecook_applications
      WHERE id = $1
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

    const updateUserQuery = `
      UPDATE users
      SET 
        homecook_status = 'approved',
        homecook_approved = true,
        role = 'homecook',
        phone_verified = true,
        phone_verified_at = NOW(),
        phone_verified_by = $2,
        updated_at = NOW()
      WHERE id = $1
    `;

    await db.query(updateUserQuery, [userId, adminId]);

    const logQuery = `
      INSERT INTO admin_logs (admin_id, action, target_type, target_id, details)
      VALUES ($1, 'approved_homecook', 'homecook_application', $2, $3)
    `;

    await db.query(logQuery, [
      adminId,
      applicationId,
      JSON.stringify({ user_id: userId })
    ]);

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

    await db.query('BEGIN');

    const appQuery = `
      SELECT user_id
      FROM homecook_applications
      WHERE id = $1
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

    const updateUserQuery = `
      UPDATE users
      SET
        homecook_status = 'rejected',
        updated_at = NOW()
      WHERE id = $1
    `;

    await db.query(updateUserQuery, [userId]);

    const logQuery = `
      INSERT INTO admin_logs (admin_id, action, target_type, target_id, details)
      VALUES ($1, 'rejected_homecook', 'homecook_application', $2, $3)
    `;

    await db.query(logQuery, [
      adminId,
      applicationId,
      JSON.stringify({ user_id: userId, reason: rejection_reason })
    ]);

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

exports.getAllUsers = async (req, res) => {
  try {
    const { role, search } = req.query;

    let query = `
      SELECT 
        id,
        email,
        full_name,
        role,
        phone_number,
        phone_verified,
        homecook_status,
        homecook_approved,
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

exports.getAdminStats = async (req, res) => {
  try {
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
    const recipeStatsQuery = `
      SELECT 
        COUNT(*) as total_recipes,
        COUNT(*) FILTER (WHERE is_available = true) as available_recipes
      FROM homecook_recipes
    `;

    const [userStats, mealStats, pantryStats, recipeStats] = await Promise.all([
      db.query(userStatsQuery),
      db.query(mealStatsQuery),
      db.query(pantryStatsQuery),
      db.query(recipeStatsQuery)
    ]);

    const stats = {
      ...userStats.rows[0],
      ...mealStats.rows[0],
      ...pantryStats.rows[0],
      ...recipeStats.rows[0],
      total_homecooks: userStats.rows[0].homecooks
    };

    res.json({
      success: true,
      data: { stats }
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