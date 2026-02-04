const pool = require('../config/database');

class User {
  static async create(userData) {
    const { email, password_hash, full_name, role } = userData;
    const query = `
      INSERT INTO users (email, password_hash, full_name, role, onboarding_completed)
      VALUES ($1, $2, $3, $4, false)
      RETURNING id, email, full_name, role, onboarding_completed, created_at
    `;
    const values = [email, password_hash, full_name, role || 'consumer'];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await pool.query(query, [email]);
    return result.rows[0];
  }

  static async findById(id) {
    const query = 'SELECT id, email, full_name, role, onboarding_completed, created_at FROM users WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // Get full profile with all fields
  static async getFullProfile(id) {
    const query = `
      SELECT 
        id, email, full_name, role, 
        age, gender, weight, height, activity_level,
        health_goals, dietary_preferences, allergies,
        preferred_cuisines, prioritize_local,
        daily_budget, weekly_budget, shopping_style,
        pantry_tracking, leftover_alerts, expiry_notifications,
        preferred_serving_size, marketplace_access,
        personalization_strength, nutrition_focus, ai_auto_adjust,
        email_notifications, sms_notifications, data_sharing,
        profile_image_url, onboarding_completed, created_at, updated_at
      FROM users 
      WHERE id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async update(id, userData) {
    const { full_name, email } = userData;
    const query = `
      UPDATE users 
      SET full_name = $1, email = $2, updated_at = NOW()
      WHERE id = $3
      RETURNING id, email, full_name, role, onboarding_completed, updated_at
    `;
    const result = await pool.query(query, [full_name, email, id]);
    return result.rows[0];
  }

  // Helper function to safely handle array fields
  static prepareArrayValue(value) {
    // If it's already an array, return it
    if (Array.isArray(value)) {
      return value.length > 0 ? value : null;
    }
    
    // If it's an empty string or null/undefined, return null
    if (value === '' || value === null || value === undefined) {
      return null;
    }
    
    // If it's a string, try to parse it or return null
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) && parsed.length > 0 ? parsed : null;
      } catch (e) {
        return null;
      }
    }
    
    return null;
  }

  // Update profile with dynamic fields
  static async updateProfile(id, profileData) {
    const allowedFields = [
      'full_name', 'age', 'gender', 'weight', 'height', 'activity_level',
      'health_goals', 'dietary_preferences', 'allergies',
      'preferred_cuisines', 'prioritize_local',
      'daily_budget', 'weekly_budget', 'shopping_style',
      'pantry_tracking', 'leftover_alerts', 'expiry_notifications',
      'preferred_serving_size', 'marketplace_access',
      'personalization_strength', 'nutrition_focus', 'ai_auto_adjust',
      'email_notifications', 'sms_notifications', 'data_sharing',
      'profile_image_url', 'onboarding_completed'
    ];

    const arrayFields = [
      'health_goals', 'dietary_preferences', 'allergies',
      'preferred_cuisines', 'nutrition_focus'
    ];

    const updates = [];
    const values = [];
    let paramCount = 1;

    Object.keys(profileData).forEach(key => {
      if (allowedFields.includes(key) && profileData[key] !== undefined) {
        // Special handling for array fields
        if (arrayFields.includes(key)) {
          const arrayValue = this.prepareArrayValue(profileData[key]);
          updates.push(`${key} = $${paramCount}`);
          values.push(arrayValue);
        } else {
          updates.push(`${key} = $${paramCount}`);
          values.push(profileData[key]);
        }
        paramCount++;
      }
    });

    if (updates.length === 0) {
      throw new Error('No valid fields to update');
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const query = `
      UPDATE users 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    
    // Remove password_hash from response
    const user = result.rows[0];
    if (user) {
      delete user.password_hash;
    }
    
    return user;
  }

  // Update password
  static async updatePassword(id, password_hash) {
    const query = `
      UPDATE users 
      SET password_hash = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING id
    `;
    const result = await pool.query(query, [password_hash, id]);
    return result.rows[0];
  }

  static async delete(id) {
    const query = 'DELETE FROM users WHERE id = $1 RETURNING id';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
}

module.exports = User;