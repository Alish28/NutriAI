//6
export default function AINotificationsStep({ data, updateData, onComplete, onBack }) {
  const nutritionFocusOptions = [
    { value: 'Balanced Macros', icon: '⚖️' },
    { value: 'High Protein', icon: '🥩' },
    { value: 'Low Carb', icon: '🥑' },
    { value: 'High Fiber', icon: '🥦' },
    { value: 'Low Sugar', icon: '🍬' },
    { value: 'Heart Healthy', icon: '❤️' }
  ];

  const toggleNutritionFocus = (focusOption) => {
    const currentFocus = data.nutrition_focus || [];
    const updatedFocus = currentFocus.includes(focusOption)
      ? currentFocus.filter(f => f !== focusOption)
      : [...currentFocus, focusOption];
    updateData({ nutrition_focus: updatedFocus });
  };

  const toggleAIFeature = (featureName) => {
    updateData({ [featureName]: !data[featureName] });
  };

  const handlePersonalizationChange = (e) => {
    updateData({ personalization_strength: parseInt(e.target.value) });
  };

  return (
    <div className="onboarding-step">
      <h1 className="step-title">Almost done! 🎉</h1>
      <p className="step-subtitle">
        Fine-tune your AI assistant for the best experience.
      </p>

      {/* Personalization Strength */}
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
          onChange={handlePersonalizationChange}
        />
        <p className="range-hint">Higher = More tailored recommendations based on your habits</p>
      </div>

      {/* Nutrition Focus */}
      <div className="form-section">
        <label className="section-label">Nutrition Focus</label>
        <p className="section-hint">What nutritional aspects are most important to you?</p>
        
        <div className="pill-container" style={{ marginTop: '12px' }}>
          {nutritionFocusOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`pill-toggle ${(data.nutrition_focus || []).includes(option.value) ? 'selected' : ''}`}
              onClick={() => toggleNutritionFocus(option.value)}
            >
              <span className="pill-icon">{option.icon}</span>
              {option.value}
            </button>
          ))}
        </div>
      </div>

      {/* AI & Notification Settings */}
      <div className="form-section">
        <label className="section-label">Preferences & Privacy</label>
        
        <div className="toggle-list" style={{ marginTop: '12px' }}>
          <div className="toggle-item">
            <div className="toggle-info">
              <div className="toggle-title">AI Auto-adjust Meal Plans</div>
              <div className="toggle-description">
                Let AI automatically adjust meal plans based on your eating habits.
              </div>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={data.ai_auto_adjust}
                onChange={() => toggleAIFeature('ai_auto_adjust')}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="toggle-item">
            <div className="toggle-info">
              <div className="toggle-title">Email Notifications</div>
              <div className="toggle-description">
                Receive meal reminders, expiry alerts, and updates via email.
              </div>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={data.email_notifications}
                onChange={() => toggleAIFeature('email_notifications')}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="toggle-item">
            <div className="toggle-info">
              <div className="toggle-title">SMS Notifications</div>
              <div className="toggle-description">
                Get urgent alerts via text message (urgent expiry warnings only).
              </div>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={data.sms_notifications}
                onChange={() => toggleAIFeature('sms_notifications')}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="toggle-item">
            <div className="toggle-info">
              <div className="toggle-title">Allow Data Sharing</div>
              <div className="toggle-description">
                Help improve NutriAI with anonymous usage data (fully anonymized).
              </div>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={data.data_sharing}
                onChange={() => toggleAIFeature('data_sharing')}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="nav-buttons">
        <button type="button" className="btn-back" onClick={onBack}>
          ← Back
        </button>
        <button type="button" className="btn-complete" onClick={onComplete}>
          Complete Setup ✓
        </button>
      </div>
    </div>
  );
}