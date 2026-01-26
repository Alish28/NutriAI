const pool = require('../config/database');

class Meal {
  // Create new meal
  static async create(mealData) {
    const {
      user_id,
      meal_date,
      meal_type,
      meal_name,
      description,
      calories,
      protein,
      carbs,
      fats
    } = mealData;

    const query = `
      INSERT INTO meals (
        user_id, meal_date, meal_type, meal_name, 
        description, calories, protein, carbs, fats
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const values = [
      user_id,
      meal_date,
      meal_type,
      meal_name,
      description || null,
      calories || 0,
      protein || 0,
      carbs || 0,
      fats || 0
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Get all meals for a user
  static async findByUserId(userId) {
    const query = `
      SELECT * FROM meals 
      WHERE user_id = $1 
      ORDER BY meal_date DESC, created_at DESC
    `;
    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  // Get meals for a specific date
  static async findByUserAndDate(userId, date) {
    const query = `
      SELECT * FROM meals 
      WHERE user_id = $1 AND meal_date = $2
      ORDER BY 
        CASE meal_type
          WHEN 'breakfast' THEN 1
          WHEN 'lunch' THEN 2
          WHEN 'snack' THEN 3
          WHEN 'dinner' THEN 4
        END
    `;
    const result = await pool.query(query, [userId, date]);
    return result.rows;
  }

  // Get meals for a date range (for weekly view)
  static async findByUserAndDateRange(userId, startDate, endDate) {
    const query = `
      SELECT * FROM meals 
      WHERE user_id = $1 
        AND meal_date >= $2 
        AND meal_date <= $3
      ORDER BY meal_date, 
        CASE meal_type
          WHEN 'breakfast' THEN 1
          WHEN 'lunch' THEN 2
          WHEN 'snack' THEN 3
          WHEN 'dinner' THEN 4
        END
    `;
    const result = await pool.query(query, [userId, startDate, endDate]);
    return result.rows;
  }

  // Get single meal by ID
  static async findById(mealId, userId) {
    const query = `
      SELECT * FROM meals 
      WHERE id = $1 AND user_id = $2
    `;
    const result = await pool.query(query, [mealId, userId]);
    return result.rows[0];
  }

  // Update meal
  static async update(mealId, userId, mealData) {
    const {
      meal_date,
      meal_type,
      meal_name,
      description,
      calories,
      protein,
      carbs,
      fats
    } = mealData;

    const query = `
      UPDATE meals 
      SET 
        meal_date = $1,
        meal_type = $2,
        meal_name = $3,
        description = $4,
        calories = $5,
        protein = $6,
        carbs = $7,
        fats = $8,
        updated_at = NOW()
      WHERE id = $9 AND user_id = $10
      RETURNING *
    `;

    const values = [
      meal_date,
      meal_type,
      meal_name,
      description,
      calories || 0,
      protein || 0,
      carbs || 0,
      fats || 0,
      mealId,
      userId
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Delete meal
  static async delete(mealId, userId) {
    const query = `
      DELETE FROM meals 
      WHERE id = $1 AND user_id = $2
      RETURNING id
    `;
    const result = await pool.query(query, [mealId, userId]);
    return result.rows[0];
  }

  // Get nutrition summary for a date
  static async getNutritionSummary(userId, date) {
    const query = `
      SELECT 
        meal_date,
        SUM(calories) as total_calories,
        SUM(protein) as total_protein,
        SUM(carbs) as total_carbs,
        SUM(fats) as total_fats,
        COUNT(*) as meal_count
      FROM meals
      WHERE user_id = $1 AND meal_date = $2
      GROUP BY meal_date
    `;
    const result = await pool.query(query, [userId, date]);
    return result.rows[0];
  }

  // Get nutrition summary for date range
  static async getNutritionSummaryRange(userId, startDate, endDate) {
    const query = `
      SELECT 
        meal_date,
        SUM(calories) as total_calories,
        SUM(protein) as total_protein,
        SUM(carbs) as total_carbs,
        SUM(fats) as total_fats,
        COUNT(*) as meal_count
      FROM meals
      WHERE user_id = $1 
        AND meal_date >= $2 
        AND meal_date <= $3
      GROUP BY meal_date
      ORDER BY meal_date
    `;
    const result = await pool.query(query, [userId, startDate, endDate]);
    return result.rows;
  }
}

module.exports = Meal;