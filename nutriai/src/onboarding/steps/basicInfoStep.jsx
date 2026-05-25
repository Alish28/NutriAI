export default function BasicInfoStep({ data, updateData, onNext }) {
  const selectGender = (selectedGender) => {
    updateData({ gender: selectedGender });
  };

  const isValidNepalPhone = (phone) => {
    const cleaned = String(phone || '').replace(/\s|-/g, '');
    return /^(\+977)?9[78]\d{8}$/.test(cleaned);
  };

  const handleContinue = () => {
    if (!data.age || !data.gender || !data.phone_number) {
      alert('Please enter your age, gender, and phone number to continue.');
      return;
    }

    if (!isValidNepalPhone(data.phone_number)) {
      alert('Please enter a valid Nepali phone number.');
      return;
    }

    onNext();
  };

  return (
    <div className="onboarding-step">
      <div className="step-icon">♥</div>
      <h1 className="step-title">Welcome to NutriAI!</h1>
      <p className="step-subtitle">
        Let&apos;s get started with some basic information to tailor your experience.
      </p>

      <div className="input-group">
        <label className="input-label">
          Phone Number <span style={{ color: '#ef4444' }}>*</span>
        </label>
        <input
          type="tel"
          className="input-field"
          placeholder="98XXXXXXXX or +97798XXXXXXXX"
          value={data.phone_number || ''}
          onChange={(e) => updateData({ phone_number: e.target.value })}
        />
        <p className="section-hint">
          Used only for pickup and order coordination. Admin can verify it later.
        </p>
      </div>

      <div className="input-group">
        <label className="input-label">
          Age <span style={{ color: '#ef4444' }}>*</span>
        </label>
        <input
          type="number"
          className="input-field"
          placeholder="e.g., 25"
          value={data.age || ''}
          onChange={(e) => updateData({ age: e.target.value })}
          min="1"
          max="120"
        />
        <p className="section-hint">Your current age in years.</p>
      </div>

      <div className="form-section">
        <label className="section-label">
          Gender <span style={{ color: '#ef4444' }}>*</span>
        </label>
        <p className="section-hint">
          This helps us personalize nutritional recommendations.
        </p>

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

      <div className="input-grid">
        <div className="input-group">
          <label className="input-label">Height</label>
          <input
            type="number"
            className="input-field"
            placeholder="170"
            value={data.height || ''}
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
            value={data.weight || ''}
            onChange={(e) => updateData({ weight: e.target.value })}
            step="0.1"
          />
          <p className="section-hint">Your current weight in kilograms.</p>
        </div>
      </div>

      <div className="nav-buttons nav-buttons-right">
        <button type="button" className="btn-next" onClick={handleContinue}>
          Next
        </button>
      </div>
    </div>
  );
}