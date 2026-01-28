//2
export default function ActivityGoalsStep({ data, updateData, onNext, onBack }) {
  const activityLevelOptions = [
    {
      value: 'Sedentary',
      icon: '💺',
      name: 'Sedentary',
      description: 'Little to no exercise, desk job.'
    },
    {
      value: 'Lightly Active',
      icon: '🏠',
      name: 'Lightly Active',
      description: 'Light exercise/sports 1-3 days/week.'
    },
    {
      value: 'Moderately Active',
      icon: '🏃',
      name: 'Moderately Active',
      description: 'Moderate exercise/sports 3-5 days/week.'
    },
    {
      value: 'Very Active',
      icon: '💪',
      name: 'Very Active',
      description: 'Hard exercise/sports 6-7 days/week.'
    }
  ];

  const healthGoalOptions = [
    { value: 'Weight Management', icon: '⚖️' },
    { value: 'Muscle Gain', icon: '💪' },
    { value: 'Heart Health', icon: '❤️' },
    { value: 'Energy Boost', icon: '⚡' },
    { value: 'Better Sleep', icon: '😴' },
    { value: 'Improved Digestion', icon: '🥗' },
    { value: 'Stress Reduction', icon: '🧘' },
    { value: 'Athletic Performance', icon: '🏆' }
  ];

  const selectActivityLevel = (level) => {
    updateData({ activity_level: level });
  };

  const toggleHealthGoal = (goal) => {
    const currentGoals = data.health_goals || [];
    const updatedGoals = currentGoals.includes(goal)
      ? currentGoals.filter(g => g !== goal)
      : [...currentGoals, goal];
    updateData({ health_goals: updatedGoals });
  };

  return (
    <div className="onboarding-step">
      <h1 className="step-title">What's your activity level?</h1>
      <p className="step-subtitle">
        This helps us tailor your daily calorie and macro goals.
      </p>

      {/* Activity Level Selection */}
      <div className="activity-grid">
        {activityLevelOptions.map((activity) => (
          <div
            key={activity.value}
            className={`activity-card ${data.activity_level === activity.value ? 'selected' : ''}`}
            onClick={() => selectActivityLevel(activity.value)}
          >
            <div className="activity-icon">{activity.icon}</div>
            <div className="activity-name">{activity.name}</div>
            <div className="activity-description">{activity.description}</div>
          </div>
        ))}
      </div>

      {/* Health Goals */}
      <div className="form-section">
        <label className="section-label">What are your health goals?</label>
        <p className="section-hint">Select all that apply – we'll help you prioritize.</p>
        
        <div className="pill-container" style={{ marginTop: '12px' }}>
          {healthGoalOptions.map((goal) => (
            <button
              key={goal.value}
              type="button"
              className={`pill-toggle ${(data.health_goals || []).includes(goal.value) ? 'selected' : ''}`}
              onClick={() => toggleHealthGoal(goal.value)}
            >
              <span className="pill-icon">{goal.icon}</span>
              {goal.value}
            </button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="nav-buttons">
        <button type="button" className="btn-back" onClick={onBack}>
          ← Back
        </button>
        <button type="button" className="btn-next" onClick={onNext}>
          Next →
        </button>
      </div>
    </div>
  );
}