import { useState, useEffect } from 'react';
import { getMealsByDate, getNutritionSummary, getFullProfile } from '../services/api';
import { calculateNutritionGoals, getInsight, getRecommendations } from '../utils/nutritionCalculator';
import './NutritionSummary.css';

export default function NutritionSummary() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [todaysMeals, setTodaysMeals] = useState([]);
  const [nutritionGoals, setNutritionGoals] = useState(null);
  const [insights, setInsights] = useState([]);

  useEffect(() => {
    loadTodaySummary();
    loadUserGoals();
  }, []);

  const loadUserGoals = async () => {
    try {
      const response = await getFullProfile();
      const profile = response.data.user;
      
      // Calculate personalized goals
      const goals = calculateNutritionGoals(profile);
      setNutritionGoals(goals);
    } catch (err) {
      console.error('Error loading profile:', err);
      // Use default goals if profile can't be loaded
      setNutritionGoals({
        calories: 2000,
        protein: 150,
        carbs: 250,
        fats: 65,
        isDefault: true
      });
    }
  };

  const loadTodaySummary = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const mealsResponse = await getMealsByDate(today);
      setTodaysMeals(mealsResponse.data.meals);

      const summaryResponse = await getNutritionSummary(today);
      setSummary(summaryResponse.data.summary);
    } catch (err) {
      console.error('Error loading summary:', err);
    } finally {
      setLoading(false);
    }
  };

  // Update insights when summary or goals change
  useEffect(() => {
    if (summary && nutritionGoals && !nutritionGoals.isDefault) {
      const actual = {
        calories: parseFloat(summary.total_calories) || 0,
        protein: parseFloat(summary.total_protein) || 0,
        carbs: parseFloat(summary.total_carbs) || 0,
        fats: parseFloat(summary.total_fats) || 0
      };
      
      const recommendations = getRecommendations(nutritionGoals, actual);
      setInsights(recommendations);
    }
  }, [summary, nutritionGoals]);

  useEffect(() => {
    const interval = setInterval(loadTodaySummary, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading || !nutritionGoals) {
    return (
      <div className="nutrition-card">
        <h3>Today's Nutrition</h3>
        <p>Loading...</p>
      </div>
    );
  }

  const calories = parseFloat(summary?.total_calories) || 0;
  const protein = parseFloat(summary?.total_protein) || 0;
  const carbs = parseFloat(summary?.total_carbs) || 0;
  const fats = parseFloat(summary?.total_fats) || 0;
  const mealCount = parseInt(summary?.meal_count) || 0;

  const getPercentage = (current, goal) => {
    return Math.min((current / goal) * 100, 100);
  };

  const getStatusClass = (current, goal) => {
    const percentage = (current / goal) * 100;
    if (percentage >= 95 && percentage <= 105) return 'status-excellent';
    if (percentage > 105) return 'status-over';
    if (percentage < 80) return 'status-under';
    return 'status-good';
  };

  return (
    <div className="nutrition-card">
      <div className="nutrition-header">
        <h3>Today's Nutrition</h3>
        <button 
          className="refresh-btn" 
          onClick={() => { loadTodaySummary(); loadUserGoals(); }}
          title="Refresh"
        >
          🔄
        </button>
      </div>

      {/* Goal Info Banner */}
      {nutritionGoals.isDefault ? (
        <div className="goals-banner warning">
          <span className="banner-icon">⚠️</span>
          <div className="banner-text">
            <strong>Using default goals</strong>
            <p>Complete your profile for personalized nutrition goals</p>
          </div>
        </div>
      ) : (
        <div className="goals-banner success">
          <span className="banner-icon">🎯</span>
          <div className="banner-text">
            <strong>Personalized goals active</strong>
            <p>Based on your profile: {nutritionGoals.activityLevel}</p>
          </div>
        </div>
      )}

      <div className="meals-count">
        <span className="meals-icon">🍽️</span>
        <span className="meals-text">{mealCount} meals logged today</span>
      </div>

      {mealCount === 0 ? (
        <div className="empty-nutrition">
          <p>No meals logged yet today.</p>
          <p>Click "Add Meal" to start tracking!</p>
        </div>
      ) : (
        <>
          <div className="nutrition-stats">
            {/* Calories */}
            <div className={`nutrition-item ${getStatusClass(calories, nutritionGoals.calories)}`}>
              <div className="nutrition-item-header">
                <span className="nutrition-label">Calories</span>
                <span className="nutrition-value">
                  {calories.toFixed(0)} / {nutritionGoals.calories}
                </span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill calories-fill"
                  style={{ width: `${getPercentage(calories, nutritionGoals.calories)}%` }}
                />
              </div>
              <span className="nutrition-percentage">
                {Math.round((calories / nutritionGoals.calories) * 100)}%
              </span>
            </div>

            {/* Protein */}
            <div className={`nutrition-item ${getStatusClass(protein, nutritionGoals.protein)}`}>
              <div className="nutrition-item-header">
                <span className="nutrition-label">Protein</span>
                <span className="nutrition-value">
                  {protein.toFixed(1)}g / {nutritionGoals.protein}g
                </span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill protein-fill"
                  style={{ width: `${getPercentage(protein, nutritionGoals.protein)}%` }}
                />
              </div>
              <span className="nutrition-percentage">
                {Math.round((protein / nutritionGoals.protein) * 100)}%
              </span>
            </div>

            {/* Carbs */}
            <div className={`nutrition-item ${getStatusClass(carbs, nutritionGoals.carbs)}`}>
              <div className="nutrition-item-header">
                <span className="nutrition-label">Carbs</span>
                <span className="nutrition-value">
                  {carbs.toFixed(1)}g / {nutritionGoals.carbs}g
                </span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill carbs-fill"
                  style={{ width: `${getPercentage(carbs, nutritionGoals.carbs)}%` }}
                />
              </div>
              <span className="nutrition-percentage">
                {Math.round((carbs / nutritionGoals.carbs) * 100)}%
              </span>
            </div>

            {/* Fats */}
            <div className={`nutrition-item ${getStatusClass(fats, nutritionGoals.fats)}`}>
              <div className="nutrition-item-header">
                <span className="nutrition-label">Fats</span>
                <span className="nutrition-value">
                  {fats.toFixed(1)}g / {nutritionGoals.fats}g
                </span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill fats-fill"
                  style={{ width: `${getPercentage(fats, nutritionGoals.fats)}%` }}
                />
              </div>
              <span className="nutrition-percentage">
                {Math.round((fats / nutritionGoals.fats) * 100)}%
              </span>
            </div>
          </div>

          {/* Smart Insights */}
          {insights.length > 0 && (
            <div className="insights-section">
              <h4 className="insights-title">💡 Smart Insights</h4>
              <div className="insights-list">
                {insights.map((insight, index) => (
                  <div key={index} className="insight-item">
                    {insight}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Today's Meals List */}
      {todaysMeals.length > 0 && (
        <div className="todays-meals-list">
          <h4>Today's Meals</h4>
          {todaysMeals.map((meal) => (
            <div key={meal.id} className="meal-mini-card">
              <div className="meal-mini-info">
                <span className="meal-mini-icon">
                  {meal.meal_type === 'breakfast' ? '🌅' : 
                   meal.meal_type === 'lunch' ? '🌞' : 
                   meal.meal_type === 'dinner' ? '🌙' : '🎯'}
                </span>
                <div className="meal-mini-details">
                  <span className="meal-mini-name">{meal.meal_name}</span>
                  <span className="meal-mini-type">
                    {meal.meal_type.charAt(0).toUpperCase() + meal.meal_type.slice(1)}
                  </span>
                </div>
              </div>
              <span className="meal-mini-calories">
                {parseFloat(meal.calories).toFixed(0)} cal
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}