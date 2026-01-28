//7
export default function CompletionStep({ onGoToDashboard }) {
  return (
    <div className="onboarding-step">
      <div className="completion-container">
        <div className="completion-icon">🎉</div>
        <h1 className="completion-title">You're all set!</h1>
        <p className="completion-subtitle">
          Your personalized NutriAI experience awaits
        </p>

        <div className="completion-list">
          <div className="completion-item">
            <span className="completion-check">✓</span>
            <span>Profile complete</span>
          </div>
          <div className="completion-item">
            <span className="completion-check">✓</span>
            <span>Preferences saved</span>
          </div>
          <div className="completion-item">
            <span className="completion-check">✓</span>
            <span>AI personalization ready</span>
          </div>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px', color: '#111' }}>
            What's next?
          </h3>
          <div style={{ fontSize: '15px', color: '#777', lineHeight: '1.8' }}>
            <div>🍽️ Start logging meals</div>
            <div>📊 Track your nutrition</div>
            <div>🎯 Achieve your goals</div>
          </div>
        </div>

        <button 
          type="button" 
          className="btn-dashboard"
          onClick={onGoToDashboard}
        >
          Go to Dashboard →
        </button>
      </div>
    </div>
  );
}