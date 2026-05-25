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
    const query = `
      SELECT
        id,
        email,
        full_name,
        role,
        onboarding_completed,
        created_at
      FROM users
      WHERE id = $1
    `;

    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async getFullProfile(id) {
    const query = `
      SELECT 
        id,
        email,
        full_name,
        role,
        phone_number,
        phone_verified,
        phone_verified_at,
        phone_verified_by,
        phone_verification_notes,
        age,
        gender,
        weight,
        height,
        activity_level,
        health_goals,
        dietary_preferences,
        allergies,
        preferred_cuisines,
        daily_budget,
        weekly_budget,
        shopping_style,
        preferred_serving_size,
        personalization_strength,
        nutrition_focus,
        ai_auto_adjust,
        profile_image_url,
        onboarding_completed,
        homecook_status,
        homecook_approved,
        pickup_lat,
        pickup_lng,
        pickup_address,
        created_at,
        updated_at
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

  static prepareArrayValue(value) {
    if (Array.isArray(value)) {
      return value.length > 0 ? value : null;
    }

    if (value === '' || value === null || value === undefined) {
      return null;
    }

    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) && parsed.length > 0 ? parsed : null;
      } catch (e) {
        const splitValue = value
          .split(',')
          .map(item => item.trim())
          .filter(Boolean);

        return splitValue.length > 0 ? splitValue : null;
      }
    }

    return null;
  }

  static prepareNumberValue(value) {
    if (value === '' || value === null || value === undefined) {
      return null;
    }

    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  }

  static prepareIntegerValue(value) {
    if (value === '' || value === null || value === undefined) {
      return null;
    }

    const parsed = parseInt(value, 10);
    return Number.isNaN(parsed) ? null : parsed;
  }

  static prepareBooleanValue(value) {
    if (value === '' || value === null || value === undefined) {
      return null;
    }

    return Boolean(value);
  }

  static async updateProfile(id, profileData) {
    const allowedFields = [
      'full_name',
      'phone_number',
      'age',
      'gender',
      'weight',
      'height',
      'activity_level',
      'health_goals',
      'dietary_preferences',
      'allergies',
      'preferred_cuisines',
      'daily_budget',
      'weekly_budget',
      'shopping_style',
      'preferred_serving_size',
      'personalization_strength',
      'nutrition_focus',
      'ai_auto_adjust',
      'profile_image_url',
      'onboarding_completed',
      'pickup_lat',
      'pickup_lng',
      'pickup_address'
    ];

    const arrayFields = [
      'health_goals',
      'dietary_preferences',
      'allergies',
      'preferred_cuisines',
      'nutrition_focus'
    ];

    const numericFields = [
      'weight',
      'height',
      'daily_budget',
      'weekly_budget',
      'pickup_lat',
      'pickup_lng'
    ];

    const integerFields = [
      'age',
      'preferred_serving_size',
      'personalization_strength'
    ];

    const booleanFields = [
      'ai_auto_adjust',
      'onboarding_completed'
    ];

    const nullableStringFields = [
      'gender',
      'activity_level',
      'shopping_style',
      'profile_image_url',
      'pickup_address'
    ];

    const updates = [];
    const values = [];
    let paramCount = 1;

    Object.keys(profileData).forEach(key => {
      if (!allowedFields.includes(key) || profileData[key] === undefined) {
        return;
      }

      let value = profileData[key];

      if (arrayFields.includes(key)) {
        value = this.prepareArrayValue(value);
      } else if (numericFields.includes(key)) {
        value = this.prepareNumberValue(value);
      } else if (integerFields.includes(key)) {
        value = this.prepareIntegerValue(value);
      } else if (booleanFields.includes(key)) {
        value = this.prepareBooleanValue(value);
      } else if (nullableStringFields.includes(key)) {
        value = value === '' ? null : value;
      } else if (key === 'full_name' || key === 'phone_number') {
        value = typeof value === 'string' ? value.trim() : value;
      }

      updates.push(`${key} = $${paramCount}`);
      values.push(value);
      paramCount++;
    });

    if (updates.length === 0) {
      throw new Error('No valid fields to update');
    }

    updates.push('updated_at = NOW()');
    values.push(id);

    const query = `
      UPDATE users 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    const user = result.rows[0];

    if (user) {
      delete user.password_hash;
    }

    return user;
  }

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