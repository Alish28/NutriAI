import { useState, useEffect } from 'react';
import { getMealsByDate, getNutritionSummary } from '../services/api';
import './NutritionSummary.css';

export default function NutritionSummary() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [todaysMeals, setTodaysMeals] = useState([]);

  useEffect(() => {
    loadTodaySummary();
  }, []);

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

  useEffect(() => {
    const interval = setInterval(loadTodaySummary, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
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

  const goals = {
    calories: 2000,
    protein: 150,
    carbs: 250,
    fats: 65
  };

  const getPercentage = (current, goal) => {
    return Math.min((current / goal) * 100, 100);
  };

  return (
    <div className="nutrition-card">
      <div className="nutrition-header">
        <h3>Today's Nutrition</h3>
        <button 
          className="refresh-btn" 
          onClick={loadTodaySummary}
          title="Refresh"
        >
          🔄
        </button>
      </div>

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
        <div className="nutrition-stats">
          <div className="nutrition-item">
            <div className="nutrition-item-header">
              <span className="nutrition-label">Calories</span>
              <span className="nutrition-value">
                {calories.toFixed(0)} / {goals.calories}
              </span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill calories-fill"
                style={{ width: `${getPercentage(calories, goals.calories)}%` }}
              />
            </div>
          </div>

          <div className="nutrition-item">
            <div className="nutrition-item-header">
              <span className="nutrition-label">Protein</span>
              <span className="nutrition-value">
                {protein.toFixed(1)}g / {goals.protein}g
              </span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill protein-fill"
                style={{ width: `${getPercentage(protein, goals.protein)}%` }}
              />
            </div>
          </div>

          <div className="nutrition-item">
            <div className="nutrition-item-header">
              <span className="nutrition-label">Carbs</span>
              <span className="nutrition-value">
                {carbs.toFixed(1)}g / {goals.carbs}g
              </span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill carbs-fill"
                style={{ width: `${getPercentage(carbs, goals.carbs)}%` }}
              />
            </div>
          </div>

          <div className="nutrition-item">
            <div className="nutrition-item-header">
              <span className="nutrition-label">Fats</span>
              <span className="nutrition-value">
                {fats.toFixed(1)}g / {goals.fats}g
              </span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill fats-fill"
                style={{ width: `${getPercentage(fats, goals.fats)}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {todaysMeals.length > 0 && (
        <div className="todays-meals-list">
          <h4>Today's Meals</h4>
          {todaysMeals.map((meal) => (
            <div key={meal.id} className="meal-mini-card">
              <div className="meal-mini-info">
                <span className="meal-mini-icon">
                  {meal.meal_type === 'breakfast' ? '🌅' : 
                   meal.meal_type === 'lunch' ? '🌞' : 
                   meal.meal_type === 'dinner' ? '🌙' : '🍎'}
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