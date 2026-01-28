//1
export default function BasicInfoStep({ data, updateData, onNext, onSkip }) {
  const selectGender = (selectedGender) => {
    updateData({ gender: selectedGender });
  };

  const handleContinue = () => {
    if (!data.age || !data.gender) {
      alert('Please enter your age and select your gender to continue.');
      return;
    }
    onNext();
  };

  return (
    <div className="onboarding-step">
      <div className="step-icon">❤️</div>
      <h1 className="step-title">Welcome to NutriAI!</h1>
      <p className="step-subtitle">
        Let's get started with some basic information to tailor your experience.
      </p>

      {/* Age Input */}
      <div className="input-group">
        <label className="input-label">
          Age <span style={{ color: '#ef4444' }}>*</span>
        </label>
        <input
          type="number"
          className="input-field"
          placeholder="e.g., 25"
          value={data.age}
          onChange={(e) => updateData({ age: e.target.value })}
          min="1"
          max="120"
        />
        <p className="section-hint">Your current age in years.</p>
      </div>

      {/* Gender Selection */}
      <div className="form-section">
        <label className="section-label">
          Gender <span style={{ color: '#ef4444' }}>*</span>
        </label>
        <p className="section-hint">This helps us personalize nutritional recommendations.</p>
        <div className="gender-grid" style={{ marginTop: '12px' }}>
          <button
            type="button"
            className={`gender-option ${data.gender === 'Male' ? 'selected' : ''}`}
            onClick={() => selectGender('Male')}
          >
            Male
          </button>
          <button
            type="button"
            className={`gender-option ${data.gender === 'Female' ? 'selected' : ''}`}
            onClick={() => selectGender('Female')}
          >
            Female
          </button>
          <button
            type="button"
            className={`gender-option ${data.gender === 'Non-binary' ? 'selected' : ''}`}
            onClick={() => selectGender('Non-binary')}
          >
            Non-binary
          </button>
          <button
            type="button"
            className={`gender-option ${data.gender === 'Prefer not to say' ? 'selected' : ''}`}
            onClick={() => selectGender('Prefer not to say')}
          >
            Prefer not to say
          </button>
        </div>
      </div>

      {/* Height and Weight */}
      <div className="input-grid">
        <div className="input-group">
          <label className="input-label">Height</label>
          <input
            type="number"
            className="input-field"
            placeholder="170"
            value={data.height}
            onChange={(e) => updateData({ height: e.target.value })}
            step="0.1"
          />
          <p className="section-hint">Your height in centimeters.</p>
        </div>

        <div className="input-group">
          <label className="input-label">Weight</label>
          <input
            type="number"
            className="input-field"
            placeholder="70"
            value={data.weight}
            onChange={(e) => updateData({ weight: e.target.value })}
            step="0.1"
          />
          <p className="section-hint">Your current weight in kilograms.</p>
        </div>
      </div>

      {/* Navigation */}
      <div className="nav-buttons">
        <button type="button" className="btn-skip" onClick={onSkip}>
          Skip for now
        </button>
        <button type="button" className="btn-next" onClick={handleContinue}>
          Next →
        </button>
      </div>
    </div>
  );
}