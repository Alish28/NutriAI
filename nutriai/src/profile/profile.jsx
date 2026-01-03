import "./profile.css";

export default function Profile({ onBack }) {
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
        <h1 className="profile-title">User Profile &amp; Customization</h1>

        <div className="profile-grid">
          {/* Profile overview */}
          <section className="p-card">
            <div className="p-card-header">
              <h3>Profile Overview</h3>
            </div>
            <div className="p-card-body profile-overview">
              <div className="profile-avatar">
                <img
                  src=""
                  alt="User"
                />
              </div>
              <h2>User</h2>
              <p className="muted">user@example.com</p>
              <span className="badge premium">Premium Member</span>
              <button className="btn-outline">Edit Profile</button>
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
                <input defaultValue="User00" />
              </div>
              <div className="field">
                <label>Age</label>
                <input defaultValue="32" />
              </div>
              <div className="field">
                <label>Gender</label>
                <select defaultValue="Male">
                  <option>Female</option>
                  <option>Male</option>
                  <option>Other</option>
                </select>
              </div>
              <div className="field">
                <label>Weight (kg)</label>
                <input defaultValue="65" />
              </div>
              <div className="field">
                <label>Height (cm)</label>
                <input defaultValue="168" />
              </div>
              <div className="field">
                <label>Activity Level</label>
                <select defaultValue="Moderate">
                  <option>Sedentary</option>
                  <option>Light</option>
                  <option>Moderate</option>
                  <option>Active</option>
                </select>
              </div>
              <div className="field field-full">
                <label>Health Goals</label>
                <div className="pill-row">
                  <span className="pill pill-selected">Weight Management</span>
                  <span className="pill pill-selected">Muscle Gain</span>
                </div>
              </div>
              <div className="form-actions">
                <button className="btn-outline">Cancel</button>
                <button className="btn-primary">Save Changes</button>
              </div>
            </div>
          </section>

          {/* Dietary preferences */}
          <section className="p-card">
            <div className="p-card-header">
              <h3>Dietary Preferences &amp; Restrictions</h3>
            </div>
            <div className="p-card-body">
              <div className="pill-row">
                <span className="pill pill-toggle on">Vegan</span>
                <span className="pill pill-toggle">Vegetarian</span>
                <span className="pill pill-toggle on">Gluten-Free</span>
                <span className="pill pill-toggle">Dairy-Free</span>
              </div>

              <div className="checkbox-grid">
                <label><input type="checkbox" /> Nut Allergy</label>
                <label><input type="checkbox" defaultChecked /> Soy Allergy</label>
                <label><input type="checkbox" /> Shellfish Allergy</label>
              </div>

              <div className="field">
                <label>Custom Allergies</label>
                <input placeholder="Add custom allergies" defaultValue="Pineapple" />
              </div>
            </div>
          </section>

          {/* Cultural preferences */}
          <section className="p-card">
            <div className="p-card-header">
              <h3>Cultural &amp; Cuisine Preferences</h3>
            </div>
            <div className="p-card-body">
              <label className="field">
                <span>Preferred Cuisines</span>
                <div className="pill-row">
                  <span className="pill pill-selected">Italian</span>
                  <span className="pill pill-selected">Mexican</span>
                  <span className="pill pill-selected">Indian</span>
                </div>
              </label>
              <div className="switch-row">
                <span>Prioritize Local/Nepali Dishes</span>
                <label className="switch">
                  <input type="checkbox" defaultChecked />
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
                <label>Daily Food Budget: $25</label>
                <input type="range" min="10" max="50" defaultValue="25" />
              </div>
              <div className="field">
                <label>Weekly Food Budget: $150</label>
                <input type="range" min="50" max="300" defaultValue="150" />
              </div>
              <div className="field">
                <label>Preferred Shopping Style</label>
                <div className="pill-row">
                  <span className="pill pill-selected">Budget-conscious</span>
                  <span className="pill">Organic Focus</span>
                  <span className="pill">Convenience First</span>
                </div>
              </div>
            </div>
          </section>

          {/* Inventory settings */}
          <section className="p-card">
            <div className="p-card-header">
              <h3>Inventory &amp; Home Cooking Settings</h3>
            </div>
            <div className="p-card-body">
              <div className="switch-row">
                <span>Pantry Tracking</span>
                <label className="switch">
                  <input type="checkbox" defaultChecked />
                  <span className="slider" />
                </label>
              </div>
              <div className="switch-row">
                <span>Leftover Alerts</span>
                <label className="switch">
                  <input type="checkbox" defaultChecked />
                  <span className="slider" />
                </label>
              </div>
              <div className="switch-row">
                <span>Smart Expiry Notifications</span>
                <label className="switch">
                  <input type="checkbox" defaultChecked />
                  <span className="slider" />
                </label>
              </div>
              <div className="field">
                <label>Preferred Serving Size</label>
                <select defaultValue="2">
                  <option value="1">1 person</option>
                  <option value="2">2 people</option>
                  <option value="4">4 people</option>
                </select>
              </div>
              <div className="switch-row">
                <span>Homecook Marketplace Access</span>
                <label className="switch">
                  <input type="checkbox" />
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
                <label>Personalization Strength: 75%</label>
                <input type="range" min="0" max="100" defaultValue="75" />
              </div>
              <label className="field">
                <span>Nutrition Focus</span>
                <div className="pill-row">
                  <span className="pill pill-selected">Balanced Macros</span>
                  <span className="pill pill-selected">High Protein</span>
                </div>
              </label>
              <div className="switch-row">
                <span>AI Auto-adjust Meal Plans</span>
                <label className="switch">
                  <input type="checkbox" defaultChecked />
                  <span className="slider" />
                </label>
              </div>
            </div>
          </section>

          {/* Privacy & account */}
          <section className="p-card">
            <div className="p-card-header">
              <h3>Privacy &amp; Account Settings</h3>
            </div>
            <div className="p-card-body">
              <button className="btn-outline">Change Password</button>

              <div className="section-subtitle">Notification Management</div>
              <div className="switch-row">
                <span>Email Notifications</span>
                <label className="switch">
                  <input type="checkbox" defaultChecked />
                  <span className="slider" />
                </label>
              </div>
              <div className="switch-row">
                <span>SMS Notifications</span>
                <label className="switch">
                  <input type="checkbox" />
                  <span className="slider" />
                </label>
              </div>

              <div className="section-subtitle">Data &amp; Privacy Options</div>
              <div className="switch-row">
                <span>Allow Data Sharing</span>
                <label className="switch">
                  <input type="checkbox" />
                  <span className="slider" />
                </label>
              </div>

              <button className="btn-outline">Download My Data</button>
              <button className="btn-danger">Delete Account</button>
            </div>
          </section>
        </div>

        <button className="btn-outline back-btn" onClick={onBack}>
          ← Back to Dashboard
        </button>
      </main>
    </div>
  );
}
