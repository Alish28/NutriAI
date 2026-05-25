export default function HomeCookingStep({ data, updateData, onNext, onBack }) {
  const servingOptions = [
    { value: 1, label: "1 person" },
    { value: 2, label: "2 people" },
    { value: 3, label: "3 people" },
    { value: 4, label: "4+ people" },
  ];

  return (
    <div className="onboarding-step">
      <h1 className="step-title">Home Cooking</h1>
      <p className="step-subtitle">
        Tell us your usual serving size for meal planning and homecook features.
      </p>

      <div className="form-section">
        <label className="section-label">Preferred Serving Size</label>
        <p className="section-hint">How many people do you usually cook or order for?</p>

        <div className="serving-grid" style={{ marginTop: "12px" }}>
          {servingOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`serving-option ${data.preferred_serving_size === option.value ? "selected" : ""}`}
              onClick={() => updateData({ preferred_serving_size: option.value })}
            >
              {option.label}
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