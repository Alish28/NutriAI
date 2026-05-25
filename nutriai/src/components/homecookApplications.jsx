import { useState, useEffect } from 'react';
import { applyHomecook, getApplicationStatus } from '../services/api';
import './homecookApplication.css';

export default function HomecookApplication({ onClose }) {
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    application_text: '',
    phone_number: '',
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

  const isValidNepalPhone = (phone) => {
    const cleaned = phone.replace(/\s|-/g, '');
    return /^(\+977)?9[78]\d{8}$/.test(cleaned);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.phone_number.trim()) {
      setError('Please provide your phone number');
      return;
    }

    if (!isValidNepalPhone(formData.phone_number)) {
      setError('Please enter a valid Nepali phone number');
      return;
    }

    if (!formData.application_text.trim()) {
      setError('Please tell us why you want to become a homecook');
      return;
    }

    setSubmitting(true);

    try {
      const dataToSubmit = {
        application_text: formData.application_text.trim(),
        phone_number: formData.phone_number.trim(),
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
      pending: { bg: '#fff4e1', color: '#c05621', label: 'Pending Review' },
      approved: { bg: '#e4f7e9', color: '#166534', label: 'Approved' },
      rejected: { bg: '#ffe5e5', color: '#b91c1c', label: 'Rejected' }
    };

    const badge = badges[status] || badges.pending;

    return (
      <div
        style={{
          background: badge.bg,
          color: badge.color,
          padding: '12px 16px',
          borderRadius: '10px',
          fontWeight: '600',
          fontSize: '15px',
          textAlign: 'center',
          marginBottom: '16px'
        }}
      >
        {badge.label}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="homecook-app-card">
        <div className="homecook-app-header">
          <h2>Homecook Application</h2>
          {onClose && <button className="btn-close" onClick={onClose}>x</button>}
        </div>
        <p>Loading...</p>
      </div>
    );
  }

  if (application) {
    return (
      <div className="homecook-app-card">
        <div className="homecook-app-header">
          <h2>Homecook Application Status</h2>
          {onClose && <button className="btn-close" onClick={onClose}>x</button>}
        </div>

        {getStatusBadge(application.status)}

        <div className="app-details">
          <div className="detail-row">
            <span className="detail-label">Applied on:</span>
            <span className="detail-value">
              {application.applied_at
                ? new Date(application.applied_at).toLocaleDateString()
                : 'Not available'}
            </span>
          </div>

          <div className="detail-row">
            <span className="detail-label">Phone number:</span>
            <span className="detail-value">
              {application.phone_number || 'Not provided'}
            </span>
          </div>

          <div className="detail-row">
            <span className="detail-label">Phone verification:</span>
            <span className="detail-value">
              {application.phone_verified ? 'Verified by admin' : 'Pending admin verification'}
            </span>
          </div>

          {application.status === 'pending' && (
            <div className="info-box">
              <p>Your application is under review by our team.</p>
              <p>Your phone number will be manually verified when an admin approves your application.</p>
            </div>
          )}

          {application.status === 'approved' && (
            <div className="success-box">
              <p>Congratulations! You are now an approved homecook.</p>
              <p>You can now add recipes and start selling homemade meals.</p>
              <button className="btn-primary" onClick={onClose}>
                Go to Dashboard
              </button>
            </div>
          )}

          {application.status === 'rejected' && (
            <div className="error-box">
              <p><strong>Reason for rejection:</strong></p>
              <p>{application.rejection_reason || 'No reason provided'}</p>
              <p style={{ marginTop: '12px', fontSize: '13px', color: '#666' }}>
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

  return (
    <div className="homecook-app-card">
      <div className="homecook-app-header">
        <h2>Apply to Become a Homecook</h2>
        {onClose && <button className="btn-close" onClick={onClose}>x</button>}
      </div>

      <div className="app-intro">
        <p>Share your cooking and earn by selling homemade meals.</p>
        <p>Phone numbers are used only for pickup and order coordination.</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Phone Number *</label>
          <input
            type="tel"
            value={formData.phone_number}
            onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
            required
            placeholder="98XXXXXXXX or +97798XXXXXXXX"
          />
          <span className="hint">
            Your number will be manually verified by admin after application review.
          </span>
        </div>

        <div className="form-group">
          <label>Why do you want to become a homecook? *</label>
          <textarea
            value={formData.application_text}
            onChange={(e) => setFormData({ ...formData, application_text: e.target.value })}
            required
            rows="5"
            placeholder="Tell us about your cooking experience, passion, and what makes your food special..."
          />
          <span className="hint">Minimum 50 characters recommended</span>
        </div>

        <div className="form-group">
          <label>Your Specialties</label>
          <input
            type="text"
            value={formData.specialties}
            onChange={(e) => setFormData({ ...formData, specialties: e.target.value })}
            placeholder="e.g., Nepali Cuisine, Baking, Vegan Meals"
          />
          <span className="hint">Separate with commas</span>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Years of Cooking Experience</label>
            <input
              type="number"
              value={formData.experience_years}
              onChange={(e) => setFormData({ ...formData, experience_years: e.target.value })}
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
              onChange={(e) => setFormData({ ...formData, sample_dishes: e.target.value })}
              placeholder="e.g., Dal Bhat, Momos, Biryani"
            />
          </div>
        </div>

        <div className="form-group">
          <label>Certifications (Optional)</label>
          <textarea
            value={formData.certifications}
            onChange={(e) => setFormData({ ...formData, certifications: e.target.value })}
            rows="2"
            placeholder="Any food safety certifications, culinary training, or relevant qualifications..."
          />
        </div>

        <div className="requirements-box">
          <h4>Requirements:</h4>
          <ul>
            <li>Must be 18+ years old</li>
            <li>Follow food safety guidelines</li>
            <li>Provide quality, fresh meals</li>
            <li>Respond to orders within 24 hours</li>
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