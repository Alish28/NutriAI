import { useState, useEffect } from "react";
import { logout, getFullProfile } from "../services/api";
import "./dashboard.css";
import MealSidebar from "../meal-sidebar/mealsidebar.jsx";
import NutritionSummary from "../components/NutritionSummary.jsx";
import WeeklyChart from "../analytics/weeklyChart.jsx";
import StreakTracker from "../analytics/streakTracker.jsx";
import WeeklyAverages from "../analytics/weeklyAverages.jsx";
import AIRecommendations from "../components/aiRecommendations.jsx";
import PantryTracker from "../components/pantryTracker.jsx";
import HomecookApplication from "../components/homecookApplications.jsx";
import HomecookDashboard from "../homecook/homecookDashboard.jsx";
import AdminDashboard from "../admin/adminDashboard.jsx";
import AIChatbot from "../components/aiChatbot.jsx";
import WeeklyMealPlan from "../components/weeklyMealPlan.jsx";

export default function Dashboard({
  onLogout,
  onOpenProfile,
  onOpenMarketplace,
}) {
  const [isMealSidebarOpen, setIsMealSidebarOpen] = useState(false);
  const [isNavSidebarOpen, setIsNavSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showHomecookApp, setShowHomecookApp] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [isHomecookMode, setIsHomecookMode] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("nutriai-theme") === "dark";
  });

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute(
      "data-theme",
      darkMode ? "dark" : "light",
    );
    localStorage.setItem("nutriai-theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  useEffect(() => {
    const loadUserData = async () => {
      const userData = localStorage.getItem("user");
      if (userData) {
        setUser(JSON.parse(userData));
        try {
          const profileResponse = await getFullProfile();
          setUserProfile(profileResponse.data.user);
        } catch (error) {
          console.error("Error loading profile:", error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };
    loadUserData();
  }, []);

  const handleLogout = () => {
    logout();
    if (onLogout) onLogout();
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const handleChefButtonClick = () => {
    if (user?.homecook_approved) {
      setIsHomecookMode(true);
    } else {
      setShowHomecookApp(true);
    }
  };

  if (isHomecookMode && user?.homecook_approved) {
    return (
      <HomecookDashboard
        user={user}
        onSwitchToConsumer={() => setIsHomecookMode(false)}
      />
    );
  }

  return (
    <div className="dashboard-page">
      {/* ── Navigation Sidebar ── */}
      <aside className={`nav-sidebar ${isNavSidebarOpen ? "open" : ""}`}>
        <div className="nav-sidebar-header">
          <h3>Menu</h3>
          <button
            className="nav-close-btn"
            onClick={() => setIsNavSidebarOpen(false)}
          >
            ✕
          </button>
        </div>
        <nav className="nav-sidebar-content">
          <button
            className="nav-item"
            onClick={() => {
              setIsMealSidebarOpen(true);
              setIsNavSidebarOpen(false);
            }}
          >
            <span className="nav-icon">🍽️</span>
            <span>Add Meal</span>
          </button>

          <button
            className="nav-item"
            onClick={() => {
              onOpenProfile();
              setIsNavSidebarOpen(false);
            }}
          >
            <span className="nav-icon">👤</span>
            <span>My Profile</span>
          </button>

          <button
            className="nav-item"
            onClick={() => {
              setIsNavSidebarOpen(false);
              if (onOpenMarketplace) onOpenMarketplace();
            }}
          >
            <span className="nav-icon">🏪</span>
            <span>Marketplace</span>
          </button>

          {user?.homecook_approved && (
            <>
              <div className="nav-divider" />
              <div className="nav-section-title">Homecook</div>
              <button
                className="nav-item"
                onClick={() => {
                  setIsHomecookMode(true);
                  setIsNavSidebarOpen(false);
                }}
              >
                <span className="nav-icon">👨‍🍳</span>
                <span>Homecook Dashboard</span>
              </button>
            </>
          )}

          {user?.role === "admin" && (
            <>
              <div className="nav-divider" />
              <div className="nav-section-title">Admin</div>
              <button
                className="nav-item"
                onClick={() => {
                  setShowAdminPanel(true);
                  setIsNavSidebarOpen(false);
                }}
              >
                <span className="nav-icon">⚡</span>
                <span>Admin Panel</span>
              </button>
            </>
          )}

          {/* Dark mode toggle in sidebar */}
          <div className="nav-divider" />
          <button className="nav-item" onClick={() => setDarkMode((d) => !d)}>
            <span className="nav-icon">{darkMode ? "☀️" : "🌙"}</span>
            <span>{darkMode ? "Light Mode" : "Dark Mode"}</span>
          </button>
        </nav>
      </aside>

      {isNavSidebarOpen && (
        <div
          className="nav-sidebar-overlay"
          onClick={() => setIsNavSidebarOpen(false)}
        />
      )}

      {/* ── Top Header ── */}
      <header className="dash-header">
        <div className="dash-header-left">
          <button
            className="hamburger-btn"
            onClick={() => setIsNavSidebarOpen(!isNavSidebarOpen)}
            title="Menu"
          >
            <span className="hamburger-line" />
            <span className="hamburger-line" />
            <span className="hamburger-line" />
          </button>
          <div className="dash-logo">
            <span className="logo-mark">🍽</span>
            <span className="logo-text">NutriAI</span>
          </div>
        </div>

        <div className="dash-search">
          <input placeholder="Search recipes, meals..." />
        </div>

        <div className="dash-header-right">
          <button
            className="icon-btn add-meal-btn"
            onClick={() => setIsMealSidebarOpen(true)}
          >
            ➕ Add Meal
          </button>

          <button
            className="icon-btn"
            onClick={() => onOpenMarketplace && onOpenMarketplace()}
            title="Marketplace"
          >
            🏪 Marketplace
          </button>

          <button
            className="icon-btn chef-btn"
            onClick={handleChefButtonClick}
            title={
              user?.homecook_approved
                ? "Homecook Dashboard"
                : "Become a Homecook"
            }
            data-approved={user?.homecook_approved ? "true" : "false"}
          >
            👨‍🍳
          </button>

          {user?.role === "admin" && (
            <button
              className="icon-btn admin-btn"
              onClick={() => setShowAdminPanel(true)}
              title="Admin Panel"
            >
              ⚡
            </button>
          )}

          {/* Dark mode toggle */}
          <button
            className="icon-btn dark-toggle-btn"
            onClick={() => setDarkMode((d) => !d)}
            title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {darkMode ? "☀️" : "🌙"}
          </button>

          <button
            className="avatar-btn"
            onClick={onOpenProfile}
            title={user?.full_name || "User"}
          >
            {user ? getInitials(user.full_name) : "U"}
          </button>

          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      {/* ── Welcome Banner ── */}
      {user && (
        <div className="welcome-banner">
          <div className="welcome-content">
            <h2>
              {getGreeting()}, {user.full_name.split(" ")[0]}! 👋
            </h2>
            {user.homecook_approved && (
              <span className="homecook-badge">✨ Approved Homecook</span>
            )}
          </div>
          {userProfile && (
            <div className="welcome-stats">
              {userProfile.health_goals?.length > 0 && (
                <span className="stat-badge">
                  🎯 {userProfile.health_goals.join(", ")}
                </span>
              )}
              {userProfile.dietary_preferences?.length > 0 && (
                <span className="stat-badge">
                  🥗 {userProfile.dietary_preferences.join(", ")}
                </span>
              )}
              {userProfile.activity_level && (
                <span className="stat-badge">
                  🏃 {userProfile.activity_level}
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Main Content ── */}
      <main className="dash-main">
        <div className="dashboard-layout">
          <section className="dashboard-column dashboard-column-main">
            <div className="dashboard-tile">
              <NutritionSummary />
            </div>

            <div className="dashboard-tile">
              <AIRecommendations />
            </div>

            <div className="dashboard-tile">
              <WeeklyChart />
            </div>
          </section>

          <section className="dashboard-column dashboard-column-side">
            <div className="dashboard-tile">
              <WeeklyMealPlan />
            </div>

            <div className="dashboard-tile">
              <PantryTracker />
            </div>

            <div className="dashboard-tile">
              <StreakTracker />
            </div>

            <div className="dashboard-tile">
              <WeeklyAverages />
            </div>
          </section>
        </div>

        <footer className="dash-footer">
          <span>© 2026 NutriAI. All rights reserved.</span>
        </footer>
      </main>

      {/* ── Homecook Application Modal ── */}
      {showHomecookApp && (
        <div
          className="modal-overlay"
          onClick={() => setShowHomecookApp(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "90%",
              maxWidth: "900px",
              maxHeight: "90vh",
              overflowY: "auto",
              background: "var(--dm-card)",
              borderRadius: "18px",
            }}
          >
            <HomecookApplication
              onClose={() => setShowHomecookApp(false)}
              onGoToDashboard={() => {
                setShowHomecookApp(false);
                if (user?.homecook_approved) setIsHomecookMode(true);
              }}
            />
          </div>
        </div>
      )}

      {/* ── Admin Panel Modal ── */}
      {showAdminPanel && (
        <div
          className="modal-overlay"
          onClick={() => setShowAdminPanel(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "95%",
              maxWidth: "1200px",
              maxHeight: "90vh",
              overflowY: "auto",
              background: "var(--dm-card)",
              borderRadius: "18px",
            }}
          >
            <AdminDashboard onClose={() => setShowAdminPanel(false)} />
          </div>
        </div>
      )}

      <MealSidebar
        isOpen={isMealSidebarOpen}
        onClose={() => setIsMealSidebarOpen(false)}
      />

      <AIChatbot />
    </div>
  );
}
