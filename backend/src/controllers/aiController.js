const AIRecommendationEngine = require('../services/aiRecommendationEngine');
const db = require('../config/database');

const validMealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];

const getToday = () => new Date().toISOString().split('T')[0];

const addDays = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next.toISOString().split('T')[0];
};

const getDayName = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', { weekday: 'long' });
};

const saveRecommendation = async (userId, rec, date) => {
  const result = await db.query(
    `
    INSERT INTO ai_recommendations (
      user_id,
      meal_template_id,
      recommended_meal_name,
      meal_type,
      calories,
      protein,
      carbs,
      fats,
      reason,
      confidence_score,
      recommended_for_date,
      nutritional_gap_protein,
      nutritional_gap_calories
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    RETURNING id
    `,
    [
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
      date,
      rec.nutritional_gap_protein,
      rec.nutritional_gap_calories
    ]
  );

  return result.rows[0].id;
};

// GET /api/ai/recommendations
exports.getRecommendations = async (req, res) => {
  try {
    const userId = req.user.id;
    const { meal_type, date } = req.query;
    const targetDate = date || getToday();

    if (!meal_type || !validMealTypes.includes(meal_type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid meal_type. Must be: breakfast, lunch, dinner, or snack'
      });
    }

    const recommendations = await AIRecommendationEngine.getRecommendations(
      userId,
      meal_type,
      targetDate
    );

    const savedRecommendations = [];

    for (const rec of recommendations) {
      const recommendationId = await saveRecommendation(userId, rec, targetDate);

      savedRecommendations.push({
        ...rec,
        recommendation_id: recommendationId,
        meal_template_id: rec.id
      });
    }

    res.json({
      success: true,
      data: {
        recommendations: savedRecommendations,
        meal_type,
        date: targetDate,
        count: savedRecommendations.length
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

    await db.query(
      `
      UPDATE ai_recommendations
      SET 
        was_accepted = $1,
        was_rejected = $2
      WHERE id = $3 AND user_id = $4
      `,
      [Boolean(accepted), !Boolean(accepted), recommendation_id, userId]
    );

    if (accepted && meal_template_id) {
      await db.query(
        `
        UPDATE meal_templates
        SET popularity_score = LEAST(COALESCE(popularity_score, 50) + 5, 100)
        WHERE id = $1
        `,
        [meal_template_id]
      );
    }

    res.json({
      success: true,
      message: accepted ? 'Thank you for your feedback!' : 'We will improve your recommendations'
    });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit feedback',
      error: error.message
    });
  }
};

// GET /api/ai/insights
exports.getInsights = async (req, res) => {
  try {
    const userId = req.user.id;

    const historyQuery = await db.query(
      `
      SELECT 
        meal_type,
        COUNT(*) as count,
        AVG(calories) as avg_calories,
        AVG(protein) as avg_protein
      FROM meals
      WHERE user_id = $1 
        AND meal_date >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY meal_type
      `,
      [userId]
    );

    const mealHistory = historyQuery.rows;

    const feedbackQuery = await db.query(
      `
      SELECT 
        COUNT(*) FILTER (WHERE was_accepted = true) as accepted_count,
        COUNT(*) as total_recommendations
      FROM ai_recommendations
      WHERE user_id = $1
      `,
      [userId]
    );

    const feedback = feedbackQuery.rows[0];
    const totalRecommendations = parseInt(feedback.total_recommendations || 0);
    const acceptedCount = parseInt(feedback.accepted_count || 0);

    const acceptanceRate = totalRecommendations > 0
      ? Math.round((acceptedCount / totalRecommendations) * 100)
      : 0;

    const insights = [];

    if (mealHistory.length > 0) {
      const mostLogged = mealHistory.reduce((prev, current) =>
        parseInt(prev.count) > parseInt(current.count) ? prev : current
      );

      insights.push({
        type: 'pattern',
        title: 'Meal Logging Pattern',
        message: `You log ${mostLogged.meal_type} most often (${mostLogged.count} times in the last 30 days).`
      });
    }

    const avgProtein = mealHistory.reduce(
      (sum, meal) => sum + parseFloat(meal.avg_protein || 0),
      0
    ) / Math.max(mealHistory.length, 1);

    if (avgProtein > 0 && avgProtein < 20) {
      insights.push({
        type: 'suggestion',
        title: 'Protein Boost Needed',
        message: `Your average protein per meal is ${Math.round(avgProtein)}g. Consider higher-protein meals.`
      });
    }

    if (totalRecommendations > 0) {
      insights.push({
        type: 'ai',
        title: 'Recommendation Learning',
        message: `You have accepted ${acceptanceRate}% of AI recommendations.`
      });
    }

    res.json({
      success: true,
      data: {
        insights,
        acceptance_rate: acceptanceRate,
        total_recommendations: totalRecommendations,
        meal_history: mealHistory
      }
    });
  } catch (error) {
    console.error('Error getting insights:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate insights',
      error: error.message
    });
  }
};

// GET /api/ai/weekly-plan
exports.getWeeklyMealPlan = async (req, res) => {
  try {
    const userId = req.user.id;
    const startDate = req.query.start_date || getToday();

    const days = [];
    let totalCalories = 0;
    let totalProtein = 0;
    let totalEstimatedCost = 0;

    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
      const date = addDays(startDate, dayIndex);
      const meals = [];

      for (let mealIndex = 0; mealIndex < validMealTypes.length; mealIndex++) {
        const mealType = validMealTypes[mealIndex];
        const recommendations = await AIRecommendationEngine.getRecommendations(
          userId,
          mealType,
          date
        );

        if (recommendations.length > 0) {
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
            estimated_cost: selected.estimated_cost ? Number(selected.estimated_cost) : 0,
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
            calories: 0,
            protein: 0,
            carbs: 0,
            fats: 0,
            estimated_cost: 0,
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