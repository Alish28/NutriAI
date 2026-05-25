import { useState, useEffect, useRef } from "react";
import {
  getFullProfile,
  updateProfile,
  updatePassword,
  exportUserData,
  deleteAccount,
  logout,
} from "../services/api";
import AIChatbot from "../components/aiChatbot.jsx";
import "./profile.css";

const SECTIONS = [
  { id: "overview", label: "Overview", icon: "O" },
  { id: "personal", label: "Personal Info", icon: "P" },
  { id: "goals", label: "Goals & Activity", icon: "G" },
  { id: "dietary", label: "Dietary", icon: "D" },
  { id: "budget", label: "Budget", icon: "B" },
  { id: "home", label: "Serving Size", icon: "S" },
  { id: "ai", label: "AI Settings", icon: "A" },
  { id: "privacy", label: "Account", icon: "L" },
];

const healthGoalOptions = [
  "Weight Management",
  "Muscle Gain",
  "Heart Health",
  "Energy Boost",
  "Stress Reduction",
  "Better Sleep",
];

const dietaryOptions = [
  "Vegan",
  "Vegetarian",
  "Pescatarian",
  "Keto",
  "Gluten-Free",
  "Dairy-Free",
  "Low-Carb",
];

const cuisineOptions = [
  "Nepali",
  "Indian",
  "Chinese",
  "Japanese",
  "Italian",
  "Mexican",
  "Mediterranean",
  "Thai",
  "English",
];

const nutritionFocusOptions = [
  "Balanced Macros",
  "High Protein",
  "Low Carb",
  "High Fiber",
  "Low Sugar",
  "Heart Healthy",
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
    phone_number: "",
    age: "",
    gender: "",
    weight: "",
    height: "",
    activity_level: "",
    health_goals: [],
    dietary_preferences: [],
    allergies: "",
    preferred_cuisines: [],
    daily_budget: "",
    weekly_budget: "",
    shopping_style: "",
    preferred_serving_size: 2,
    personalization_strength: 75,
    nutrition_focus: [],
    ai_auto_adjust: true,
  });

  const pageRef = useRef(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const cleanNumber = (value) => {
    if (value === "" || value === null || value === undefined) return null;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  };

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await getFullProfile();
      const u = response.data.user;

      setProfile(u);
      setFormData({
        full_name: u.full_name || "",
        phone_number: u.phone_number || "",
        age: u.age || "",
        gender: u.gender || "",
        weight: u.weight || "",
        height: u.height || "",
        activity_level: u.activity_level || "",
        health_goals: u.health_goals || [],
        dietary_preferences: u.dietary_preferences || [],
        allergies: Array.isArray(u.allergies) ? u.allergies.join(", ") : u.allergies || "",
        preferred_cuisines: u.preferred_cuisines || [],
        daily_budget: u.daily_budget || "",
        weekly_budget: u.weekly_budget || "",
        shopping_style: u.shopping_style || "",
        preferred_serving_size: u.preferred_serving_size || 2,
        personalization_strength: u.personalization_strength || 75,
        nutrition_focus: u.nutrition_focus || [],
        ai_auto_adjust: u.ai_auto_adjust !== false,
      });
    } catch (err) {
      setError(err.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const showMsg = (type, msg) => {
    if (type === "success") {
      setSuccess(msg);
      setError("");
    } else {
      setError(msg);
      setSuccess("");
    }

    pageRef.current?.scrollTo({ top: 0, behavior: "smooth" });

    setTimeout(() => {
      setSuccess("");
      setError("");
    }, 4000);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => {
      const next = {
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      };

      if (name === "daily_budget") {
        const daily = cleanNumber(value) || 0;
        next.weekly_budget = daily ? daily * 7 : "";
      }

      return next;
    });
  };

  const toggleArrayItem = (arrayName, item) => {
    setFormData((prev) => ({
      ...prev,
      [arrayName]: prev[arrayName].includes(item)
        ? prev[arrayName].filter((i) => i !== item)
        : [...prev[arrayName], item],
    }));
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);

      const dailyBudget = cleanNumber(formData.daily_budget);

      const dataToSend = {
        full_name: formData.full_name,
        phone_number: formData.phone_number,
        age: cleanNumber(formData.age),
        gender: formData.gender || null,
        weight: cleanNumber(formData.weight),
        height: cleanNumber(formData.height),
        activity_level: formData.activity_level || null,
        health_goals: formData.health_goals,
        dietary_preferences: formData.dietary_preferences,
        allergies: formData.allergies
          ? formData.allergies.split(",").map((s) => s.trim()).filter(Boolean)
          : [],
        preferred_cuisines: formData.preferred_cuisines,
        daily_budget: dailyBudget,
        weekly_budget: dailyBudget ? dailyBudget * 7 : null,
        shopping_style: formData.shopping_style || null,
        preferred_serving_size: cleanNumber(formData.preferred_serving_size) || 2,
        personalization_strength: cleanNumber(formData.personalization_strength) || 75,
        nutrition_focus: formData.nutrition_focus,
        ai_auto_adjust: formData.ai_auto_adjust,
      };

      const response = await updateProfile(dataToSend);

      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem(
        "user",
        JSON.stringify({
          ...currentUser,
          full_name: response.data.user.full_name,
          email: response.data.user.email,
        })
      );

      await loadProfile();
      showMsg("success", "Profile saved successfully.");
    } catch (err) {
      showMsg("error", err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();

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
      showMsg("success", "Password updated successfully.");
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
      showMsg("success", "Data exported successfully.");
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

  const calculatedWeeklyBudget = formData.daily_budget
    ? Number(formData.daily_budget) * 7
    : "";

  if (loading) {
    return (
      <div className="pp-root">
        <div className="pp-loading">
          <div className="pp-loading-spinner" />
          <p>Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pp-root" ref={pageRef}>
      <header className="pp-header">
        <button className="pp-back-btn" onClick={onBack}>
          Back to Dashboard
        </button>

        <div className="pp-header-brand">
          <span className="pp-header-logo">N</span>
          <span>NutriAI</span>
        </div>

        <button className="pp-save-btn" onClick={handleSaveProfile} disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </header>

      {(success || error) && (
        <div className={`pp-alert ${success ? "pp-alert-success" : "pp-alert-error"}`}>
          {success || error}
        </div>
      )}

      <div className="pp-body">
        <aside className="pp-sidebar">
          <div className="pp-sidebar-profile">
            <div className="pp-avatar-ring">
              <div className="pp-avatar">
                {profile?.profile_image_url ? (
                  <img src={profile.profile_image_url} alt="avatar" />
                ) : (
                  <span>{getInitials(profile?.full_name)}</span>
                )}
              </div>
            </div>

            <div className="pp-sidebar-name">{profile?.full_name || "User"}</div>
            <div className="pp-sidebar-email">{profile?.email}</div>

            {profile?.phone_verified ? (
              <span className="pp-verified-badge">Phone verified</span>
            ) : (
              <span className="pp-pending-badge">Phone pending</span>
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

        <main className="pp-main">
          {activeSection === "overview" && (
            <div className="pp-section-panel">
              <div className="pp-panel-header">
                <h2>Account Overview</h2>
                <p>Your NutriAI profile at a glance</p>
              </div>

              <div className="pp-overview-grid">
                <OverviewCard label="Health Goals" value={formData.health_goals.length ? formData.health_goals.join(", ") : "Not set"} />
                <OverviewCard label="Activity Level" value={formData.activity_level || "Not set"} />
                <OverviewCard label="Dietary Preferences" value={formData.dietary_preferences.length ? formData.dietary_preferences.join(", ") : "None"} />
                <OverviewCard label="Daily Budget" value={formData.daily_budget ? `NPR ${formData.daily_budget}` : "Not set"} />
                <OverviewCard label="Weekly Budget" value={calculatedWeeklyBudget ? `NPR ${calculatedWeeklyBudget}` : "Not set"} />
                <OverviewCard label="AI Personalization" value={`${formData.personalization_strength}%`} />
                <OverviewCard label="Serving Size" value={`${formData.preferred_serving_size} ${Number(formData.preferred_serving_size) === 1 ? "person" : "people"}`} />
                <OverviewCard label="Phone Status" value={profile?.phone_verified ? "Verified by admin" : "Pending admin verification"} />
              </div>

              <div className="pp-overview-info">
                <InfoRow label="Member since" value={profile?.created_at ? new Date(profile.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "Not available"} />
                <InfoRow label="Account role" value={profile?.role || "consumer"} pill />
                <InfoRow label="Onboarding" value={profile?.onboarding_completed ? "Completed" : "Incomplete"} />
              </div>
            </div>
          )}

          {activeSection === "personal" && (
            <div className="pp-section-panel">
              <PanelHeader title="Personal Information" subtitle="Your basic details used for recommendations and pickup coordination" />

              <div className="pp-form-grid">
                <Field label="Full Name" full>
                  <input type="text" name="full_name" value={formData.full_name} onChange={handleInputChange} />
                </Field>

                <Field label="Phone Number">
                  <input type="tel" name="phone_number" value={formData.phone_number} onChange={handleInputChange} placeholder="98XXXXXXXX" />
                </Field>

                <Field label="Phone Verification">
                  <input value={profile?.phone_verified ? "Verified by admin" : "Pending admin verification"} disabled />
                </Field>

                <Field label="Age">
                  <input type="number" name="age" value={formData.age} onChange={handleInputChange} min="10" max="120" />
                </Field>

                <Field label="Gender">
                  <select name="gender" value={formData.gender} onChange={handleInputChange}>
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Non-binary">Non-binary</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </Field>

                <Field label="Weight (kg)">
                  <input type="number" name="weight" value={formData.weight} onChange={handleInputChange} min="20" max="300" />
                </Field>

                <Field label="Height (cm)">
                  <input type="number" name="height" value={formData.height} onChange={handleInputChange} min="50" max="250" />
                </Field>
              </div>

              {formData.weight && formData.height && (
                <div className="pp-bmi-card">
                  <span className="pp-bmi-label">Estimated BMI</span>
                  <span className="pp-bmi-value">
                    {(parseFloat(formData.weight) / Math.pow(parseFloat(formData.height) / 100, 2)).toFixed(1)}
                  </span>
                </div>
              )}
            </div>
          )}

          {activeSection === "goals" && (
            <div className="pp-section-panel">
              <PanelHeader title="Goals & Activity" subtitle="Used by NutriAI to estimate calorie and macro targets" />

              <Field label="Activity Level" full>
                <select name="activity_level" value={formData.activity_level} onChange={handleInputChange}>
                  <option value="">Select activity level</option>
                  <option value="Sedentary">Sedentary</option>
                  <option value="Lightly Active">Lightly Active</option>
                  <option value="Moderately Active">Moderately Active</option>
                  <option value="Very Active">Very Active</option>
                  <option value="Extremely Active">Extremely Active</option>
                </select>
              </Field>

              <PillGroup title="Health Goals" items={healthGoalOptions} selected={formData.health_goals} onToggle={(item) => toggleArrayItem("health_goals", item)} />
            </div>
          )}

          {activeSection === "dietary" && (
            <div className="pp-section-panel">
              <PanelHeader title="Dietary Preferences" subtitle="Used for recommendation scoring and safety checks" />

              <PillGroup title="Dietary Restrictions" items={dietaryOptions} selected={formData.dietary_preferences} onToggle={(item) => toggleArrayItem("dietary_preferences", item)} />

              <Field label="Allergies" full>
                <input type="text" name="allergies" value={formData.allergies} onChange={handleInputChange} placeholder="e.g. nuts, milk, eggs" />
              </Field>

              <PillGroup title="Preferred Cuisines" items={cuisineOptions} selected={formData.preferred_cuisines} onToggle={(item) => toggleArrayItem("preferred_cuisines", item)} />
            </div>
          )}

          {activeSection === "budget" && (
            <div className="pp-section-panel">
              <PanelHeader title="Budget" subtitle="Daily budget is used by meal recommendations" />

              <div className="pp-form-grid">
                <Field label="Daily Budget (NPR)">
                  <input type="number" name="daily_budget" value={formData.daily_budget} onChange={handleInputChange} min="0" />
                </Field>

                <Field label="Calculated Weekly Budget (NPR)">
                  <input value={calculatedWeeklyBudget || ""} disabled />
                </Field>
              </div>

              <Field label="Shopping Style" full>
                <select name="shopping_style" value={formData.shopping_style} onChange={handleInputChange}>
                  <option value="">Select a style</option>
                  <option value="Budget-conscious">Budget-conscious</option>
                  <option value="Organic Focus">Organic Focus</option>
                  <option value="Convenience First">Convenience First</option>
                  <option value="Balanced">Balanced</option>
                </select>
              </Field>
            </div>
          )}

          {activeSection === "home" && (
            <div className="pp-section-panel">
              <PanelHeader title="Serving Size" subtitle="Used for meal planning and homecook order preferences" />

              <Field label="Preferred Serving Size" full>
                <select name="preferred_serving_size" value={formData.preferred_serving_size} onChange={handleInputChange}>
                  <option value="1">1 person</option>
                  <option value="2">2 people</option>
                  <option value="3">3 people</option>
                  <option value="4">4+ people</option>
                </select>
              </Field>
            </div>
          )}

          {activeSection === "ai" && (
            <div className="pp-section-panel">
              <PanelHeader title="AI Personalization" subtitle="Controls how strongly recommendations follow your preferences" />

              <div className="pp-field pp-field-full">
                <div className="pp-range-header">
                  <label>Personalization Strength</label>
                  <span className="pp-range-value">{formData.personalization_strength}%</span>
                </div>
                <input type="range" name="personalization_strength" min="0" max="100" step="5" value={formData.personalization_strength} onChange={handleInputChange} className="pp-range" />
              </div>

              <PillGroup title="Nutrition Focus" items={nutritionFocusOptions} selected={formData.nutrition_focus} onToggle={(item) => toggleArrayItem("nutrition_focus", item)} />

              <div className="pp-toggle-row single">
                <div className="pp-toggle-info">
                  <span className="pp-toggle-label">Auto-adjust Meal Suggestions</span>
                  <span className="pp-toggle-desc">Allow NutriAI to refine suggestions from your profile and feedback.</span>
                </div>
                <label className="pp-switch">
                  <input type="checkbox" name="ai_auto_adjust" checked={formData.ai_auto_adjust} onChange={handleInputChange} />
                  <span className="pp-track" />
                </label>
              </div>
            </div>
          )}

          {activeSection === "privacy" && (
            <div className="pp-section-panel">
              <PanelHeader title="Account" subtitle="Security, data export, and account removal" />

              <div className="pp-action-stack">
                <button className="pp-action-btn" onClick={() => setPasswordModal(true)}>Change Password</button>
                <button className="pp-action-btn" onClick={handleExportData}>Download My Data</button>
              </div>

              <div className="pp-danger-zone">
                <h3>Danger Zone</h3>
                <p>Permanently delete your account and all associated data. This cannot be undone.</p>
                <button className="pp-delete-btn" onClick={() => setDeleteModal(true)}>Delete My Account</button>
              </div>
            </div>
          )}
        </main>
      </div>

      {passwordModal && (
        <div className="pp-modal-overlay" onClick={() => setPasswordModal(false)}>
          <div className="pp-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pp-modal-header">
              <h3>Change Password</h3>
              <button className="pp-modal-close" onClick={() => setPasswordModal(false)}>x</button>
            </div>

            <form className="pp-modal-body" onSubmit={handlePasswordChange}>
              <Field label="Current Password" full>
                <input type="password" value={passwordData.currentPassword} onChange={(e) => setPasswordData((p) => ({ ...p, currentPassword: e.target.value }))} required />
              </Field>
              <Field label="New Password" full>
                <input type="password" value={passwordData.newPassword} onChange={(e) => setPasswordData((p) => ({ ...p, newPassword: e.target.value }))} required />
              </Field>
              <Field label="Confirm New Password" full>
                <input type="password" value={passwordData.confirmPassword} onChange={(e) => setPasswordData((p) => ({ ...p, confirmPassword: e.target.value }))} required />
              </Field>

              <div className="pp-modal-actions">
                <button type="button" className="pp-action-btn" onClick={() => setPasswordModal(false)}>Cancel</button>
                <button type="submit" className="pp-save-btn">Update Password</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteModal && (
        <div className="pp-modal-overlay" onClick={() => setDeleteModal(false)}>
          <div className="pp-modal pp-modal-danger" onClick={(e) => e.stopPropagation()}>
            <div className="pp-modal-header">
              <h3>Delete Account</h3>
              <button className="pp-modal-close" onClick={() => setDeleteModal(false)}>x</button>
            </div>

            <div className="pp-modal-body">
              <p className="pp-danger-modal-text">This action is permanent and cannot be undone.</p>
              <Field label="Confirm with your password" full>
                <input type="password" value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)} />
              </Field>

              <div className="pp-modal-actions">
                <button className="pp-action-btn" onClick={() => setDeleteModal(false)}>Cancel</button>
                <button className="pp-delete-btn" onClick={handleDeleteAccount}>Delete Account</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <AIChatbot />
    </div>
  );
}

function PanelHeader({ title, subtitle }) {
  return (
    <div className="pp-panel-header">
      <h2>{title}</h2>
      <p>{subtitle}</p>
    </div>
  );
}

function Field({ label, children, full }) {
  return (
    <div className={`pp-field ${full ? "pp-field-full" : ""}`}>
      <label>{label}</label>
      {children}
    </div>
  );
}

function PillGroup({ title, items, selected, onToggle }) {
  return (
    <div className="pp-pill-section">
      <label className="pp-pill-label">{title}</label>
      <div className="pp-pill-row">
        {items.map((item) => (
          <button
            key={item}
            type="button"
            className={`pp-pill ${selected.includes(item) ? "pp-pill-on" : ""}`}
            onClick={() => onToggle(item)}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}

function OverviewCard({ label, value }) {
  return (
    <div className="pp-overview-stat">
      <div>
        <div className="pp-ov-label">{label}</div>
        <div className="pp-ov-value">{value}</div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, pill }) {
  return (
    <div className="pp-info-row">
      <span className="pp-info-label">{label}</span>
      <span className={`pp-info-value ${pill ? "pp-role-pill" : ""}`}>{value}</span>
    </div>
  );
}