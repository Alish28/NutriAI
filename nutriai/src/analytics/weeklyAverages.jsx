import { useState, useEffect } from 'react';
import { getWeeklyAverages } from '../services/api';
import './WeeklyAverages.css';

export default function WeeklyAverages() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWeeklyAverages();
  }, []);

  const loadWeeklyAverages = async () => {
    try {
      setLoading(true);
      const response = await getWeeklyAverages();
      setData(response.data);
    } catch (error) {
      console.error('Error loading weekly averages:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (percentage) => {
    if (percentage >= 95 && percentage <= 105) return '#22c55e';
    if (percentage > 105) return '#ef4444';
    if (percentage < 80) return '#3b82f6';
    return '#f59e0b';
  };

  const getStatusText = (percentage) => {
    if (percentage >= 95 && percentage <= 105) return 'On Track';
    if (percentage > 105) return 'Over Goal';
    if (percentage < 80) return 'Under Goal';
    return 'Close';
  };

  if (loading) {
    return (
      <div className="weekly-avg-card">
        <h3>Weekly Averages</h3>
        <div className="avg-loading">Loading...</div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { averages, goals, daysLogged, totalDays, percentages } = data;

  const nutrients = [
    { 
      key: 'calories', 
      label: 'Calories', 
      icon: '🔥',
      unit: 'cal',
      color: '#f59e0b'
    },
    { 
      key: 'protein', 
      label: 'Protein', 
      icon: '💪',
      unit: 'g',
      color: '#3b82f6'
    },
    { 
      key: 'carbs', 
      label: 'Carbs', 
      icon: '🌾',
      unit: 'g',
      color: '#10b981'
    },
    { 
      key: 'fats', 
      label: 'Fats', 
      icon: '🥑',
      unit: 'g',
      color: '#8b5cf6'
    }
  ];

  return (
    <div className="weekly-avg-card">
      <div className="avg-header">
        <h3>📈 Weekly Averages</h3>
        <div className="days-logged-badge">
          {daysLogged} / {totalDays} days
        </div>
      </div>

      <div className="avg-grid">
        {nutrients.map(nutrient => {
          const avg = parseFloat(averages[nutrient.key]);
          const goal = goals[nutrient.key];
          const percentage = percentages[nutrient.key];
          const statusColor = getStatusColor(percentage);
          const statusText = getStatusText(percentage);

          return (
            <div key={nutrient.key} className="avg-item">
              <div className="avg-item-header">
                <span className="avg-icon">{nutrient.icon}</span>
                <span className="avg-label">{nutrient.label}</span>
              </div>

              <div className="avg-values">
                <div className="avg-current" style={{ color: nutrient.color }}>
                  {nutrient.key === 'calories' ? Math.round(avg) : avg}
                  <span className="avg-unit">{nutrient.unit}</span>
                </div>
                <div className="avg-divider">/</div>
                <div className="avg-goal">
                  {goal}
                  <span className="avg-unit">{nutrient.unit}</span>
                </div>
              </div>

              <div className="avg-progress">
                <div className="avg-progress-bar">
                  <div 
                    className="avg-progress-fill"
                    style={{ 
                      width: `${Math.min(percentage, 100)}%`,
                      background: nutrient.color
                    }}
                  />
                </div>
                <span className="avg-percentage">{percentage}%</span>
              </div>

              <div className="avg-status" style={{ color: statusColor }}>
                <span className="status-dot" style={{ background: statusColor }} />
                {statusText}
              </div>
            </div>
          );
        })}
      </div>

      {daysLogged < 7 && (
        <div className="avg-tip">
          <span className="tip-icon">💡</span>
          <p>Log meals for {7 - daysLogged} more {7 - daysLogged === 1 ? 'day' : 'days'} this week for complete data!</p>
        </div>
      )}

      {daysLogged === 7 && (
        <div className="avg-success">
          <span className="success-icon">🎉</span>
          <p>Perfect! You logged meals every day this week!</p>
        </div>
      )}
    </div>
  );
}