const pool = require('../config/database');

class User {
  static async create(userData) {
    const { email, password_hash, full_name, role } = userData;
    const query = `
      INSERT INTO users (email, password_hash, full_name, role)
      VALUES ($1, $2, $3, $4)
      RETURNING id, email, full_name, role, created_at
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
    const query = 'SELECT id, email, full_name, role, created_at FROM users WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async update(id, userData) {
    const { full_name, email } = userData;
    const query = `
      UPDATE users 
      SET full_name = $1, email = $2, updated_at = NOW()
      WHERE id = $3
      RETURNING id, email, full_name, role, updated_at
    `;
    const result = await pool.query(query, [full_name, email, id]);
    return result.rows[0];
  }

  static async delete(id) {
    const query = 'DELETE FROM users WHERE id = $1 RETURNING id';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
}

module.exports = User;