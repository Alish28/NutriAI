export default function AINotificationsStep({ data, updateData, onComplete, onBack }) {
  const nutritionFocusOptions = [
    "Balanced Macros",
    "High Protein",
    "Low Carb",
    "High Fiber",
    "Low Sugar",
    "Heart Healthy",
  ];

  const toggleNutritionFocus = (focusOption) => {
    const currentFocus = data.nutrition_focus || [];
    updateData({
      nutrition_focus: currentFocus.includes(focusOption)
        ? currentFocus.filter((item) => item !== focusOption)
        : [...currentFocus, focusOption],
    });
  };

  return (
    <div className="onboarding-step">
      <h1 className="step-title">Almost Done</h1>
      <p className="step-subtitle">
        Fine-tune how personalized your recommendations should feel.
      </p>

      <div className="range-container">
        <div className="range-label">
          <span className="range-label-text">AI Personalization Strength</span>
          <span className="range-value">{data.personalization_strength || 75}%</span>
        </div>
        <input
          type="range"
          className="range-slider"
          min="0"
          max="100"
          value={data.personalization_strength || 75}
          onChange={(e) => updateData({ personalization_strength: parseInt(e.target.value) })}
        />
        <p className="range-hint">Higher means recommendations lean more on your preferences.</p>
      </div>

      <div className="form-section">
        <label className="section-label">Nutrition Focus</label>
        <p className="section-hint">What should NutriAI prioritize when recommending meals?</p>

        <div className="pill-container" style={{ marginTop: "12px" }}>
          {nutritionFocusOptions.map((option) => (
            <button
              key={option}
              type="button"
              className={`pill-toggle ${(data.nutrition_focus || []).includes(option) ? "selected" : ""}`}
              onClick={() => toggleNutritionFocus(option)}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className="nav-buttons">
        <button type="button" className="btn-back" onClick={onBack}>Back</button>
        <button type="button" className="btn-complete" onClick={onComplete}>Complete Setup</button>
      </div>
    </div>
  );
}