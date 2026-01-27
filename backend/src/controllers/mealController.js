const Meal = require('../models/mealModel');

// Create new meal
exports.createMeal = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      meal_date,
      meal_type,
      meal_name,
      description,
      calories,
      protein,
      carbs,
      fats
    } = req.body;

    if (!meal_date || !meal_type || !meal_name) {
      return res.status(400).json({
        success: false,
        message: 'Please provide meal_date, meal_type, and meal_name'
      });
    }

    const validTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
    if (!validTypes.includes(meal_type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid meal_type. Must be: breakfast, lunch, dinner, or snack'
      });
    }

    const newMeal = await Meal.create({
      user_id: userId,
      meal_date,
      meal_type,
      meal_name,
      description,
      calories: parseFloat(calories) || 0,    //Handles decimal values
      protein: parseFloat(protein) || 0,      
      carbs: parseFloat(carbs) || 0,          
      fats: parseFloat(fats) || 0             
    });

    res.status(201).json({
      success: true,
      message: 'Meal created successfully',
      data: { meal: newMeal }
    });
  } catch (error) {
    console.error('Create meal error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating meal',
      error: error.message
    });
  }
};

// Get all meals for logged-in user
exports.getUserMeals = async (req, res) => {
  try {
    const userId = req.user.id;
    const meals = await Meal.findByUserId(userId);

    res.status(200).json({
      success: true,
      data: { meals }
    });
  } catch (error) {
    console.error('Get meals error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching meals',
      error: error.message
    });
  }
};

// Get meals for a specific date
exports.getMealsByDate = async (req, res) => {
  try {
    const userId = req.user.id;
    const { date } = req.params;

    const meals = await Meal.findByUserAndDate(userId, date);

    res.status(200).json({
      success: true,
      data: { meals }
    });
  } catch (error) {
    console.error('Get meals by date error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching meals',
      error: error.message
    });
  }
};

// Get meals for a week
exports.getMealsByWeek = async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Please provide startDate and endDate'
      });
    }

    const meals = await Meal.findByUserAndDateRange(userId, startDate, endDate);

    res.status(200).json({
      success: true,
      data: { meals }
    });
  } catch (error) {
    console.error('Get meals by week error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching meals',
      error: error.message
    });
  }
};

// Get single meal
exports.getMeal = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const meal = await Meal.findById(id, userId);

    if (!meal) {
      return res.status(404).json({
        success: false,
        message: 'Meal not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { meal }
    });
  } catch (error) {
    console.error('Get meal error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching meal',
      error: error.message
    });
  }
};

// Update meal
exports.updateMeal = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const mealData = req.body;

    // Parse float values if they exist
    if (mealData.calories) mealData.calories = parseFloat(mealData.calories);
    if (mealData.protein) mealData.protein = parseFloat(mealData.protein);
    if (mealData.carbs) mealData.carbs = parseFloat(mealData.carbs);
    if (mealData.fats) mealData.fats = parseFloat(mealData.fats);

    const updatedMeal = await Meal.update(id, userId, mealData);

    if (!updatedMeal) {
      return res.status(404).json({
        success: false,
        message: 'Meal not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Meal updated successfully',
      data: { meal: updatedMeal }
    });
  } catch (error) {
    console.error('Update meal error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating meal',
      error: error.message
    });
  }
};

// Delete meal
exports.deleteMeal = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const deletedMeal = await Meal.delete(id, userId);

    if (!deletedMeal) {
      return res.status(404).json({
        success: false,
        message: 'Meal not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Meal deleted successfully'
    });
  } catch (error) {
    console.error('Delete meal error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting meal',
      error: error.message
    });
  }
};

// Get nutrition summary for a date
exports.getNutritionSummary = async (req, res) => {
  try {
    const userId = req.user.id;
    const { date } = req.params;

    const summary = await Meal.getNutritionSummary(userId, date);

    res.status(200).json({
      success: true,
      data: { summary: summary || { total_calories: 0, total_protein: 0, total_carbs: 0, total_fats: 0, meal_count: 0 } }
    });
  } catch (error) {
    console.error('Get nutrition summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching nutrition summary',
      error: error.message
    });
  }
};

// Get nutrition summary for date range
exports.getNutritionSummaryRange = async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Please provide startDate and endDate'
      });
    }

    const summary = await Meal.getNutritionSummaryRange(userId, startDate, endDate);

    res.status(200).json({
      success: true,
      data: { summary }
    });
  } catch (error) {
    console.error('Get nutrition summary range error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching nutrition summary',
      error: error.message
    });
  }
};