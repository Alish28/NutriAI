/**
 * ALGORITHM:
 * 1. Load user profile (goals, preferences, restrictions)
 * 2. Get today's meals and calculate nutritional gaps
 * 3. Filter meal templates by:
 *    - Meal type (breakfast/lunch/dinner)
 *    - Dietary restrictions (vegan, gluten-free, etc.)
 *    - Allergies
 * 4. Score each meal based on:
 *    - Nutritional fit (how well it fills gaps)
 *    - User preferences (cuisine, past meals)
 *    - Health goals (weight loss/gain)
 *    - Budget constraints
 * 5. Return top 3 recommendations with explanations
 */

const db = require('../config/database');

class AIRecommendationEngine {
  
  /**
   * Main recommendation function
   * @param {number} userId - User ID
   * @param {string} mealType - 'breakfast', 'lunch', 'dinner', or 'snack'
   * @param {string} targetDate - Date in YYYY-MM-DD format (default: today)
   * @returns {Promise<Array>} - Top 3 recommended meals with explanations
   */
  static async getRecommendations(userId, mealType, targetDate = null) {
    try {
      // Set target date to today if not provided
      if (!targetDate) {
        targetDate = new Date().toISOString().split('T')[0];
      }

      console.log(`🤖 AI: Generating recommendations for user ${userId}, ${mealType} on ${targetDate}`);

      // STEP 1: Load user profile
      const userProfile = await this.getUserProfile(userId);
      
      // STEP 2: Calculate today's nutritional status
      const nutritionalStatus = await this.getTodaysNutritionalStatus(userId, targetDate, userProfile);
      
      // STEP 3: Get filtered meal templates
      const candidateMeals = await this.getFilteredMealTemplates(mealType, userProfile);
      
      // STEP 4: Score each candidate meal
      const scoredMeals = candidateMeals.map(meal => {
        const score = this.calculateMealScore(meal, userProfile, nutritionalStatus);
        return { ...meal, ...score };
      });
      
      // STEP 5: Sort by score and return top 3
      const topRecommendations = scoredMeals
        .sort((a, b) => b.confidence_score - a.confidence_score)
        .slice(0, 3);
      
      console.log(`âœ… AI: Returning ${topRecommendations.length} recommendations`);
      
      return topRecommendations;
      
    } catch (error) {
      console.error('❌ AI Engine Error:', error);
      throw error;
    }
  }

  /**
   * STEP 1: Load user profile with goals and preferences
   */
  static async getUserProfile(userId) {
    const query = `
      SELECT 
        age, gender, weight, height,
        activity_level, health_goals,
        dietary_preferences, allergies, preferred_cuisines,
        daily_budget, weekly_budget
      FROM users
      WHERE id = $1
    `;
    
    const result = await db.query(query, [userId]);
    const profile = result.rows[0];
    
    // Calculate daily nutrition goals (BMR + TDEE)
    if (profile && profile.age && profile.weight && profile.height) {
      profile.nutrition_goals = this.calculateNutritionGoals(profile);
    } else {
      // Default goals if profile incomplete
      profile.nutrition_goals = {
        calories: 2000,
        protein: 150,
        carbs: 250,
        fats: 65
      };
    }
    
    // Parse arrays (PostgreSQL returns as arrays already, but handle nulls)
    profile.health_goals = profile.health_goals || [];
    profile.dietary_preferences = profile.dietary_preferences || [];
    profile.allergies = profile.allergies || [];
    profile.preferred_cuisines = profile.preferred_cuisines || [];
    
    return profile;
  }

  /**
   * Calculate nutrition goals using Mifflin-St Jeor equation
   */
  static calculateNutritionGoals(profile) {
    // BMR calculation
    const bmr = profile.gender === 'Male'
      ? 10 * profile.weight + 6.25 * profile.height - 5 * profile.age + 5
      : 10 * profile.weight + 6.25 * profile.height - 5 * profile.age - 161;
    
    // Activity multipliers
    const activityMultipliers = {
      'Sedentary': 1.2,
      'Lightly Active': 1.375,
      'Moderately Active': 1.55,
      'Very Active': 1.725,
      'Extremely Active': 1.9
    };
    
    const multiplier = activityMultipliers[profile.activity_level] || 1.2;
    let calories = Math.round(bmr * multiplier);
    
    // Adjust for health goals
    if (profile.health_goals.includes('Weight Management')) {
      calories -= 300; // Deficit for weight loss
    } else if (profile.health_goals.includes('Muscle Gain')) {
      calories += 300; // Surplus for muscle gain
    }
    
    // Calculate macros
    const proteinPercent = profile.health_goals.includes('Muscle Gain') ? 0.35 : 0.30;
    const fatPercent = profile.health_goals.includes('Weight Management') ? 0.25 : 0.30;
    const carbPercent = 1 - proteinPercent - fatPercent;
    
    return {
      calories,
      protein: Math.round((calories * proteinPercent) / 4),  // 4 cal/g
      carbs: Math.round((calories * carbPercent) / 4),       // 4 cal/g
      fats: Math.round((calories * fatPercent) / 9)          // 9 cal/g
    };
  }

  /**
   * STEP 2: Get today's meals and calculate what's still needed
   */
  static async getTodaysNutritionalStatus(userId, targetDate, userProfile) {
    const query = `
      SELECT 
        COALESCE(SUM(calories), 0) as consumed_calories,
        COALESCE(SUM(protein), 0) as consumed_protein,
        COALESCE(SUM(carbs), 0) as consumed_carbs,
        COALESCE(SUM(fats), 0) as consumed_fats,
        COUNT(*) as meals_logged
      FROM meals
      WHERE user_id = $1 AND meal_date::date = $2
    `;
    
    const result = await db.query(query, [userId, targetDate]);
    const consumed = result.rows[0];
    
    const goals = userProfile.nutrition_goals;
    
    return {
      consumed: {
        calories: parseFloat(consumed.consumed_calories),
        protein: parseFloat(consumed.consumed_protein),
        carbs: parseFloat(consumed.consumed_carbs),
        fats: parseFloat(consumed.consumed_fats)
      },
      remaining: {
        calories: Math.max(0, goals.calories - parseFloat(consumed.consumed_calories)),
        protein: Math.max(0, goals.protein - parseFloat(consumed.consumed_protein)),
        carbs: Math.max(0, goals.carbs - parseFloat(consumed.consumed_carbs)),
        fats: Math.max(0, goals.fats - parseFloat(consumed.consumed_fats))
      },
      goals,
      meals_logged: parseInt(consumed.meals_logged)
    };
  }

  /**
   * STEP 3: Filter meal templates based on user restrictions
   */
  static async getFilteredMealTemplates(mealType, userProfile) {
    const query = `
      SELECT * FROM meal_templates
      WHERE meal_type = $1 AND is_active = true
      ORDER BY popularity_score DESC
    `;
    
    const result = await db.query(query, [mealType]);
    let meals = result.rows;
    
    // Filter by dietary preferences
    if (userProfile.dietary_preferences.length > 0) {
      meals = meals.filter(meal => {
        const mealTags = meal.dietary_tags || [];
        // Meal must match at least one dietary preference
        return userProfile.dietary_preferences.some(pref => 
          mealTags.includes(pref.toLowerCase())
        );
      });
    }
    
    // Filter out meals with allergens
    if (userProfile.allergies.length > 0) {
      meals = meals.filter(meal => {
        const ingredients = (meal.ingredients || []).join(' ').toLowerCase();
        // Meal must NOT contain any allergens
        return !userProfile.allergies.some(allergen =>
          ingredients.includes(allergen.toLowerCase())
        );
      });
    }
    
    // Filter by budget if specified
    if (userProfile.daily_budget) {
      meals = meals.filter(meal => 
        meal.estimated_cost <= userProfile.daily_budget
      );
    }
    
    return meals;
  }

  /**
   * STEP 4: Score a meal based on how well it fits user needs
   * Returns score (0-100) and explanation
   */
  static calculateMealScore(meal, userProfile, nutritionalStatus) {
    let score = 0;
    let reasons = [];
    
    // ========== FACTOR 1: Nutritional Gap Fit (40 points) ==========
    const proteinFit = this.calculateNutrientFit(
      meal.protein,
      nutritionalStatus.remaining.protein,
      nutritionalStatus.goals.protein
    );
    const caloriesFit = this.calculateNutrientFit(
      meal.calories,
      nutritionalStatus.remaining.calories,
      nutritionalStatus.goals.calories
    );
    
    score += (proteinFit + caloriesFit) / 2 * 40;
    
    if (proteinFit > 0.7) {
      reasons.push(`Perfect protein match (${meal.protein}g fills your remaining ${Math.round(nutritionalStatus.remaining.protein)}g need)`);
    }
    
    if (caloriesFit > 0.7) {
      reasons.push(`Great calorie fit (${Math.round(meal.calories)} cal matches your remaining ${Math.round(nutritionalStatus.remaining.calories)} cal)`);
    }
    
    // ========== FACTOR 2: Health Goals Alignment (25 points) ==========
    let goalScore = 0;
    
    if (userProfile.health_goals.includes('Muscle Gain')) {
      // High protein meals score better
      if (meal.protein >= 30) {
        goalScore += 25;
        reasons.push('High protein content supports muscle gain goal');
      }
    }
    
    if (userProfile.health_goals.includes('Weight Management')) {
      // Lower calorie, high protein meals score better
      if (meal.calories <= 450 && meal.protein >= 20) {
        goalScore += 25;
        reasons.push('Low-calorie, high-protein meal supports weight management');
      }
    }
    
    if (userProfile.health_goals.includes('Heart Health')) {
      // Low fat, high fiber meals score better
      if (meal.fats <= 15) {
        goalScore += 25;
        reasons.push('Low in fats, good for heart health');
      }
    }
    
    score += goalScore;
    
    // ========== FACTOR 3: Cuisine Preference (15 points) ==========
    if (userProfile.preferred_cuisines.length > 0) {
      if (userProfile.preferred_cuisines.includes(meal.cuisine_type)) {
        score += 15;
        reasons.push(`Matches your love for ${meal.cuisine_type} cuisine`);
      }
    } else {
      score += 10; // Neutral if no preference
    }
    
    // ========== FACTOR 4: Variety (10 points) ==========
    // TODO: Check if user hasn't eaten this recently
    score += 10; // For now, give base variety score
    
    // ========== FACTOR 5: Budget Fit (10 points) ==========
    if (userProfile.daily_budget) {
      const budgetFit = Math.max(0, 1 - (meal.estimated_cost / userProfile.daily_budget));
      score += budgetFit * 10;
      if (meal.estimated_cost <= userProfile.daily_budget * 0.5) {
        reasons.push('Budget-friendly option');
      }
    } else {
      score += 5; // Neutral if no budget set
    }
    
    // Ensure score is between 0-100
    score = Math.min(100, Math.max(0, Math.round(score)));
    
    // Generate explanation
    const explanation = this.generateExplanation(meal, reasons, nutritionalStatus);
    
    return {
      confidence_score: score,
      reason: explanation,
      nutritional_gap_protein: nutritionalStatus.remaining.protein,
      nutritional_gap_calories: nutritionalStatus.remaining.calories
    };
  }

  /**
   * Calculate how well a nutrient amount fits the remaining need
   * Returns 0-1 score (1 = perfect fit)
   */
  static calculateNutrientFit(mealAmount, remaining, dailyGoal) {
    if (remaining <= 0) return 0; // Already met goal
    
    // Perfect fit if meal provides 50-100% of remaining need
    const percentOfRemaining = mealAmount / remaining;
    
    if (percentOfRemaining >= 0.5 && percentOfRemaining <= 1.0) {
      return 1.0; // Perfect fit
    } else if (percentOfRemaining > 1.0 && percentOfRemaining <= 1.3) {
      return 0.8; // Slightly over, still good
    } else if (percentOfRemaining >= 0.3 && percentOfRemaining < 0.5) {
      return 0.6; // A bit under, acceptable
    } else {
      return 0.3; // Poor fit
    }
  }

  /**
   * Generate human-readable explanation for recommendation
   */
  static generateExplanation(meal, reasons, nutritionalStatus) {
    let explanation = `${meal.meal_name}: `;
    
    if (reasons.length > 0) {
      explanation += reasons.join('. ') + '.';
    } else {
      explanation += 'A balanced meal option for you.';
    }
    
    // Add nutritional summary
    explanation += ` Contains ${Math.round(meal.calories)} cal, ${Math.round(meal.protein)}g protein, ${Math.round(meal.carbs)}g carbs, ${Math.round(meal.fats)}g fats.`;
    
    return explanation;
  }
}

module.exports = AIRecommendationEngine;