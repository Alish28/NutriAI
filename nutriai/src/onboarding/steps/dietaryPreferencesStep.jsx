//3
export default function DietaryPreferencesStep({ data, updateData, onNext, onBack }) {
  const dietaryOptions = [
    { value: 'Vegan', icon: '🌱' },
    { value: 'Vegetarian', icon: '🥕' },
    { value: 'Pescatarian', icon: '🐟' },
    { value: 'Keto', icon: '🥑' },
    { value: 'Paleo', icon: '🥩' },
    { value: 'Gluten-Free', icon: '🌾' },
    { value: 'Dairy-Free', icon: '🥛' },
    { value: 'Low-Carb', icon: '🍞' }
  ];

  const cuisineOptions = [
    { value: 'Italian', icon: '🍝' },
    { value: 'Mexican', icon: '🌮' },
    { value: 'Indian', icon: '🍛' },
    { value: 'Chinese', icon: '🥡' },
    { value: 'Japanese', icon: '🍱' },
    { value: 'Nepali', icon: '🍲' },
    { value: 'Mediterranean', icon: '🥗' },
    { value: 'Thai', icon: '🍜' }
  ];

  const toggleDietaryPreference = (preference) => {
    const currentPreferences = data.dietary_preferences || [];
    const updatedPreferences = currentPreferences.includes(preference)
      ? currentPreferences.filter(p => p !== preference)
      : [...currentPreferences, preference];
    updateData({ dietary_preferences: updatedPreferences });
  };

  const toggleCuisine = (cuisine) => {
    const currentCuisines = data.preferred_cuisines || [];
    const updatedCuisines = currentCuisines.includes(cuisine)
      ? currentCuisines.filter(c => c !== cuisine)
      : [...currentCuisines, cuisine];
    updateData({ preferred_cuisines: updatedCuisines });
  };

  const toggleLocalPriority = () => {
    updateData({ prioritize_local: !data.prioritize_local });
  };

  return (
    <div className="onboarding-step">
      <h1 className="step-title">Dietary Preferences</h1>
      <p className="step-subtitle">
        Help us recommend the right meals for you.
      </p>

      {/* Dietary Preferences */}
      <div className="form-section">
        <label className="section-label">Dietary Restrictions</label>
        <p className="section-hint">Select all that apply.</p>
        
        <div className="pill-container" style={{ marginTop: '12px' }}>
          {dietaryOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`pill-toggle ${(data.dietary_preferences || []).includes(option.value) ? 'selected' : ''}`}
              onClick={() => toggleDietaryPreference(option.value)}
            >
              <span className="pill-icon">{option.icon}</span>
              {option.value}
            </button>
          ))}
        </div>
      </div>

      {/* Allergies */}
      <div className="input-group">
        <label className="input-label">Allergies</label>
        <input
          type="text"
          className="input-field"
          placeholder="e.g., Nuts, Shellfish, Soy (comma-separated)"
          value={data.allergies}
          onChange={(e) => updateData({ allergies: e.target.value })}
        />
        <p className="section-hint">List any food allergies, separated by commas.</p>
      </div>

      {/* Preferred Cuisines */}
      <div className="form-section">
        <label className="section-label">Preferred Cuisines</label>
        <p className="section-hint">What types of food do you enjoy?</p>
        
        <div className="pill-container" style={{ marginTop: '12px' }}>
          {cuisineOptions.map((cuisine) => (
            <button
              key={cuisine.value}
              type="button"
              className={`pill-toggle ${(data.preferred_cuisines || []).includes(cuisine.value) ? 'selected' : ''}`}
              onClick={() => toggleCuisine(cuisine.value)}
            >
              <span className="pill-icon">{cuisine.icon}</span>
              {cuisine.value}
            </button>
          ))}
        </div>
      </div>

      {/* Local Priority Toggle */}
      <div className="toggle-list">
        <div className="toggle-item">
          <div className="toggle-info">
            <div className="toggle-title">Prioritize Local/Nepali Dishes</div>
            <div className="toggle-description">
              Feature traditional Nepali cuisine in your recommendations.
            </div>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={data.prioritize_local}
              onChange={toggleLocalPriority}
            />
            <span className="toggle-slider"></span>
          </label>
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