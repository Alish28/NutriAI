import { useState, useEffect } from 'react';
import { getNutritionSummary, getStreak } from '../services/api';
import './SmartInsights.css';

export default function SmartInsights() {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInsights();
  }, []);

  const loadInsights = async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      
      // Get nutrition summary
      const nutritionResponse = await getNutritionSummary(today);
      const summary = nutritionResponse.data.summary;
      
      // Get streak data
      const streakResponse = await getStreak();
      const streakData = streakResponse.data;
      
      // Generate insights based on data
      const generatedInsights = generateInsights(summary, streakData);
      setInsights(generatedInsights);
      
    } catch (error) {
      console.error('Error loading insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateInsights = (summary, streakData) => {
    const insights = [];
    
    const calories = parseFloat(summary?.total_calories) || 0;
    const protein = parseFloat(summary?.total_protein) || 0;
    const carbs = parseFloat(summary?.total_carbs) || 0;
    const fats = parseFloat(summary?.total_fats) || 0;
    const mealCount = parseInt(summary?.meal_count) || 0;
    
    // Goals (these match NutritionSummary goals)
    const goals = {
      calories: 2000,
      protein: 150,
      carbs: 250,
      fats: 65
    };
    
    // Calculate remaining
    const remaining = {
      calories: Math.max(0, goals.calories - calories),
      protein: Math.max(0, goals.protein - protein),
      carbs: Math.max(0, goals.carbs - carbs),
      fats: Math.max(0, goals.fats - fats)
    };
    
    // Insight 1: Protein shortage
    if (remaining.protein > 30) {
      insights.push({
        icon: '💪',
        type: 'warning',
        message: `You need ${Math.round(remaining.protein)}g more protein today`,
        action: 'Try high-protein meals like chicken, fish, or lentils'
      });
    } else if (remaining.protein > 0 && remaining.protein <= 30) {
      insights.push({
        icon: '✅',
        type: 'success',
        message: `Almost at your protein goal! Just ${Math.round(remaining.protein)}g to go`,
        action: null
      });
    } else if (protein >= goals.protein) {
      insights.push({
        icon: '🎯',
        type: 'success',
        message: 'Protein goal achieved! Great job!',
        action: null
      });
    }
    
    // Insight 2: Streak motivation
    const currentStreak = streakData?.currentStreak || 0;
    if (currentStreak >= 7) {
      insights.push({
        icon: '🔥',
        type: 'success',
        message: `Amazing ${currentStreak}-day streak! You're on fire!`,
        action: 'Keep logging to maintain your momentum'
      });
    } else if (currentStreak >= 3) {
      insights.push({
        icon: '⭐',
        type: 'info',
        message: `${currentStreak}-day streak! Keep it up!`,
        action: `${7 - currentStreak} more days to unlock the 'Committed' level`
      });
    } else if (currentStreak === 1) {
      insights.push({
        icon: '🌱',
        type: 'info',
        message: 'Great start! Begin your streak today',
        action: 'Log meals consistently to build healthy habits'
      });
    }
    
    // Insight 3: Calorie tracking
    if (remaining.calories > 800) {
      insights.push({
        icon: '🍽️',
        type: 'info',
        message: `${Math.round(remaining.calories)} calories remaining today`,
        action: 'You have room for another full meal'
      });
    } else if (remaining.calories > 400 && remaining.calories <= 800) {
      insights.push({
        icon: '🥗',
        type: 'info',
        message: `${Math.round(remaining.calories)} calories left`,
        action: 'Perfect for a light dinner or snack'
      });
    } else if (remaining.calories > 0 && remaining.calories <= 400) {
      insights.push({
        icon: '🎯',
        type: 'success',
        message: `Only ${Math.round(remaining.calories)} calories left!`,
        action: 'You\'re almost at your daily goal'
      });
    } else if (calories >= goals.calories) {
      insights.push({
        icon: '✅',
        type: 'success',
        message: 'Daily calorie goal reached!',
        action: null
      });
    }
    
    // Insight 4: Meal count
    if (mealCount === 0) {
      insights.push({
        icon: '👋',
        type: 'info',
        message: 'No meals logged yet today',
        action: 'Start tracking to get personalized insights'
      });
    } else if (mealCount === 1) {
      insights.push({
        icon: '📝',
        type: 'info',
        message: '1 meal logged today',
        action: 'Keep tracking throughout the day'
      });
    } else if (mealCount >= 4) {
      insights.push({
        icon: '📊',
        type: 'success',
        message: `${mealCount} meals logged today - excellent tracking!`,
        action: null
      });
    }
    
    // Insight 5: Carbs balance
    if (remaining.carbs > 150) {
      insights.push({
        icon: '🍞',
        type: 'info',
        message: 'Low on carbs today',
        action: 'Consider rice, pasta, or whole grains'
      });
    }
    
    // Insight 6: Fats balance  
    if (protein >= goals.protein * 0.8 && carbs >= goals.carbs * 0.8 && remaining.fats > 20) {
      insights.push({
        icon: '🥑',
        type: 'info',
        message: 'Well balanced! Could add healthy fats',
        action: 'Try avocado, nuts, or olive oil'
      });
    }
    
    // Return top 4 most relevant insights
    return insights.slice(0, 4);
  };

  if (loading) {
    return (
      <div className="smart-insights-card">
        <div className="insights-header">
          <h3 className="insights-title">💡 Smart Insights</h3>
        </div>
        <div className="insights-loading">
          <div className="loading-spinner"></div>
          <p>Analyzing your data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="smart-insights-card">
      <div className="insights-header">
        <h3 className="insights-title">💡 Smart Insights</h3>
        <button 
          className="insights-refresh" 
          onClick={loadInsights}
          title="Refresh insights"
        >
          🔄
        </button>
      </div>

      {insights.length === 0 ? (
        <div className="insights-empty">
          <p>No insights available yet. Start logging meals!</p>
        </div>
      ) : (
        <div className="insights-list">
          {insights.map((insight, index) => (
            <div 
              key={index} 
              className={`insight-item insight-${insight.type}`}
            >
              <div className="insight-icon">{insight.icon}</div>
              <div className="insight-content">
                <p className="insight-message">{insight.message}</p>
                {insight.action && (
                  <p className="insight-action">→ {insight.action}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="insights-footer">
        <p>🧠 AI analyzes your data in real-time</p>
      </div>
    </div>
  );
}