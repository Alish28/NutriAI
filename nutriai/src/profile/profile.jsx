import { useState, useEffect, useRef } from "react";
import {
  getFullProfile,
  updateProfile,
  updatePassword,
  exportUserData,
  deleteAccount,
  logout
} from "../services/api";
import AIChatbot from "../components/aiChatbot.jsx";
import "./profile.css";

const SECTIONS = [
  { id: "overview", label: "Overview", icon: "👤" },
  { id: "personal", label: "Personal Info", icon: "📋" },
  { id: "goals", label: "Goals & Activity", icon: "🎯" },
  { id: "dietary", label: "Dietary", icon: "🥗" },
  { id: "budget", label: "Budget", icon: "💰" },
  { id: "home", label: "Home Cooking", icon: "🍳" },
  { id: "ai", label: "AI Settings", icon: "🤖" },
  { id: "privacy", label: "Privacy & Account", icon: "🔒" },
];

export default function Profile({ onBack, onLogout }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeSection, setActiveSection] = useState("overview");
  const [passwordModal, setPasswordModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

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
    data_sharing: false,
  });

  const pageRef = useRef(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await getFullProfile();
      const u = response.data.user;
      setProfile(u);
      setFormData({
        full_name: u.full_name || "",
        age: u.age || "",
        gender: u.gender || "",
        weight: u.weight || "",
        height: u.height || "",
        activity_level: u.activity_level || "",
        health_goals: u.health_goals || [],
        dietary_preferences: u.dietary_preferences || [],
        allergies: Array.isArray(u.allergies) ? u.allergies.join(", ") : (u.allergies || ""),
        preferred_cuisines: u.preferred_cuisines || [],
        prioritize_local: u.prioritize_local || false,
        daily_budget: u.daily_budget || "",
        weekly_budget: u.weekly_budget || "",
        shopping_style: u.shopping_style || "",
        pantry_tracking: u.pantry_tracking !== false,
        leftover_alerts: u.leftover_alerts !== false,
        expiry_notifications: u.expiry_notifications !== false,
        preferred_serving_size: u.preferred_serving_size || 2,
        marketplace_access: u.marketplace_access || false,
        personalization_strength: u.personalization_strength || 75,
        nutrition_focus: u.nutrition_focus || [],
        ai_auto_adjust: u.ai_auto_adjust !== false,
        email_notifications: u.email_notifications !== false,
        sms_notifications: u.sms_notifications || false,
        data_sharing: u.data_sharing || false,
      });
    } catch (err) {
      setError(err.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const toggleArrayItem = (arrayName, item) => {
    setFormData((prev) => ({
      ...prev,
      [arrayName]: prev[arrayName].includes(item)
        ? prev[arrayName].filter((i) => i !== item)
        : [...prev[arrayName], item],
    }));
  };

  const showMsg = (type, msg) => {
    if (type === "success") { setSuccess(msg); setError(""); }
    else { setError(msg); setSuccess(""); }
    pageRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => { setSuccess(""); setError(""); }, 4000);
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      const dataToSend = {
        ...formData,
        allergies: formData.allergies
          ? formData.allergies.split(",").map((s) => s.trim()).filter(Boolean)
          : [],
      };
      const response = await updateProfile(dataToSend);
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem("user", JSON.stringify({
        ...currentUser,
        full_name: response.data.user.full_name,
        email: response.data.user.email,
      }));
      await loadProfile();
      showMsg("success", "✓ Profile saved successfully!");
    } catch (err) {
      showMsg("error", err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setError("");
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return showMsg("error", "New passwords do not match");
    }
    if (passwordData.newPassword.length < 6) {
      return showMsg("error", "Password must be at least 6 characters");
    }
    try {
      await updatePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      setPasswordModal(false);
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      showMsg("success", "✓ Password updated successfully!");
    } catch (err) {
      showMsg("error", err.message || "Failed to update password");
    }
  };

  const handleExportData = async () => {
    try {
      const response = await exportUserData();
      const dataStr = JSON.stringify(response.data, null, 2);
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `nutriai-data-${new Date().toISOString().split("T")[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
      showMsg("success", "✓ Data exported successfully!");
    } catch (err) {
      showMsg("error", err.message || "Failed to export data");
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) return showMsg("error", "Please enter your password");
    try {
      await deleteAccount(deletePassword);
      logout();
      if (onLogout) onLogout();
    } catch (err) {
      showMsg("error", err.message || "Failed to delete account");
      setDeleteModal(false);
    }
  };

  const getInitials = (name) =>
    name ? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) : "U";

  if (loading) {
    return (
      <div className="pp-root">
        <div className="pp-loading">
          <div className="pp-loading-spinner" />
          <p>Loading your profile…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pp-root" ref={pageRef}>
      {/* ── Header ── */}
      <header className="pp-header">
        <button className="pp-back-btn" onClick={onBack}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to Dashboard
        </button>
        <div className="pp-header-brand">
          <span className="pp-header-logo">🍽</span>
          <span>NutriAI</span>
        </div>
        <button
          className="pp-save-btn"
          onClick={handleSaveProfile}
          disabled={saving}
        >
          {saving ? (
            <><span className="pp-btn-spinner" />Saving…</>
          ) : (
            "Save Changes"
          )}
        </button>
      </header>

      {/* ── Alerts ── */}
      {(success || error) && (
        <div className={`pp-alert ${success ? "pp-alert-success" : "pp-alert-error"}`}>
          {success || error}
        </div>
      )}

      <div className="pp-body">
        {/* ── Sidebar nav ── */}
        <aside className="pp-sidebar">
          <div className="pp-sidebar-profile">
            <div className="pp-avatar-ring">
              <div className="pp-avatar">
                {profile?.profile_image_url
                  ? <img src={profile.profile_image_url} alt="avatar" />
                  : <span>{getInitials(profile?.full_name)}</span>}
              </div>
            </div>
            <div className="pp-sidebar-name">{profile?.full_name || "User"}</div>
            <div className="pp-sidebar-email">{profile?.email}</div>
            {profile?.homecook_approved && (
              <span className="pp-homecook-badge">👨‍🍳 Homecook</span>
            )}
            {profile?.role === "admin" && (
              <span className="pp-admin-badge">⚡ Admin</span>
            )}
          </div>

          <nav className="pp-nav">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                className={`pp-nav-item ${activeSection === s.id ? "active" : ""}`}
                onClick={() => setActiveSection(s.id)}
              >
                <span className="pp-nav-icon">{s.icon}</span>
                <span>{s.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* ── Main content ── */}
        <main className="pp-main">
          {/* OVERVIEW */}
          {activeSection === "overview" && (
            <div className="pp-section-panel">
              <div className="pp-panel-header">
                <h2>Account Overview</h2>
                <p>Your NutriAI profile at a glance</p>
              </div>
              <div className="pp-overview-grid">
                <div className="pp-overview-stat">
                  <span className="pp-ov-icon">🎯</span>
                  <div>
                    <div className="pp-ov-label">Health Goals</div>
                    <div className="pp-ov-value">
                      {formData.health_goals.length > 0
                        ? formData.health_goals.join(", ")
                        : "Not set"}
                    </div>
                  </div>
                </div>
                <div className="pp-overview-stat">
                  <span className="pp-ov-icon">🏃</span>
                  <div>
                    <div className="pp-ov-label">Activity Level</div>
                    <div className="pp-ov-value">{formData.activity_level || "Not set"}</div>
                  </div>
                </div>
                <div className="pp-overview-stat">
                  <span className="pp-ov-icon">🥗</span>
                  <div>
                    <div className="pp-ov-label">Dietary Preferences</div>
                    <div className="pp-ov-value">
                      {formData.dietary_preferences.length > 0
                        ? formData.dietary_preferences.join(", ")
                        : "None"}
                    </div>
                  </div>
                </div>
                <div className="pp-overview-stat">
                  <span className="pp-ov-icon">💰</span>
                  <div>
                    <div className="pp-ov-label">Daily Budget</div>
                    <div className="pp-ov-value">
                      {formData.daily_budget ? `NPR ${formData.daily_budget}` : "Not set"}
                    </div>
                  </div>
                </div>
                <div className="pp-overview-stat">
                  <span className="pp-ov-icon">🤖</span>
                  <div>
                    <div className="pp-ov-label">AI Personalization</div>
                    <div className="pp-ov-value">{formData.personalization_strength}%</div>
                  </div>
                </div>
                <div className="pp-overview-stat">
                  <span className="pp-ov-icon">🍳</span>
                  <div>
                    <div className="pp-ov-label">Serving Size</div>
                    <div className="pp-ov-value">{formData.preferred_serving_size} {formData.preferred_serving_size === 1 ? "person" : "people"}</div>
                  </div>
                </div>
              </div>

              <div className="pp-overview-info">
                <div className="pp-info-row">
                  <span className="pp-info-label">Member since</span>
                  <span className="pp-info-value">
                    {profile?.created_at
                      ? new Date(profile.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })
                      : "—"}
                  </span>
                </div>
                <div className="pp-info-row">
                  <span className="pp-info-label">Account role</span>
                  <span className="pp-info-value pp-role-pill">{profile?.role || "consumer"}</span>
                </div>
                <div className="pp-info-row">
                  <span className="pp-info-label">Onboarding</span>
                  <span className="pp-info-value">
                    {profile?.onboarding_completed
                      ? "✅ Completed"
                      : "⚠️ Incomplete"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* PERSONAL INFO */}
          {activeSection === "personal" && (
            <div className="pp-section-panel">
              <div className="pp-panel-header">
                <h2>Personal Information</h2>
                <p>Your basic details used to personalize recommendations</p>
              </div>
              <div className="pp-form-grid">
                <div className="pp-field pp-field-full">
                  <label>Full Name</label>
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleInputChange}
                    placeholder="Your full name"
                  />
                </div>
                <div className="pp-field">
                  <label>Age</label>
                  <input
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleInputChange}
                    placeholder="e.g. 28"
                    min="10"
                    max="120"
                  />
                </div>
                <div className="pp-field">
                  <label>Gender</label>
                  <select name="gender" value={formData.gender} onChange={handleInputChange}>
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Non-binary">Non-binary</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>
                <div className="pp-field">
                  <label>Weight (kg)</label>
                  <input
                    type="number"
                    name="weight"
                    value={formData.weight}
                    onChange={handleInputChange}
                    placeholder="e.g. 70"
                    min="20"
                    max="300"
                  />
                </div>
                <div className="pp-field">
                  <label>Height (cm)</label>
                  <input
                    type="number"
                    name="height"
                    value={formData.height}
                    onChange={handleInputChange}
                    placeholder="e.g. 170"
                    min="50"
                    max="250"
                  />
                </div>
              </div>

              {/* BMI preview */}
              {formData.weight && formData.height && (
                <div className="pp-bmi-card">
                  <span className="pp-bmi-label">Estimated BMI</span>
                  <span className="pp-bmi-value">
                    {(parseFloat(formData.weight) / Math.pow(parseFloat(formData.height) / 100, 2)).toFixed(1)}
                  </span>
                  <span className="pp-bmi-note">
                    {(() => {
                      const bmi = parseFloat(formData.weight) / Math.pow(parseFloat(formData.height) / 100, 2);
                      if (bmi < 18.5) return "Underweight";
                      if (bmi < 25) return "Normal weight ✓";
                      if (bmi < 30) return "Overweight";
                      return "Obese";
                    })()}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* GOALS & ACTIVITY */}
          {activeSection === "goals" && (
            <div className="pp-section-panel">
              <div className="pp-panel-header">
                <h2>Goals & Activity</h2>
                <p>Helps calculate your personalized calorie and macro targets</p>
              </div>
              <div className="pp-field pp-field-full" style={{ marginBottom: 24 }}>
                <label>Activity Level</label>
                <select name="activity_level" value={formData.activity_level} onChange={handleInputChange}>
                  <option value="">Select activity level</option>
                  <option value="Sedentary">Sedentary — desk job, little exercise</option>
                  <option value="Lightly Active">Lightly Active — exercise 1-3x/week</option>
                  <option value="Moderately Active">Moderately Active — exercise 3-5x/week</option>
                  <option value="Very Active">Very Active — hard exercise 6-7x/week</option>
                  <option value="Extremely Active">Extremely Active — physical job + exercise</option>
                </select>
              </div>
              <div className="pp-pill-section">
                <label className="pp-pill-label">Health Goals <span className="pp-pill-hint">Select all that apply</span></label>
                <div className="pp-pill-row">
                  {["Weight Management", "Muscle Gain", "Heart Health", "Energy Boost", "Stress Reduction", "Better Sleep"].map((g) => (
                    <button
                      key={g}
                      type="button"
                      className={`pp-pill ${formData.health_goals.includes(g) ? "pp-pill-on" : ""}`}
                      onClick={() => toggleArrayItem("health_goals", g)}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              {/* Estimated calorie needs */}
              {formData.weight && formData.height && formData.age && formData.gender && formData.activity_level && (
                <div className="pp-calorie-preview">
                  <div className="pp-calorie-icon">🔥</div>
                  <div>
                    <div className="pp-calorie-label">Estimated Daily Calorie Need</div>
                    <div className="pp-calorie-value">
                      {(() => {
                        const w = parseFloat(formData.weight);
                        const h = parseFloat(formData.height);
                        const a = parseInt(formData.age);
                        const bmr = formData.gender === "Male"
                          ? 10 * w + 6.25 * h - 5 * a + 5
                          : 10 * w + 6.25 * h - 5 * a - 161;
                        const multipliers = {
                          "Sedentary": 1.2, "Lightly Active": 1.375,
                          "Moderately Active": 1.55, "Very Active": 1.725, "Extremely Active": 1.9
                        };
                        return Math.round(bmr * (multipliers[formData.activity_level] || 1.2)).toLocaleString();
                      })()} kcal/day
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* DIETARY */}
          {activeSection === "dietary" && (
            <div className="pp-section-panel">
              <div className="pp-panel-header">
                <h2>Dietary Preferences</h2>
                <p>Used to filter meal recommendations and marketplace listings</p>
              </div>
              <div className="pp-pill-section">
                <label className="pp-pill-label">Dietary Restrictions</label>
                <div className="pp-pill-row">
                  {["Vegan", "Vegetarian", "Keto", "Gluten-Free", "Dairy-Free", "Halal", "Kosher"].map((p) => (
                    <button
                      key={p}
                      type="button"
                      className={`pp-pill ${formData.dietary_preferences.includes(p) ? "pp-pill-on" : ""}`}
                      onClick={() => toggleArrayItem("dietary_preferences", p)}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pp-field" style={{ marginBottom: 24 }}>
                <label>Allergies <span className="pp-field-hint">comma separated</span></label>
                <input
                  type="text"
                  name="allergies"
                  value={formData.allergies}
                  onChange={handleInputChange}
                  placeholder="e.g. Peanuts, Shellfish, Dairy"
                />
              </div>

              <div className="pp-pill-section">
                <label className="pp-pill-label">Preferred Cuisines</label>
                <div className="pp-pill-row">
                  {["Nepali", "Italian", "Mexican", "Indian", "Chinese", "Japanese", "Thai", "American", "Mediterranean"].map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={`pp-pill ${formData.preferred_cuisines.includes(c) ? "pp-pill-on" : ""}`}
                      onClick={() => toggleArrayItem("preferred_cuisines", c)}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pp-toggle-row">
                <div className="pp-toggle-info">
                  <span className="pp-toggle-label">Prioritize Local & Nepali Dishes</span>
                  <span className="pp-toggle-desc">Boost local homecook recommendations</span>
                </div>
                <label className="pp-switch">
                  <input
                    type="checkbox"
                    name="prioritize_local"
                    checked={formData.prioritize_local}
                    onChange={handleInputChange}
                  />
                  <span className="pp-track" />
                </label>
              </div>
            </div>
          )}

          {/* BUDGET */}
          {activeSection === "budget" && (
            <div className="pp-section-panel">
              <div className="pp-panel-header">
                <h2>Budget & Shopping</h2>
                <p>Set your spending limits for smarter meal suggestions</p>
              </div>
              <div className="pp-form-grid">
                <div className="pp-field">
                  <label>Daily Budget (NPR)</label>
                  <div className="pp-input-wrap">
                    <span className="pp-input-prefix">Rs.</span>
                    <input
                      type="number"
                      name="daily_budget"
                      value={formData.daily_budget}
                      onChange={handleInputChange}
                      placeholder="0"
                      min="0"
                    />
                  </div>
                </div>
                <div className="pp-field">
                  <label>Weekly Budget (NPR)</label>
                  <div className="pp-input-wrap">
                    <span className="pp-input-prefix">Rs.</span>
                    <input
                      type="number"
                      name="weekly_budget"
                      value={formData.weekly_budget}
                      onChange={handleInputChange}
                      placeholder="0"
                      min="0"
                    />
                  </div>
                </div>
              </div>

              <div className="pp-field" style={{ marginBottom: 24 }}>
                <label>Shopping Style</label>
                <select name="shopping_style" value={formData.shopping_style} onChange={handleInputChange}>
                  <option value="">Select a style</option>
                  <option value="Budget-conscious">Budget-conscious — maximize value</option>
                  <option value="Organic Focus">Organic Focus — quality over cost</option>
                  <option value="Convenience First">Convenience First — fast & easy</option>
                  <option value="Balanced">Balanced — mix of all</option>
                </select>
              </div>

              {formData.daily_budget && formData.weekly_budget && (
                <div className="pp-budget-note">
                  💡 Your daily budget accounts for{" "}
                  <strong>
                    {Math.round((parseFloat(formData.daily_budget) * 7 / parseFloat(formData.weekly_budget)) * 100)}%
                  </strong>{" "}
                  of your weekly budget.
                </div>
              )}
            </div>
          )}

          {/* HOME COOKING */}
          {activeSection === "home" && (
            <div className="pp-section-panel">
              <div className="pp-panel-header">
                <h2>Home Cooking</h2>
                <p>Pantry management and notification preferences</p>
              </div>

              <div className="pp-field" style={{ marginBottom: 24 }}>
                <label>Preferred Serving Size</label>
                <select name="preferred_serving_size" value={formData.preferred_serving_size} onChange={handleInputChange}>
                  <option value="1">1 person</option>
                  <option value="2">2 people</option>
                  <option value="4">4 people</option>
                  <option value="6">6 people</option>
                </select>
              </div>

              <div className="pp-toggles-card">
                <div className="pp-toggle-row">
                  <div className="pp-toggle-info">
                    <span className="pp-toggle-label">🥫 Pantry Tracking</span>
                    <span className="pp-toggle-desc">Track pantry items and expiry dates</span>
                  </div>
                  <label className="pp-switch">
                    <input type="checkbox" name="pantry_tracking" checked={formData.pantry_tracking} onChange={handleInputChange} />
                    <span className="pp-track" />
                  </label>
                </div>
                <div className="pp-toggle-row">
                  <div className="pp-toggle-info">
                    <span className="pp-toggle-label">🍱 Leftover Alerts</span>
                    <span className="pp-toggle-desc">Get reminders to use leftover ingredients</span>
                  </div>
                  <label className="pp-switch">
                    <input type="checkbox" name="leftover_alerts" checked={formData.leftover_alerts} onChange={handleInputChange} />
                    <span className="pp-track" />
                  </label>
                </div>
                <div className="pp-toggle-row">
                  <div className="pp-toggle-info">
                    <span className="pp-toggle-label">⚠️ Expiry Notifications</span>
                    <span className="pp-toggle-desc">Alert when pantry items are about to expire</span>
                  </div>
                  <label className="pp-switch">
                    <input type="checkbox" name="expiry_notifications" checked={formData.expiry_notifications} onChange={handleInputChange} />
                    <span className="pp-track" />
                  </label>
                </div>
                <div className="pp-toggle-row">
                  <div className="pp-toggle-info">
                    <span className="pp-toggle-label">🏪 Homecook Marketplace</span>
                    <span className="pp-toggle-desc">Enable access to local homecook marketplace</span>
                  </div>
                  <label className="pp-switch">
                    <input type="checkbox" name="marketplace_access" checked={formData.marketplace_access} onChange={handleInputChange} />
                    <span className="pp-track" />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* AI SETTINGS */}
          {activeSection === "ai" && (
            <div className="pp-section-panel">
              <div className="pp-panel-header">
                <h2>AI Personalization</h2>
                <p>Control how NutriAI learns from and adapts to your preferences</p>
              </div>

              <div className="pp-field" style={{ marginBottom: 28 }}>
                <div className="pp-range-header">
                  <label>Personalization Strength</label>
                  <span className="pp-range-value">{formData.personalization_strength}%</span>
                </div>
                <input
                  type="range"
                  name="personalization_strength"
                  min="0"
                  max="100"
                  step="5"
                  value={formData.personalization_strength}
                  onChange={handleInputChange}
                  className="pp-range"
                />
                <div className="pp-range-labels">
                  <span>Generic</span>
                  <span>Highly Personalized</span>
                </div>
              </div>

              <div className="pp-pill-section" style={{ marginBottom: 24 }}>
                <label className="pp-pill-label">Nutrition Focus</label>
                <div className="pp-pill-row">
                  {["Balanced Macros", "High Protein", "Low Carb", "High Fiber", "Low Fat", "Heart Healthy"].map((f) => (
                    <button
                      key={f}
                      type="button"
                      className={`pp-pill ${formData.nutrition_focus.includes(f) ? "pp-pill-on" : ""}`}
                      onClick={() => toggleArrayItem("nutrition_focus", f)}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pp-toggles-card">
                <div className="pp-toggle-row">
                  <div className="pp-toggle-info">
                    <span className="pp-toggle-label">🔄 Auto-adjust Meal Plans</span>
                    <span className="pp-toggle-desc">AI automatically refines suggestions based on your feedback</span>
                  </div>
                  <label className="pp-switch">
                    <input type="checkbox" name="ai_auto_adjust" checked={formData.ai_auto_adjust} onChange={handleInputChange} />
                    <span className="pp-track" />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* PRIVACY & ACCOUNT */}
          {activeSection === "privacy" && (
            <div className="pp-section-panel">
              <div className="pp-panel-header">
                <h2>Privacy & Account</h2>
                <p>Manage your security, notifications, and account data</p>
              </div>

              <div className="pp-privacy-block">
                <h3 className="pp-block-title">🔐 Security</h3>
                <button className="pp-action-btn" onClick={() => setPasswordModal(true)}>
                  Change Password
                </button>
              </div>

              <div className="pp-privacy-block">
                <h3 className="pp-block-title">🔔 Notifications</h3>
                <div className="pp-toggles-card">
                  <div className="pp-toggle-row">
                    <div className="pp-toggle-info">
                      <span className="pp-toggle-label">Email Notifications</span>
                      <span className="pp-toggle-desc">Receive updates and summaries via email</span>
                    </div>
                    <label className="pp-switch">
                      <input type="checkbox" name="email_notifications" checked={formData.email_notifications} onChange={handleInputChange} />
                      <span className="pp-track" />
                    </label>
                  </div>
                  <div className="pp-toggle-row">
                    <div className="pp-toggle-info">
                      <span className="pp-toggle-label">SMS Notifications</span>
                      <span className="pp-toggle-desc">Receive text alerts for important events</span>
                    </div>
                    <label className="pp-switch">
                      <input type="checkbox" name="sms_notifications" checked={formData.sms_notifications} onChange={handleInputChange} />
                      <span className="pp-track" />
                    </label>
                  </div>
                </div>
              </div>

              <div className="pp-privacy-block">
                <h3 className="pp-block-title">🛡️ Data & Privacy</h3>
                <div className="pp-toggles-card" style={{ marginBottom: 16 }}>
                  <div className="pp-toggle-row">
                    <div className="pp-toggle-info">
                      <span className="pp-toggle-label">Allow Data Sharing</span>
                      <span className="pp-toggle-desc">Help improve NutriAI by sharing anonymized usage data</span>
                    </div>
                    <label className="pp-switch">
                      <input type="checkbox" name="data_sharing" checked={formData.data_sharing} onChange={handleInputChange} />
                      <span className="pp-track" />
                    </label>
                  </div>
                </div>
                <button className="pp-action-btn" onClick={handleExportData}>
                  📥 Download My Data
                </button>
              </div>

              <div className="pp-danger-zone">
                <h3 className="pp-danger-title">⚠️ Danger Zone</h3>
                <p className="pp-danger-desc">Permanently delete your account and all associated data. This cannot be undone.</p>
                <button className="pp-delete-btn" onClick={() => setDeleteModal(true)}>
                  Delete My Account
                </button>
              </div>
            </div>
          )}

          {/* Floating save bar */}
          <div className="pp-floating-save">
            <button
              className="pp-save-floating"
              onClick={handleSaveProfile}
              disabled={saving}
            >
              {saving ? "Saving…" : "💾 Save Changes"}
            </button>
          </div>
        </main>
      </div>

      {/* ── Password Modal ── */}
      {passwordModal && (
        <div className="pp-modal-overlay" onClick={() => setPasswordModal(false)}>
          <div className="pp-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pp-modal-header">
              <h3>Change Password</h3>
              <button className="pp-modal-close" onClick={() => setPasswordModal(false)}>✕</button>
            </div>
            <form className="pp-modal-body" onSubmit={handlePasswordChange}>
              <div className="pp-field">
                <label>Current Password</label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData((p) => ({ ...p, currentPassword: e.target.value }))}
                  placeholder="Enter current password"
                  required
                />
              </div>
              <div className="pp-field">
                <label>New Password</label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData((p) => ({ ...p, newPassword: e.target.value }))}
                  placeholder="At least 6 characters"
                  required
                />
              </div>
              <div className="pp-field">
                <label>Confirm New Password</label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData((p) => ({ ...p, confirmPassword: e.target.value }))}
                  placeholder="Repeat new password"
                  required
                />
              </div>
              <div className="pp-modal-actions">
                <button type="button" className="pp-action-btn" onClick={() => setPasswordModal(false)}>Cancel</button>
                <button type="submit" className="pp-save-btn">Update Password</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Account Modal ── */}
      {deleteModal && (
        <div className="pp-modal-overlay" onClick={() => setDeleteModal(false)}>
          <div className="pp-modal pp-modal-danger" onClick={(e) => e.stopPropagation()}>
            <div className="pp-modal-header">
              <h3>⚠️ Delete Account</h3>
              <button className="pp-modal-close" onClick={() => setDeleteModal(false)}>✕</button>
            </div>
            <div className="pp-modal-body">
              <p style={{ color: "#dc2626", marginBottom: 16, fontSize: 14, lineHeight: 1.6 }}>
                This action is <strong>permanent and cannot be undone</strong>. All your meals, pantry data, and preferences will be deleted.
              </p>
              <div className="pp-field">
                <label>Confirm with your password</label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Enter your password"
                />
              </div>
              <div className="pp-modal-actions">
                <button className="pp-action-btn" onClick={() => setDeleteModal(false)}>Cancel</button>
                <button className="pp-delete-btn" onClick={handleDeleteAccount}>
                  Yes, Delete My Account
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <AIChatbot />
    </div>
  );
}