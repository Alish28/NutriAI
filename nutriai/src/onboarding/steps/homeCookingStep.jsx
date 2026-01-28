//5
export default function HomeCookingStep({ data, updateData, onNext, onBack }) {
  const servingSizeOptions = [
    { value: 1, label: '1 person' },
    { value: 2, label: '2 people' },
    { value: 3, label: '3 people' },
    { value: 4, label: '4+ people' }
  ];

  const selectServingSize = (size) => {
    updateData({ preferred_serving_size: size });
  };

  const toggleCookingFeature = (featureName) => {
    updateData({ [featureName]: !data[featureName] });
  };

  return (
    <div className="onboarding-step">
      <h1 className="step-title">Home Cooking Preferences</h1>
      <p className="step-subtitle">
        Tailor your meal plans to fit your home cooking style and maximize efficiency.
      </p>

      {/* Serving Size */}
      <div className="form-section">
        <label className="section-label">Preferred Serving Size</label>
        <p className="section-hint">How many people do you typically cook for?</p>
        
        <div className="serving-grid" style={{ marginTop: '12px' }}>
          {servingSizeOptions.map((size) => (
            <button
              key={size.value}
              type="button"
              className={`serving-option ${data.preferred_serving_size === size.value ? 'selected' : ''}`}
              onClick={() => selectServingSize(size.value)}
            >
              {size.label}
            </button>
          ))}
        </div>
      </div>

      {/* Smart Features */}
      <div className="form-section">
        <label className="section-label">Smart Features for Effortless Cooking</label>
        <p className="section-hint">Enable these features to personalize your meal planning experience.</p>
        
        <div className="toggle-list" style={{ marginTop: '12px' }}>
          <div className="toggle-item">
            <div className="toggle-info">
              <div className="toggle-title">Pantry Tracking</div>
              <div className="toggle-description">
                Keep your pantry organized and get suggestions based on what you have.
              </div>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={data.pantry_tracking}
                onChange={() => toggleCookingFeature('pantry_tracking')}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="toggle-item">
            <div className="toggle-info">
              <div className="toggle-title">Leftover Alerts</div>
              <div className="toggle-description">
                Get smart reminders for using up leftovers before they go bad.
              </div>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={data.leftover_alerts}
                onChange={() => toggleCookingFeature('leftover_alerts')}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="toggle-item">
            <div className="toggle-info">
              <div className="toggle-title">Expiry Notifications</div>
              <div className="toggle-description">
                Receive alerts for ingredients nearing their expiry date.
              </div>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={data.expiry_notifications}
                onChange={() => toggleCookingFeature('expiry_notifications')}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="toggle-item">
            <div className="toggle-info">
              <div className="toggle-title">Marketplace Access</div>
              <div className="toggle-description">
                Connect with local stores for ingredient delivery and deals.
              </div>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={data.marketplace_access}
                onChange={() => toggleCookingFeature('marketplace_access')}
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
        <button type="button" className="btn-next" onClick={onNext}>
          Next →
        </button>
      </div>
    </div>
  );
}