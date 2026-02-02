import { useState, useEffect } from 'react';
import { getStreak } from '../services/api';
import './StreakTracker.css';

export default function StreakTracker() {
  const [streakData, setStreakData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStreak();
  }, []);

  const loadStreak = async () => {
    try {
      setLoading(true);
      const response = await getStreak();
      setStreakData(response.data);
    } catch (error) {
      console.error('Error loading streak:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStreakLevel = (streak) => {
    if (streak >= 30) return { level: 'Legend', emoji: '🏆', color: '#f59e0b' };
    if (streak >= 21) return { level: 'Master', emoji: '💎', color: '#8b5cf6' };
    if (streak >= 14) return { level: 'Expert', emoji: '⭐', color: '#3b82f6' };
    if (streak >= 7) return { level: 'Committed', emoji: '🔥', color: '#10b981' };
    if (streak >= 3) return { level: 'Getting Started', emoji: '🌱', color: '#6366f1' };
    return { level: 'Beginner', emoji: '🎯', color: '#ec4899' };
  };

  const getEncouragementMessage = (currentStreak) => {
    if (currentStreak === 0) return "Start your journey today! Log your first meal.";
    if (currentStreak === 1) return "Great start! Keep it up tomorrow!";
    if (currentStreak < 7) return `${7 - currentStreak} more days to unlock 'Committed' level!`;
    if (currentStreak < 14) return `${14 - currentStreak} more days to reach 'Expert'!`;
    if (currentStreak < 21) return `${21 - currentStreak} days until 'Master' status!`;
    if (currentStreak < 30) return `${30 - currentStreak} days from 'Legend' level!`;
    return "You're a Legend! Keep the momentum going! 🎉";
  };

  if (loading) {
    return (
      <div className="streak-card">
        <h3>Logging Streak</h3>
        <div className="streak-loading">Loading...</div>
      </div>
    );
  }

  if (!streakData) {
    return null;
  }

  const { currentStreak, longestStreak, totalDaysLogged } = streakData;
  const level = getStreakLevel(currentStreak);
  const encouragement = getEncouragementMessage(currentStreak);

  return (
    <div className="streak-card">
      <div className="streak-header">
        <h3>🔥 Logging Streak</h3>
        <button className="refresh-btn" onClick={loadStreak} title="Refresh">
          🔄
        </button>
      </div>

      {/* Current Streak Display */}
      <div className="streak-main" style={{ borderColor: level.color }}>
        <div className="streak-emoji">{level.emoji}</div>
        <div className="streak-number">{currentStreak}</div>
        <div className="streak-label">
          {currentStreak === 1 ? 'Day' : 'Days'} Streak
        </div>
        <div className="streak-level" style={{ color: level.color }}>
          {level.level}
        </div>
      </div>

      {/* Encouragement Message */}
      <div className="streak-message">
        <p>{encouragement}</p>
      </div>

      {/* Progress to Next Level */}
      {currentStreak < 30 && (
        <div className="streak-progress">
          <div className="progress-header">
            <span className="progress-label">Progress to Next Level</span>
            <span className="progress-percentage">
              {Math.round((currentStreak % 7) / 7 * 100)}%
            </span>
          </div>
          <div className="progress-bar-container">
            <div 
              className="progress-bar-fill"
              style={{ 
                width: `${(currentStreak % 7) / 7 * 100}%`,
                background: level.color
              }}
            />
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="streak-stats">
        <div className="stat-item">
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <div className="stat-value">{totalDaysLogged || 0}</div>
            <div className="stat-label">Total Days Logged</div>
          </div>
        </div>
        <div className="stat-item">
          <div className="stat-icon">🏅</div>
          <div className="stat-content">
            <div className="stat-value">{longestStreak}</div>
            <div className="stat-label">Longest Streak</div>
          </div>
        </div>
      </div>

      {/* Milestone Badges */}
      <div className="milestone-section">
        <h4>Milestones</h4>
        <div className="milestone-badges">
          <div className={`milestone-badge ${currentStreak >= 3 ? 'unlocked' : 'locked'}`}>
            <span className="badge-emoji">🌱</span>
            <span className="badge-label">3 Days</span>
          </div>
          <div className={`milestone-badge ${currentStreak >= 7 ? 'unlocked' : 'locked'}`}>
            <span className="badge-emoji">🔥</span>
            <span className="badge-label">1 Week</span>
          </div>
          <div className={`milestone-badge ${currentStreak >= 14 ? 'unlocked' : 'locked'}`}>
            <span className="badge-emoji">⭐</span>
            <span className="badge-label">2 Weeks</span>
          </div>
          <div className={`milestone-badge ${currentStreak >= 21 ? 'unlocked' : 'locked'}`}>
            <span className="badge-emoji">💎</span>
            <span className="badge-label">3 Weeks</span>
          </div>
          <div className={`milestone-badge ${currentStreak >= 30 ? 'unlocked' : 'locked'}`}>
            <span className="badge-emoji">🏆</span>
            <span className="badge-label">1 Month</span>
          </div>
        </div>
      </div>
    </div>
  );
}