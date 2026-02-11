//4
export default function BudgetShoppingStep({ data, updateData, onNext, onBack }) {
  const shoppingStyleOptions = [
    {
      value: 'Budget-conscious',
      icon: '💰',
      title: 'Budget-conscious',
      description: 'Save money, buy what\'s on sale'
    },
    {
      value: 'Organic Focus',
      icon: '🌱',
      title: 'Organic Focus',
      description: 'Prioritize organic and quality ingredients'
    },
    {
      value: 'Convenience First',
      icon: '⚡',
      title: 'Convenience First',
      description: 'Quick and easy, ready-made options'
    }
  ];

  const handleDailyBudgetChange = (e) => {
    const dailyValue = parseFloat(e.target.value);
    updateData({ 
      daily_budget: dailyValue,
      weekly_budget: dailyValue * 7
    });
  };

  const handleWeeklyBudgetChange = (e) => {
    const weeklyValue = parseFloat(e.target.value);
    updateData({ 
      weekly_budget: weeklyValue,
      daily_budget: Math.round(weeklyValue / 7)
    });
  };

  const selectShoppingStyle = (style) => {
    updateData({ shopping_style: style });
  };

  return (
    <div className="onboarding-step">
      <h1 className="step-title">Let's talk budget</h1>
      <p className="step-subtitle">
        Help us find meals that fit your budget.
      </p>

      {/* Daily Budget */}
      <div className="range-container">
        <div className="range-label">
          <span className="range-label-text">Daily Food Budget</span>
          <span className="range-value">NPR {data.daily_budget || 25}</span>
        </div>
        <input
          type="range"
          className="range-slider"
          min="200"
          max="1000"
          value={data.daily_budget || 200}
          onChange={handleDailyBudgetChange}
        />
        <p className="range-hint">Average is NPR200-400/day</p>
      </div>

      {/* Weekly Budget */}
      <div className="range-container">
        <div className="range-label">
          <span className="range-label-text">Weekly Food Budget</span>
          <span className="range-value">NPR {data.weekly_budget || 4000}</span>
        </div>
        <input
          type="range"
          className="range-slider"
          min="1500"
          max="4000"
          value={data.weekly_budget || 1500}
          onChange={handleWeeklyBudgetChange}
        />
        <p className="range-hint">Automatically calculated based on daily budget</p>
      </div>

      {/* Shopping Style */}
      <div className="form-section">
        <label className="section-label">Shopping Style</label>
        <p className="section-hint">How do you prefer to shop for groceries?</p>
        
        <div className="activity-grid" style={{ marginTop: '12px' }}>
          {shoppingStyleOptions.map((style) => (
            <div
              key={style.value}
              className={`activity-card ${data.shopping_style === style.value ? 'selected' : ''}`}
              onClick={() => selectShoppingStyle(style.value)}
              style={{ cursor: 'pointer' }}
            >
              <div className="activity-icon">{style.icon}</div>
              <div className="activity-name">{style.title}</div>
              <div className="activity-description">{style.description}</div>
            </div>
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