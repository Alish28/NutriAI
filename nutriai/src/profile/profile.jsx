import { useState, useEffect } from "react";
import {
  getFullProfile,
  updateProfile,
  updatePassword,
  exportUserData,
  deleteAccount,
  logout
} from "../services/api";
import "./profile.css";

export default function Profile({ onBack, onLogout }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Password change state
  const [passwordModal, setPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  // Form state
  const [formData, setFormData] = useState({
    full_name: "",
    age: "",
    gender: "",
    weight: "",
    height: "",
    activity_level: "",
    health_goals: [],
    dietary_preferences: [],
    allergies: "",
    preferred_cuisines: [],
    prioritize_local: false,
    daily_budget: "",
    weekly_budget: "",
    shopping_style: "",
    pantry_tracking: true,
    leftover_alerts: true,
    expiry_notifications: true,
    preferred_serving_size: 2,
    marketplace_access: false,
    personalization_strength: 75,
    nutrition_focus: [],
    ai_auto_adjust: true,
    email_notifications: true,
    sms_notifications: false,
    data_sharing: false
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await getFullProfile();
      const userData = response.data.user;
      setProfile(userData);
      
      // Populate form with existing data
      setFormData({
        full_name: userData.full_name || "",
        age: userData.age || "",
        gender: userData.gender || "",
        weight: userData.weight || "",
        height: userData.height || "",
        activity_level: userData.activity_level || "",
        health_goals: userData.health_goals || [],
        dietary_preferences: userData.dietary_preferences || [],
        allergies: Array.isArray(userData.allergies) ? userData.allergies.join(", ") : "",
        preferred_cuisines: userData.preferred_cuisines || [],
        prioritize_local: userData.prioritize_local || false,
        daily_budget: userData.daily_budget || "",
        weekly_budget: userData.weekly_budget || "",
        shopping_style: userData.shopping_style || "",
        pantry_tracking: userData.pantry_tracking !== false,
        leftover_alerts: userData.leftover_alerts !== false,
        expiry_notifications: userData.expiry_notifications !== false,
        preferred_serving_size: userData.preferred_serving_size || 2,
        marketplace_access: userData.marketplace_access || false,
        personalization_strength: userData.personalization_strength || 75,
        nutrition_focus: userData.nutrition_focus || [],
        ai_auto_adjust: userData.ai_auto_adjust !== false,
        email_notifications: userData.email_notifications !== false,
        sms_notifications: userData.sms_notifications || false,
        data_sharing: userData.data_sharing || false
      });
    } catch (err) {
      setError(err.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const toggleArrayItem = (arrayName, item) => {
    setFormData(prev => ({
      ...prev,
      [arrayName]: prev[arrayName].includes(item)
        ? prev[arrayName].filter(i => i !== item)
        : [...prev[arrayName], item]
    }));
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      // Convert allergies string to array
      const dataToSend = {
        ...formData,
        allergies: formData.allergies ? formData.allergies.split(",").map(s => s.trim()) : []
      };

      const response = await updateProfile(dataToSend);
      
      // Update localStorage user data
      const currentUser = JSON.parse(localStorage.getItem('user'));
      localStorage.setItem('user', JSON.stringify({
        ...currentUser,
        full_name: response.data.user.full_name,
        email: response.data.user.email
      }));

      setSuccess("Profile updated successfully!");
      await loadProfile();
      
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    try {
      await updatePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      setSuccess("Password updated successfully!");
      setPasswordModal(false);
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message || "Failed to update password");
    }
  };

  const handleExportData = async () => {
    try {
      const response = await exportUserData();
      const dataStr = JSON.stringify(response.data, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `nutriai-data-${new Date().toISOString()}.json`;
      link.click();
      
      setSuccess("Data exported successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message || "Failed to export data");
    }
  };

  const handleDeleteAccount = async () => {
    const password = prompt("Enter your password to confirm account deletion:");
    if (!password) return;

    const confirmed = window.confirm(
      "Are you absolutely sure? This action cannot be undone and all your data will be permanently deleted."
    );
    
    if (!confirmed) return;

    try {
      await deleteAccount(password);
      logout();
      if (onLogout) onLogout();
    } catch (err) {
      setError(err.message || "Failed to delete account");
    }
  };

  if (loading) {
    return (
      <div className="profile-page">
        <header className="profile-header">
          <div className="profile-logo">NutriAI</div>
        </header>
        <main className="profile-main">
          <p>Loading profile...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <header className="profile-header">
        <div className="profile-logo">NutriAI</div>
        <div className="profile-header-right">
          <button className="btn-outline back-btn" onClick={onBack}>
            ← Back to Dashboard
          </button>
        </div>
      </header>

      <main className="profile-main">
        <h1 className="profile-title">User Profile & Customization</h1>

        {error && (
          <div style={{
            padding: '12px',
            backgroundColor: '#fee',
            color: '#c00',
            borderRadius: '8px',
            marginBottom: '16px'
          }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{
            padding: '12px',
            backgroundColor: '#e0ffe9',
            color: '#15803d',
            borderRadius: '8px',
            marginBottom: '16px'
          }}>
            {success}
          </div>
        )}

        <div className="profile-grid">
          {/* Profile overview */}
          <section className="p-card">
            <div className="p-card-header">
              <h3>Profile Overview</h3>
            </div>
            <div className="p-card-body profile-overview">
              <div className="profile-avatar">
                <img
                  src={profile?.profile_image_url || "https://via.placeholder.com/80"}
                  alt="User"
                />
              </div>
              <h2>{profile?.full_name || "User"}</h2>
              <p className="muted">{profile?.email}</p>
              <span className="badge premium">
                {profile?.role === 'admin' ? 'Admin' : 'Premium Member'}
              </span>
            </div>
          </section>

          {/* Personal information */}
          <section className="p-card">
            <div className="p-card-header">
              <h3>Personal Information</h3>
            </div>
            <div className="p-card-body p-form-2col">
              <div className="field">
                <label>Full Name</label>
                <input
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                />
              </div>
              <div className="field">
                <label>Age</label>
                <input
                  name="age"
                  type="number"
                  value={formData.age}
                  onChange={handleInputChange}
                />
              </div>
              <div className="field">
                <label>Gender</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                >
                  <option value="">Select...</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="field">
                <label>Weight (kg)</label>
                <input
                  name="weight"
                  type="number"
                  step="0.1"
                  value={formData.weight}
                  onChange={handleInputChange}
                />
              </div>
              <div className="field">
                <label>Height (cm)</label>
                <input
                  name="height"
                  type="number"
                  step="0.1"
                  value={formData.height}
                  onChange={handleInputChange}
                />
              </div>
              <div className="field">
                <label>Activity Level</label>
                <select
                  name="activity_level"
                  value={formData.activity_level}
                  onChange={handleInputChange}
                >
                  <option value="">Select...</option>
                  <option value="Sedentary">Sedentary</option>
                  <option value="Light">Light</option>
                  <option value="Moderate">Moderate</option>
                  <option value="Active">Active</option>
                </select>
              </div>
              <div className="field field-full">
                <label>Health Goals</label>
                <div className="pill-row">
                  {["Weight Management", "Muscle Gain", "Heart Health", "Energy Boost"].map(goal => (
                    <span
                      key={goal}
                      className={`pill pill-toggle ${formData.health_goals.includes(goal) ? "pill-selected" : ""}`}
                      onClick={() => toggleArrayItem("health_goals", goal)}
                    >
                      {goal}
                    </span>
                  ))}
                </div>
              </div>
              <div className="form-actions">
                <button className="btn-outline" onClick={loadProfile}>Cancel</button>
                <button className="btn-primary" onClick={handleSaveProfile} disabled={saving}>
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </section>

          {/* Dietary preferences */}
          <section className="p-card">
            <div className="p-card-header">
              <h3>Dietary Preferences & Restrictions</h3>
            </div>
            <div className="p-card-body">
              <div className="pill-row">
                {["Vegan", "Vegetarian", "Gluten-Free", "Dairy-Free", "Keto", "Paleo"].map(pref => (
                  <span
                    key={pref}
                    className={`pill pill-toggle ${formData.dietary_preferences.includes(pref) ? "on" : ""}`}
                    onClick={() => toggleArrayItem("dietary_preferences", pref)}
                  >
                    {pref}
                  </span>
                ))}
              </div>

              <div className="field" style={{ marginTop: '12px' }}>
                <label>Allergies (comma-separated)</label>
                <input
                  name="allergies"
                  placeholder="e.g., Nuts, Shellfish, Soy"
                  value={formData.allergies}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </section>

          {/* Cultural preferences */}
          <section className="p-card">
            <div className="p-card-header">
              <h3>Cultural & Cuisine Preferences</h3>
            </div>
            <div className="p-card-body">
              <label className="field">
                <span>Preferred Cuisines</span>
                <div className="pill-row">
                  {["Italian", "Mexican", "Indian", "Chinese", "Japanese", "Nepali"].map(cuisine => (
                    <span
                      key={cuisine}
                      className={`pill pill-toggle ${formData.preferred_cuisines.includes(cuisine) ? "pill-selected" : ""}`}
                      onClick={() => toggleArrayItem("preferred_cuisines", cuisine)}
                    >
                      {cuisine}
                    </span>
                  ))}
                </div>
              </label>
              <div className="switch-row">
                <span>Prioritize Local/Nepali Dishes</span>
                <label className="switch">
                  <input
                    type="checkbox"
                    name="prioritize_local"
                    checked={formData.prioritize_local}
                    onChange={handleInputChange}
                  />
                  <span className="slider" />
                </label>
              </div>
            </div>
          </section>

          {/* Budget settings */}
          <section className="p-card">
            <div className="p-card-header">
              <h3>Budget Settings</h3>
            </div>
            <div className="p-card-body">
              <div className="field">
                <label>Daily Food Budget: ${formData.daily_budget || 0}</label>
                <input
                  type="range"
                  name="daily_budget"
                  min="10"
                  max="100"
                  value={formData.daily_budget || 25}
                  onChange={handleInputChange}
                />
              </div>
              <div className="field">
                <label>Weekly Food Budget: ${formData.weekly_budget || 0}</label>
                <input
                  type="range"
                  name="weekly_budget"
                  min="50"
                  max="500"
                  value={formData.weekly_budget || 150}
                  onChange={handleInputChange}
                />
              </div>
              <div className="field">
                <label>Preferred Shopping Style</label>
                <div className="pill-row">
                  {["Budget-conscious", "Organic Focus", "Convenience First"].map(style => (
                    <span
                      key={style}
                      className={`pill pill-toggle ${formData.shopping_style === style ? "pill-selected" : ""}`}
                      onClick={() => setFormData(prev => ({ ...prev, shopping_style: style }))}
                    >
                      {style}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Inventory settings */}
          <section className="p-card">
            <div className="p-card-header">
              <h3>Inventory & Home Cooking Settings</h3>
            </div>
            <div className="p-card-body">
              <div className="switch-row">
                <span>Pantry Tracking</span>
                <label className="switch">
                  <input
                    type="checkbox"
                    name="pantry_tracking"
                    checked={formData.pantry_tracking}
                    onChange={handleInputChange}
                  />
                  <span className="slider" />
                </label>
              </div>
              <div className="switch-row">
                <span>Leftover Alerts</span>
                <label className="switch">
                  <input
                    type="checkbox"
                    name="leftover_alerts"
                    checked={formData.leftover_alerts}
                    onChange={handleInputChange}
                  />
                  <span className="slider" />
                </label>
              </div>
              <div className="switch-row">
                <span>Smart Expiry Notifications</span>
                <label className="switch">
                  <input
                    type="checkbox"
                    name="expiry_notifications"
                    checked={formData.expiry_notifications}
                    onChange={handleInputChange}
                  />
                  <span className="slider" />
                </label>
              </div>
              <div className="field">
                <label>Preferred Serving Size</label>
                <select
                  name="preferred_serving_size"
                  value={formData.preferred_serving_size}
                  onChange={handleInputChange}
                >
                  <option value="1">1 person</option>
                  <option value="2">2 people</option>
                  <option value="4">4 people</option>
                  <option value="6">6 people</option>
                </select>
              </div>
              <div className="switch-row">
                <span>Homecook Marketplace Access</span>
                <label className="switch">
                  <input
                    type="checkbox"
                    name="marketplace_access"
                    checked={formData.marketplace_access}
                    onChange={handleInputChange}
                  />
                  <span className="slider" />
                </label>
              </div>
            </div>
          </section>

          {/* AI personalization */}
          <section className="p-card">
            <div className="p-card-header">
              <h3>AI Personalization Settings</h3>
            </div>
            <div className="p-card-body">
              <div className="field">
                <label>Personalization Strength: {formData.personalization_strength}%</label>
                <input
                  type="range"
                  name="personalization_strength"
                  min="0"
                  max="100"
                  value={formData.personalization_strength}
                  onChange={handleInputChange}
                />
              </div>
              <label className="field">
                <span>Nutrition Focus</span>
                <div className="pill-row">
                  {["Balanced Macros", "High Protein", "Low Carb", "High Fiber"].map(focus => (
                    <span
                      key={focus}
                      className={`pill pill-toggle ${formData.nutrition_focus.includes(focus) ? "pill-selected" : ""}`}
                      onClick={() => toggleArrayItem("nutrition_focus", focus)}
                    >
                      {focus}
                    </span>
                  ))}
                </div>
              </label>
              <div className="switch-row">
                <span>AI Auto-adjust Meal Plans</span>
                <label className="switch">
                  <input
                    type="checkbox"
                    name="ai_auto_adjust"
                    checked={formData.ai_auto_adjust}
                    onChange={handleInputChange}
                  />
                  <span className="slider" />
                </label>
              </div>
            </div>
          </section>

          {/* Privacy & account */}
          <section className="p-card">
            <div className="p-card-header">
              <h3>Privacy & Account Settings</h3>
            </div>
            <div className="p-card-body">
              <button className="btn-outline" onClick={() => setPasswordModal(true)}>
                Change Password
              </button>

              <div className="section-subtitle">Notification Management</div>
              <div className="switch-row">
                <span>Email Notifications</span>
                <label className="switch">
                  <input
                    type="checkbox"
                    name="email_notifications"
                    checked={formData.email_notifications}
                    onChange={handleInputChange}
                  />
                  <span className="slider" />
                </label>
              </div>
              <div className="switch-row">
                <span>SMS Notifications</span>
                <label className="switch">
                  <input
                    type="checkbox"
                    name="sms_notifications"
                    checked={formData.sms_notifications}
                    onChange={handleInputChange}
                  />
                  <span className="slider" />
                </label>
              </div>

              <div className="section-subtitle">Data & Privacy Options</div>
              <div className="switch-row">
                <span>Allow Data Sharing</span>
                <label className="switch">
                  <input
                    type="checkbox"
                    name="data_sharing"
                    checked={formData.data_sharing}
                    onChange={handleInputChange}
                  />
                  <span className="slider" />
                </label>
              </div>

              <button className="btn-outline" onClick={handleExportData}>
                Download My Data
              </button>
              <button className="btn-danger" onClick={handleDeleteAccount}>
                Delete Account
              </button>
            </div>
          </section>
        </div>

        <button className="btn-outline back-btn" onClick={onBack} style={{ marginTop: '20px' }}>
          ← Back to Dashboard
        </button>
      </main>

      {/* Password Change Modal */}
      {passwordModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: '24px',
            borderRadius: '12px',
            maxWidth: '400px',
            width: '90%'
          }}>
            <h3>Change Password</h3>
            <form onSubmit={handlePasswordChange}>
              <div className="field">
                <label>Current Password</label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                  required
                />
              </div>
              <div className="field">
                <label>New Password</label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                  required
                />
              </div>
              <div className="field">
                <label>Confirm New Password</label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                <button type="button" className="btn-outline" onClick={() => setPasswordModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}