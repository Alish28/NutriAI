// nutriai/src/components/HomecookApplication.jsx
// Component for users to apply to become a homecook

import { useState, useEffect } from 'react';
import { applyHomecook, getApplicationStatus } from '../services/api';
import './HomecookApplication.css';

export default function HomecookApplication({ onClose }) {
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    application_text: '',
    specialties: '',
    experience_years: 0,
    sample_dishes: '',
    certifications: ''
  });

  useEffect(() => {
    loadApplication();
  }, []);

  const loadApplication = async () => {
    try {
      setLoading(true);
      const res = await getApplicationStatus();
      setApplication(res.data.application);
    } catch (error) {
      console.error('Error loading application:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!formData.application_text.trim()) {
      setError('Please tell us why you want to become a homecook');
      return;
    }

    setSubmitting(true);

    try {
      const dataToSubmit = {
        application_text: formData.application_text,
        specialties: formData.specialties.split(',').map(s => s.trim()).filter(Boolean),
        experience_years: parseInt(formData.experience_years) || 0,
        sample_dishes: formData.sample_dishes.split(',').map(s => s.trim()).filter(Boolean),
        certifications: formData.certifications || null
      };

      await applyHomecook(dataToSubmit);
      alert('Application submitted successfully! Awaiting admin approval.');
      await loadApplication();
    } catch (err) {
      setError(err.message || 'Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { bg: '#fff4e1', color: '#c05621', label: '⏳ Pending Review' },
      approved: { bg: '#e4f7e9', color: '#166534', label: '✅ Approved' },
      rejected: { bg: '#ffe5e5', color: '#b91c1c', label: '❌ Rejected' }
    };
    const badge = badges[status] || badges.pending;
    
    return (
      <div style={{
        background: badge.bg,
        color: badge.color,
        padding: '12px 16px',
        borderRadius: '10px',
        fontWeight: '600',
        fontSize: '15px',
        textAlign: 'center',
        marginBottom: '16px'
      }}>
        {badge.label}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="homecook-app-card">
        <div className="homecook-app-header">
          <h2>Homecook Application</h2>
          {onClose && <button className="btn-close" onClick={onClose}>✕</button>}
        </div>
        <p>Loading...</p>
      </div>
    );
  }

  // If user already has an application
  if (application) {
    return (
      <div className="homecook-app-card">
        <div className="homecook-app-header">
          <h2>Homecook Application Status</h2>
          {onClose && <button className="btn-close" onClick={onClose}>✕</button>}
        </div>

        {getStatusBadge(application.status)}

        <div className="app-details">
          <div className="detail-row">
            <span className="detail-label">Applied on:</span>
            <span className="detail-value">
              {new Date(application.applied_at).toLocaleDateString()}
            </span>
          </div>

          {application.status === 'pending' && (
            <div className="info-box">
              <p>✨ Your application is under review by our team!</p>
              <p>We'll notify you once it's reviewed (usually within 1-2 business days).</p>
            </div>
          )}

          {application.status === 'approved' && (
            <div className="success-box">
              <p>🎉 Congratulations! You're now an approved homecook!</p>
              <p>You can now add your recipes and start selling homemade meals.</p>
              <button className="btn-primary" onClick={onClose}>
                Go to Dashboard →
              </button>
            </div>
          )}

          {application.status === 'rejected' && (
            <div className="error-box">
              <p><strong>Reason for rejection:</strong></p>
              <p>{application.rejection_reason || 'No reason provided'}</p>
              <p style={{marginTop: '12px', fontSize: '13px', color: '#666'}}>
                You can apply again after addressing the concerns mentioned above.
              </p>
            </div>
          )}

          <div className="detail-section">
            <h4>Your Application</h4>
            <div className="detail-row">
              <span className="detail-label">Why you want to be a homecook:</span>
              <p className="detail-text">{application.application_text}</p>
            </div>

            {application.specialties && application.specialties.length > 0 && (
              <div className="detail-row">
                <span className="detail-label">Specialties:</span>
                <div className="tag-list">
                  {application.specialties.map((s, i) => (
                    <span key={i} className="tag">{s}</span>
                  ))}
                </div>
              </div>
            )}

            {application.experience_years > 0 && (
              <div className="detail-row">
                <span className="detail-label">Experience:</span>
                <span className="detail-value">{application.experience_years} years</span>
              </div>
            )}

            {application.sample_dishes && application.sample_dishes.length > 0 && (
              <div className="detail-row">
                <span className="detail-label">Sample dishes:</span>
                <div className="tag-list">
                  {application.sample_dishes.map((d, i) => (
                    <span key={i} className="tag">{d}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Application form for new users
  return (
    <div className="homecook-app-card">
      <div className="homecook-app-header">
        <h2>Apply to Become a Homecook</h2>
        {onClose && <button className="btn-close" onClick={onClose}>✕</button>}
      </div>

      <div className="app-intro">
        <p>👨‍🍳 Share your culinary passion and earn by selling homemade meals!</p>
        <p>Join our community of home chefs and reach food lovers in your area.</p>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Why do you want to become a homecook? *</label>
          <textarea
            value={formData.application_text}
            onChange={(e) => setFormData({...formData, application_text: e.target.value})}
            required
            rows="5"
            placeholder="Tell us about your cooking experience, passion, and what makes your food special..."
          />
          <span className="hint">Minimum 50 characters</span>
        </div>

        <div className="form-group">
          <label>Your Specialties</label>
          <input
            type="text"
            value={formData.specialties}
            onChange={(e) => setFormData({...formData, specialties: e.target.value})}
            placeholder="e.g., Nepali Cuisine, Italian, Baking, Vegan Meals"
          />
          <span className="hint">Separate with commas</span>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Years of Cooking Experience</label>
            <input
              type="number"
              value={formData.experience_years}
              onChange={(e) => setFormData({...formData, experience_years: e.target.value})}
              min="0"
              max="50"
              placeholder="0"
            />
          </div>

          <div className="form-group">
            <label>Sample Dishes</label>
            <input
              type="text"
              value={formData.sample_dishes}
              onChange={(e) => setFormData({...formData, sample_dishes: e.target.value})}
              placeholder="e.g., Dal Bhat, Momos, Biryani"
            />
          </div>
        </div>

        <div className="form-group">
          <label>Certifications (Optional)</label>
          <textarea
            value={formData.certifications}
            onChange={(e) => setFormData({...formData, certifications: e.target.value})}
            rows="2"
            placeholder="Any food safety certifications, culinary training, or relevant qualifications..."
          />
        </div>

        <div className="requirements-box">
          <h4>📋 Requirements:</h4>
          <ul>
            <li>✓ Must be 18+ years old</li>
            <li>✓ Follow food safety guidelines</li>
            <li>✓ Provide quality, fresh meals</li>
            <li>✓ Respond to orders within 24 hours</li>
          </ul>
        </div>

        <div className="form-actions">
          {onClose && (
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
          )}
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit Application'}
          </button>
        </div>
      </form>
    </div>
  );
}