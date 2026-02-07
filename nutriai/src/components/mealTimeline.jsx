import { useState, useEffect } from 'react';
import { getMealsByDate } from '../services/api';
import './MealTimeline.css';

export default function MealTimeline() {
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTodaysMeals();
  }, []);

  const loadTodaysMeals = async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      const response = await getMealsByDate(today);
      
      // Sort meals by created_at time
      const sortedMeals = (response.data.meals || []).sort((a, b) => {
        return new Date(a.created_at) - new Date(b.created_at);
      });
      
      setMeals(sortedMeals);
    } catch (error) {
      console.error('Error loading meals:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMealIcon = (mealType) => {
    const icons = {
      breakfast: '🌅',
      lunch: '🌞',
      dinner: '🌙',
      snack: '🎯'
    };
    return icons[mealType] || '🍽️';
  };

  const getMealTimeLabel = (mealType) => {
    const labels = {
      breakfast: 'Morning',
      lunch: 'Afternoon',
      dinner: 'Evening',
      snack: 'Anytime'
    };
    return labels[mealType] || 'Meal';
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const getTotalCalories = () => {
    return meals.reduce((sum, meal) => sum + parseFloat(meal.calories || 0), 0);
  };

  if (loading) {
    return (
      <div className="meal-timeline-card">
        <h3 className="timeline-title">📅 Today's Meal Timeline</h3>
        <div className="timeline-loading">
          <div className="loading-dot"></div>
          <p>Loading your meals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="meal-timeline-card">
      <div className="timeline-header">
        <h3 className="timeline-title">📅 Today's Meal Timeline</h3>
        <div className="timeline-stats">
          <span className="stat-item">{meals.length} meals</span>
          <span className="stat-divider">•</span>
          <span className="stat-item">{Math.round(getTotalCalories())} cal</span>
        </div>
      </div>

      {meals.length === 0 ? (
        <div className="timeline-empty">
          <div className="empty-icon">🍽️</div>
          <p className="empty-title">No meals logged today</p>
          <p className="empty-subtitle">Click "Add Meal" to start tracking!</p>
        </div>
      ) : (
        <div className="timeline-container">
          {meals.map((meal, index) => (
            <div key={meal.id} className="timeline-item">
              {/* Timeline connector line */}
              {index < meals.length - 1 && <div className="timeline-line"></div>}
              
              {/* Timeline dot */}
              <div className="timeline-dot">
                <span className="timeline-icon">{getMealIcon(meal.meal_type)}</span>
              </div>

              {/* Meal content */}
              <div className="timeline-content">
                <div className="meal-time-header">
                  <div className="meal-time-info">
                    <span className="meal-time">{formatTime(meal.created_at)}</span>
                    <span className="meal-type-label">
                      {meal.meal_type.charAt(0).toUpperCase() + meal.meal_type.slice(1)}
                    </span>
                  </div>
                  <span className="meal-calories">
                    {Math.round(parseFloat(meal.calories))} cal
                  </span>
                </div>

                <h4 className="meal-name">{meal.meal_name}</h4>

                {meal.description && (
                  <p className="meal-description">{meal.description}</p>
                )}

                <div className="meal-macros">
                  <div className="macro-item">
                    <span className="macro-icon">💪</span>
                    <span className="macro-value">{parseFloat(meal.protein).toFixed(1)}g</span>
                    <span className="macro-label">protein</span>
                  </div>
                  <div className="macro-item">
                    <span className="macro-icon">🍞</span>
                    <span className="macro-value">{parseFloat(meal.carbs).toFixed(1)}g</span>
                    <span className="macro-label">carbs</span>
                  </div>
                  <div className="macro-item">
                    <span className="macro-icon">🥑</span>
                    <span className="macro-value">{parseFloat(meal.fats).toFixed(1)}g</span>
                    <span className="macro-label">fats</span>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Add future meal placeholders */}
          {meals.length < 3 && (
            <div className="timeline-item timeline-placeholder">
              <div className="timeline-dot timeline-dot-empty">
                <span className="timeline-icon">➕</span>
              </div>
              <div className="timeline-content timeline-content-empty">
                <p className="placeholder-text">Add your next meal</p>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="timeline-footer">
        <button className="timeline-refresh-btn" onClick={loadTodaysMeals}>
          🔄 Refresh
        </button>
      </div>
    </div>
  );
}