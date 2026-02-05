/**
 * AI CONTROLLER
 * Handles AI recommendation API endpoints
 */

const AIRecommendationEngine = require('../services/aiRecommendationEngine');
const db = require('../config/database');

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