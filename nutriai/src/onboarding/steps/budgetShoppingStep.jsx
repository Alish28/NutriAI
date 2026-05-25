export default function BudgetShoppingStep({ data, updateData, onNext, onBack }) {
  const shoppingStyleOptions = [
    { value: "Budget-conscious", title: "Budget-conscious", description: "Save money and plan around affordable meals." },
    { value: "Organic Focus", title: "Organic Focus", description: "Prioritize higher quality ingredients when possible." },
    { value: "Convenience First", title: "Convenience First", description: "Prefer quick, simple, practical meals." },
  ];

  const handleDailyBudgetChange = (e) => {
    const dailyValue = parseInt(e.target.value) || 400;
    updateData({
      daily_budget: dailyValue,
      weekly_budget: dailyValue * 7,
    });
  };

  return (
    <div className="onboarding-step">
      <h1 className="step-title">Let's Talk Budget</h1>
      <p className="step-subtitle">Help us recommend meals that fit your daily budget.</p>

      <div className="range-container">
        <div className="range-label">
          <span className="range-label-text">Daily Food Budget</span>
          <span className="range-value">NPR {data.daily_budget || 400}</span>
        </div>
        <input
          type="range"
          className="range-slider"
          min="200"
          max="1000"
          value={data.daily_budget || 400}
          onChange={handleDailyBudgetChange}
        />
        <p className="range-hint">
          Weekly estimate: NPR {(data.daily_budget || 400) * 7}
        </p>
      </div>

      <div className="form-section">
        <label className="section-label">Shopping Style</label>
        <p className="section-hint">How do you usually choose food?</p>

        <div className="activity-grid" style={{ marginTop: "12px" }}>
          {shoppingStyleOptions.map((style) => (
            <button
              key={style.value}
              type="button"
              className={`activity-card ${data.shopping_style === style.value ? "selected" : ""}`}
              onClick={() => updateData({ shopping_style: style.value })}
            >
              <div className="activity-name">{style.title}</div>
              <div className="activity-description">{style.description}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="nav-buttons">
        <button type="button" className="btn-back" onClick={onBack}>Back</button>
        <button type="button" className="btn-next" onClick={onNext}>Next</button>
      </div>
    </div>
  );
}