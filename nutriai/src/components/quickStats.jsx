import { useState, useEffect } from 'react';
import { getMeals, getNutritionSummary, getStreak } from '../services/api';
import './QuickStats.css';

export default function QuickStats() {
  const [stats, setStats] = useState({
    totalMeals: 0,
    avgCalories: 0,
    mostLoggedType: '-',
    currentStreak: 0,
    favoriteCuisine: '-',
    weeklySpent: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);

      // Get all meals
      const mealsResponse = await getMeals();
      const allMeals = mealsResponse.data.meals || [];

      // Get today's nutrition
      const today = new Date().toISOString().split('T')[0];
      const nutritionResponse = await getNutritionSummary(today);
      const todayData = nutritionResponse.data.summary;

      // Get streak
      const streakResponse = await getStreak();
      const streakData = streakResponse.data;

      // Calculate stats
      const totalMeals = allMeals.length;

      // Calculate average daily calories (from all meals)
      const totalCalories = allMeals.reduce((sum, meal) => sum + parseFloat(meal.calories || 0), 0);
      const avgCalories = totalMeals > 0 ? Math.round(totalCalories / totalMeals) : 0;

      // Find most logged meal type
      const mealTypeCounts = {};
      allMeals.forEach(meal => {
        mealTypeCounts[meal.meal_type] = (mealTypeCounts[meal.meal_type] || 0) + 1;
      });
      const mostLoggedType = Object.keys(mealTypeCounts).length > 0
        ? Object.keys(mealTypeCounts).reduce((a, b) => 
            mealTypeCounts[a] > mealTypeCounts[b] ? a : b
          ).charAt(0).toUpperCase() + Object.keys(mealTypeCounts).reduce((a, b) => 
            mealTypeCounts[a] > mealTypeCounts[b] ? a : b
          ).slice(1)
        : '-';

      // Get current streak
      const currentStreak = streakData?.currentStreak || 0;

      // Estimate weekly spent (rough calculation: avg $5 per meal)
      const last7Days = allMeals.filter(meal => {
        const mealDate = new Date(meal.meal_date);
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        return mealDate >= sevenDaysAgo;
      });
      const weeklySpent = last7Days.length * 5; // Estimate $5 per meal

      // Placeholder for favorite cuisine (would need meal template data)
      const favoriteCuisine = 'Nepali'; // Could be calculated from meal names/tags

      setStats({
        totalMeals,
        avgCalories,
        mostLoggedType,
        currentStreak,
        favoriteCuisine,
        weeklySpent
      });

    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="quick-stats-container">
        <div className="stat-card stat-card-loading">
          <div className="stat-shimmer"></div>
        </div>
        <div className="stat-card stat-card-loading">
          <div className="stat-shimmer"></div>
        </div>
        <div className="stat-card stat-card-loading">
          <div className="stat-shimmer"></div>
        </div>
        <div className="stat-card stat-card-loading">
          <div className="stat-shimmer"></div>
        </div>
        <div className="stat-card stat-card-loading">
          <div className="stat-shimmer"></div>
        </div>
        <div className="stat-card stat-card-loading">
          <div className="stat-shimmer"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="quick-stats-container">
      {/* Stat Card 1: Total Meals */}
      <div className="stat-card stat-card-purple">
        <div className="stat-icon">🍽️</div>
        <div className="stat-content">
          <div className="stat-label">Total Meals</div>
          <div className="stat-value">{stats.totalMeals}</div>
          <div className="stat-sublabel">All time</div>
        </div>
      </div>

      {/* Stat Card 2: Avg Calories */}
      <div className="stat-card stat-card-orange">
        <div className="stat-icon">🔥</div>
        <div className="stat-content">
          <div className="stat-label">Avg Calories</div>
          <div className="stat-value">{stats.avgCalories}</div>
          <div className="stat-sublabel">Per meal</div>
        </div>
      </div>

      {/* Stat Card 3: Most Logged */}
      <div className="stat-card stat-card-green">
        <div className="stat-icon">📊</div>
        <div className="stat-content">
          <div className="stat-label">Most Logged</div>
          <div className="stat-value stat-value-text">{stats.mostLoggedType}</div>
          <div className="stat-sublabel">Meal type</div>
        </div>
      </div>

      {/* Stat Card 4: Current Streak */}
      <div className="stat-card stat-card-red">
        <div className="stat-icon">🔥</div>
        <div className="stat-content">
          <div className="stat-label">Current Streak</div>
          <div className="stat-value">{stats.currentStreak} days</div>
          <div className="stat-sublabel">
            {stats.currentStreak >= 7 ? 'Amazing!' : 'Keep going!'}
          </div>
        </div>
      </div>

      {/* Stat Card 5: Favorite Cuisine */}
      <div className="stat-card stat-card-blue">
        <div className="stat-icon">🌍</div>
        <div className="stat-content">
          <div className="stat-label">Top Cuisine</div>
          <div className="stat-value stat-value-text">{stats.favoriteCuisine}</div>
          <div className="stat-sublabel">Preference</div>
        </div>
      </div>

      {/* Stat Card 6: Weekly Spent */}
      <div className="stat-card stat-card-yellow">
        <div className="stat-icon">💰</div>
        <div className="stat-content">
          <div className="stat-label">This Week</div>
          <div className="stat-value">${stats.weeklySpent}</div>
          <div className="stat-sublabel">Estimated spend</div>
        </div>
      </div>
    </div>
  );
}