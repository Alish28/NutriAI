/**
 * AI CONTROLLER
 * Handles AI recommendation API endpoints
 */

const AIRecommendationEngine = require('../services/aiRecommendationEngine');
const db = require('../config/database');

const addDays = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next.toISOString().split('T')[0];
};

const getDayName = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', { weekday: 'long' });
};

// GET /api/ai/recommendations
// Get AI meal recommendations for user
exports.getRecommendations = async (req, res) => {
  try {
    const userId = req.user.id;
    const { meal_type, date } = req.query;
    
    // Validate meal_type
    const validMealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
    if (!meal_type || !validMealTypes.includes(meal_type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid meal_type. Must be: breakfast, lunch, dinner, or snack'
      });
    }
    
    // Get recommendations from AI engine
    const recommendations = await AIRecommendationEngine.getRecommendations(
      userId,
      meal_type,
      date
    );
    
    // Save recommendations to database for tracking
    for (const rec of recommendations) {
      await db.query(`
        INSERT INTO ai_recommendations (
          user_id, meal_template_id, recommended_meal_name, meal_type,
          calories, protein, carbs, fats, reason, confidence_score,
          recommended_for_date, nutritional_gap_protein, nutritional_gap_calories
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      `, [
        userId,
        rec.id,
        rec.meal_name,
        rec.meal_type,
        rec.calories,
        rec.protein,
        rec.carbs,
        rec.fats,
        rec.reason,
        rec.confidence_score,
        date || new Date().toISOString().split('T')[0],
        rec.nutritional_gap_protein,
        rec.nutritional_gap_calories
      ]);
    }
    
    res.json({
      success: true,
      data: {
        recommendations,
        meal_type,
        date: date || new Date().toISOString().split('T')[0],
        count: recommendations.length
      }
    });
    
  } catch (error) {
    console.error('Error getting AI recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate recommendations',
      error: error.message
    });
  }
};

// POST /api/ai/feedback
// User accepts or rejects a recommendation
exports.submitFeedback = async (req, res) => {
  try {
    const userId = req.user.id;
    const { recommendation_id, accepted, meal_template_id } = req.body;
    
    if (!recommendation_id) {
      return res.status(400).json({
        success: false,
        message: 'recommendation_id is required'
      });
    }
    
    // Update recommendation record
    await db.query(`
      UPDATE ai_recommendations
      SET 
        was_accepted = $1,
        was_rejected = $2
      WHERE id = $3 AND user_id = $4
    `, [accepted, !accepted, recommendation_id, userId]);
    
    // If accepted, increase meal template popularity
    if (accepted && meal_template_id) {
      await db.query(`
        UPDATE meal_templates
        SET popularity_score = LEAST(popularity_score + 5, 100)
        WHERE id = $1
      `, [meal_template_id]);
    }
    
    res.json({
      success: true,
      message: accepted ? 'Thank you for your feedback!' : 'We\'ll improve our recommendations'
    });
    
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit feedback'
    });
  }
};

// GET /api/ai/insights
// Get AI insights about user's eating patterns
exports.getInsights = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user's meal history (last 30 days)
    const historyQuery = await db.query(`
      SELECT 
        meal_type,
        COUNT(*) as count,
        AVG(calories) as avg_calories,
        AVG(protein) as avg_protein
      FROM meals
      WHERE user_id = $1 
        AND meal_date >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY meal_type
    `, [userId]);
    
    const mealHistory = historyQuery.rows;
    
    // Get recommendation acceptance rate
    const feedbackQuery = await db.query(`
      SELECT 
        COUNT(*) FILTER (WHERE was_accepted = true) as accepted_count,
        COUNT(*) as total_recommendations
      FROM ai_recommendations
      WHERE user_id = $1
    `, [userId]);
    
    const feedback = feedbackQuery.rows[0];
    const acceptanceRate = feedback.total_recommendations > 0
      ? Math.round((feedback.accepted_count / feedback.total_recommendations) * 100)
      : 0;
    
    // Generate insights
    const insights = [];
    
    // Insight 1: Most logged meal type
    if (mealHistory.length > 0) {
      const mostLogged = mealHistory.reduce((prev, current) => 
        (prev.count > current.count) ? prev : current
      );
      insights.push({
        type: 'pattern',
        title: 'Meal Logging Pattern',
        message: `You log ${mostLogged.meal_type} most often (${mostLogged.count} times in last 30 days)`
      });
    }
    
    // Insight 2: Protein intake
    const avgProtein = mealHistory.reduce((sum, meal) => 
      sum + parseFloat(meal.avg_protein || 0), 0
    ) / Math.max(mealHistory.length, 1);
    
    if (avgProtein < 20) {
      insights.push({
        type: 'suggestion',
        title: 'Protein Boost Needed',
        message: `Your average protein per meal is ${Math.round(avgProtein)}g. Consider high-protein options.`
      });
    }
    
    // Insight 3: AI learning
    if (acceptanceRate > 0) {
      insights.push({
        type: 'ai',
        title: 'AI Learning Progress',
        message: `You've accepted ${acceptanceRate}% of AI recommendations. The system is learning your preferences!`
      });
    }
    
    res.json({
      success: true,
      data: {
        insights,
        acceptance_rate: acceptanceRate,
        total_recommendations: parseInt(feedback.total_recommendations),
        meal_history: mealHistory
      }
    });
    
  } catch (error) {
    console.error('Error getting insights:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate insights'
    });
  }
};

// GET /api/ai/weekly-plan
// Generates 7 days x breakfast/lunch/dinner/snack using the same explainable engine.
exports.getWeeklyMealPlan = async (req, res) => {
  try {
    const userId = req.user.id;
    const startDate = req.query.start_date || new Date().toISOString().split('T')[0];
    const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];

    const days = [];
    let totalCalories = 0;
    let totalProtein = 0;
    let totalEstimatedCost = 0;

    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
      const date = addDays(startDate, dayIndex);
      const meals = [];

      for (let mealIndex = 0; mealIndex < mealTypes.length; mealIndex++) {
        const mealType = mealTypes[mealIndex];
        const recommendations = await AIRecommendationEngine.getRecommendations(userId, mealType, date);

        if (recommendations.length > 0) {
          // Rotate through top results so the week does not repeat the same meal every day.
          const selected = recommendations[(dayIndex + mealIndex) % recommendations.length];
          meals.push({
            meal_type: mealType,
            meal_template_id: selected.id,
            meal_name: selected.meal_name,
            description: selected.description,
            calories: Number(selected.calories || 0),
            protein: Number(selected.protein || 0),
            carbs: Number(selected.carbs || 0),
            fats: Number(selected.fats || 0),
            cuisine_type: selected.cuisine_type,
            estimated_cost: selected.estimated_cost ? Number(selected.estimated_cost) : null,
            confidence_score: selected.confidence_score,
            reason: selected.reason
          });

          totalCalories += Number(selected.calories || 0);
          totalProtein += Number(selected.protein || 0);
          totalEstimatedCost += Number(selected.estimated_cost || 0);
        } else {
          meals.push({
            meal_type: mealType,
            meal_name: 'No suitable meal found',
            reason: 'Add more meal templates for this meal type.'
          });
        }
      }

      days.push({
        date,
        day_name: getDayName(date),
        meals,
        daily_totals: {
          calories: meals.reduce((sum, meal) => sum + Number(meal.calories || 0), 0),
          protein: meals.reduce((sum, meal) => sum + Number(meal.protein || 0), 0),
          estimated_cost: meals.reduce((sum, meal) => sum + Number(meal.estimated_cost || 0), 0)
        }
      });
    }

    res.json({
      success: true,
      data: {
        start_date: startDate,
        days,
        summary: {
          total_days: days.length,
          total_meals: days.reduce((sum, day) => sum + day.meals.length, 0),
          average_daily_calories: Math.round(totalCalories / 7),
          average_daily_protein: Math.round(totalProtein / 7),
          estimated_weekly_cost: Math.round(totalEstimatedCost)
        }
      }
    });
  } catch (error) {
    console.error('Error generating weekly meal plan:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate weekly meal plan',
      error: error.message
    });
  }
};
