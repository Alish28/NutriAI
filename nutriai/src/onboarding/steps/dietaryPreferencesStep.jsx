export default function DietaryPreferencesStep({ data, updateData, onNext, onBack }) {
  const dietaryOptions = ["Vegan", "Vegetarian", "Pescatarian", "Keto", "Gluten-Free", "Dairy-Free", "Low-Carb"];
  const cuisineOptions = ["Nepali", "Indian", "Chinese", "Japanese", "Italian", "Mexican", "Mediterranean", "Thai"];

  const toggleArrayValue = (field, value) => {
    const current = data[field] || [];
    updateData({
      [field]: current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    });
  };

  return (
    <div className="onboarding-step">
      <h1 className="step-title">Dietary Preferences</h1>
      <p className="step-subtitle">Help us recommend meals that fit your diet and taste.</p>

      <div className="form-section">
        <label className="section-label">Dietary Restrictions</label>
        <div className="pill-container" style={{ marginTop: "12px" }}>
          {dietaryOptions.map((option) => (
            <button
              key={option}
              type="button"
              className={`pill-toggle ${(data.dietary_preferences || []).includes(option) ? "selected" : ""}`}
              onClick={() => toggleArrayValue("dietary_preferences", option)}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className="input-group">
        <label className="input-label">Allergies</label>
        <input
          type="text"
          className="input-field"
          placeholder="e.g., nuts, milk, eggs"
          value={data.allergies || ""}
          onChange={(e) => updateData({ allergies: e.target.value })}
        />
        <p className="section-hint">Separate allergies with commas.</p>
      </div>

      <div className="form-section">
        <label className="section-label">Preferred Cuisines</label>
        <div className="pill-container" style={{ marginTop: "12px" }}>
          {cuisineOptions.map((cuisine) => (
            <button
              key={cuisine}
              type="button"
              className={`pill-toggle ${(data.preferred_cuisines || []).includes(cuisine) ? "selected" : ""}`}
              onClick={() => toggleArrayValue("preferred_cuisines", cuisine)}
            >
              {cuisine}
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