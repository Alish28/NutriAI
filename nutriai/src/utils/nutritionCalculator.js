/**
 * Nutrition Goal Calculator
 * 
 * Calculates personalized daily nutrition goals based on user profile.
 * Uses the Mifflin-St Jeor equation for BMR (industry standard).
 */

/**
 * Calculate BMR (Basal Metabolic Rate)
 * @param {number} weight - Weight in kilograms
 * @param {number} height - Height in centimeters
 * @param {number} age - Age in years
 * @param {string} gender - 'Male', 'Female', 'Non-binary', or 'Prefer not to say'
 * @returns {number} BMR in calories
 */
export function calculateBMR(weight, height, age, gender) {
  // Mifflin-St Jeor Equation
  // For males: BMR = 10W + 6.25H - 5A + 5
  // For females: BMR = 10W + 6.25H - 5A - 161
  
  const baseCalc = 10 * weight + 6.25 * height - 5 * age;
  
  if (gender === 'Male') {
    return baseCalc + 5;
  } else if (gender === 'Female') {
    return baseCalc - 161;
  } else {
    // For Non-binary or Prefer not to say, use average
    return baseCalc - 78; // Average of +5 and -161
  }
}

/**
 * Calculate TDEE (Total Daily Energy Expenditure)
 * @param {number} bmr - Basal Metabolic Rate
 * @param {string} activityLevel - Activity level from profile
 * @returns {number} TDEE in calories
 */
export function calculateTDEE(bmr, activityLevel) {
  const activityMultipliers = {
    'Sedentary': 1.2,               // Little to no exercise
    'Lightly Active': 1.375,        // Light exercise 1-3 days/week
    'Moderately Active': 1.55,      // Moderate exercise 3-5 days/week
    'Very Active': 1.725,           // Hard exercise 6-7 days/week
    'Extremely Active': 1.9         // Very hard exercise, physical job
  };
  
  const multiplier = activityMultipliers[activityLevel] || 1.2;
  return Math.round(bmr * multiplier);
}

/**
 * Calculate macronutrient goals
 * @param {number} tdee - Total Daily Energy Expenditure
 * @param {Array<string>} healthGoals - User's health goals
 * @param {Array<string>} nutritionFocus - User's nutrition focus
 * @returns {Object} Macro goals { protein, carbs, fats }
 */
export function calculateMacros(tdee, healthGoals = [], nutritionFocus = []) {
  // Default macro split (balanced)
  let proteinPercent = 0.30;  // 30%
  let carbsPercent = 0.40;    // 40%
  let fatsPercent = 0.30;     // 30%
  
  // Adjust based on health goals and nutrition focus
  if (healthGoals.includes('Muscle Gain') || nutritionFocus.includes('High Protein')) {
    proteinPercent = 0.35;  // 35%
    carbsPercent = 0.35;    // 35%
    fatsPercent = 0.30;     // 30%
  }
  
  if (healthGoals.includes('Weight Management') || nutritionFocus.includes('Low Carb')) {
    proteinPercent = 0.30;  // 30%
    carbsPercent = 0.30;    // 30%
    fatsPercent = 0.40;     // 40%
  }
  
  if (nutritionFocus.includes('Heart Healthy')) {
    proteinPercent = 0.25;  // 25%
    carbsPercent = 0.45;    // 45%
    fatsPercent = 0.30;     // 30%
  }
  
  // Calculate grams
  // Protein: 4 calories per gram
  // Carbs: 4 calories per gram
  // Fats: 9 calories per gram
  
  const proteinCalories = tdee * proteinPercent;
  const carbsCalories = tdee * carbsPercent;
  const fatsCalories = tdee * fatsPercent;
  
  return {
    protein: Math.round(proteinCalories / 4),
    carbs: Math.round(carbsCalories / 4),
    fats: Math.round(fatsCalories / 9)
  };
}

/**
 * Calculate complete nutrition goals from user profile
 * @param {Object} profile - User profile object
 * @returns {Object} Complete nutrition goals
 */
export function calculateNutritionGoals(profile) {
  // Validate required fields
  if (!profile || !profile.age || !profile.weight || !profile.height || !profile.gender) {
    // Return default goals if profile is incomplete
    return {
      calories: 2000,
      protein: 150,
      carbs: 250,
      fats: 65,
      isDefault: true,
      message: 'Complete your profile for personalized goals'
    };
  }
  
  // Parse values
  const weight = parseFloat(profile.weight);
  const height = parseFloat(profile.height);
  const age = parseInt(profile.age);
  const gender = profile.gender;
  const activityLevel = profile.activity_level || 'Sedentary';
  const healthGoals = profile.health_goals || [];
  const nutritionFocus = profile.nutrition_focus || [];
  
  // Calculate BMR
  const bmr = calculateBMR(weight, height, age, gender);
  
  // Calculate TDEE (daily calorie goal)
  const calories = calculateTDEE(bmr, activityLevel);
  
  // Calculate macros
  const macros = calculateMacros(calories, healthGoals, nutritionFocus);
  
  return {
    calories,
    protein: macros.protein,
    carbs: macros.carbs,
    fats: macros.fats,
    bmr: Math.round(bmr),
    activityLevel,
    isDefault: false
  };
}

/**
 * Get insights based on actual vs goal
 * @param {number} actual - Actual value consumed
 * @param {number} goal - Goal value
 * @param {string} nutrient - Name of nutrient (e.g., 'calories', 'protein')
 * @returns {Object} Insight { message, status, percentage }
 */
export function getInsight(actual, goal, nutrient) {
  const percentage = Math.round((actual / goal) * 100);
  const diff = actual - goal;
  const absDiff = Math.abs(diff);
  
  let status = 'good';
  let message = '';
  
  if (percentage >= 95 && percentage <= 105) {
    status = 'excellent';
    message = `Perfect! You're right on target with your ${nutrient}.`;
  } else if (percentage > 105 && percentage <= 115) {
    status = 'warning';
    message = `You're ${absDiff} ${nutrient === 'calories' ? 'calories' : 'g'} over your ${nutrient} goal.`;
  } else if (percentage > 115) {
    status = 'over';
    message = `You've exceeded your ${nutrient} goal by ${absDiff} ${nutrient === 'calories' ? 'calories' : 'g'}.`;
  } else if (percentage >= 80 && percentage < 95) {
    status = 'good';
    message = `You're ${absDiff} ${nutrient === 'calories' ? 'calories' : 'g'} away from your ${nutrient} goal.`;
  } else if (percentage < 80) {
    status = 'under';
    message = `Try to consume ${absDiff} more ${nutrient === 'calories' ? 'calories' : 'g'} of ${nutrient} today.`;
  }
  
  return {
    message,
    status,
    percentage
  };
}

/**
 * Get personalized recommendations
 * @param {Object} goals - Nutrition goals
 * @param {Object} actual - Actual consumption
 * @returns {Array<string>} Array of recommendation strings
 */
export function getRecommendations(goals, actual) {
  const recommendations = [];
  
  // Calories
  const caloriePercentage = (actual.calories / goals.calories) * 100;
  if (caloriePercentage < 80) {
    recommendations.push('💡 Consider adding a healthy snack to meet your calorie goal.');
  } else if (caloriePercentage > 115) {
    recommendations.push('⚠️ You\'ve exceeded your calorie goal. Try lighter options for your next meal.');
  }
  
  // Protein
  const proteinPercentage = (actual.protein / goals.protein) * 100;
  if (proteinPercentage < 70) {
    recommendations.push('🥩 Add more protein to your meals (eggs, chicken, tofu, legumes).');
  } else if (proteinPercentage > 95) {
    recommendations.push('💪 Great job hitting your protein goal!');
  }
  
  // Carbs
  const carbsPercentage = (actual.carbs / goals.carbs) * 100;
  if (carbsPercentage > 120) {
    recommendations.push('🍞 Consider reducing carbs in your next meal.');
  }
  
  // Fats
  const fatsPercentage = (actual.fats / goals.fats) * 100;
  if (fatsPercentage < 70) {
    recommendations.push('🥑 Add healthy fats (avocado, nuts, olive oil) to your diet.');
  }
  
  // If everything is on track
  if (recommendations.length === 0) {
    recommendations.push('🎉 Excellent! Your nutrition is well-balanced today.');
  }
  
  return recommendations;
}

export default {
  calculateBMR,
  calculateTDEE,
  calculateMacros,
  calculateNutritionGoals,
  getInsight,
  getRecommendations
};