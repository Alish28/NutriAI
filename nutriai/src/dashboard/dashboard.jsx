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

export default function Dashboard({ onLogout, onOpenProfile, onOpenMarketplace }) {
  const [isMealSidebarOpen, setIsMealSidebarOpen] = useState(false);
  const [isNavSidebarOpen, setIsNavSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showHomecookApp, setShowHomecookApp] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [isHomecookMode, setIsHomecookMode] = useState(false);

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
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
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
          <button className="nav-close-btn" onClick={() => setIsNavSidebarOpen(false)}>✕</button>
        </div>
        <nav className="nav-sidebar-content">

          <button className="nav-item" onClick={() => { setIsMealSidebarOpen(true); setIsNavSidebarOpen(false); }}>
            <span className="nav-icon">🍽️</span>
            <span>Add Meal</span>
          </button>

          <button className="nav-item" onClick={() => { onOpenProfile(); setIsNavSidebarOpen(false); }}>
            <span className="nav-icon">👤</span>
            <span>My Profile</span>
          </button>

          <button className="nav-item" onClick={() => { setIsNavSidebarOpen(false); if (onOpenMarketplace) onOpenMarketplace(); }}>
            <span className="nav-icon">🏪</span>
            <span>Marketplace</span>
          </button>

          {user?.homecook_approved && (
            <>
              <div className="nav-divider" />
              <div className="nav-section-title">Homecook</div>
              <button className="nav-item" onClick={() => { setIsHomecookMode(true); setIsNavSidebarOpen(false); }}>
                <span className="nav-icon">👨‍🍳</span>
                <span>Homecook Dashboard</span>
              </button>
            </>
          )}

          {user?.role === "admin" && (
            <>
              <div className="nav-divider" />
              <div className="nav-section-title">Admin</div>
              <button className="nav-item" onClick={() => { setShowAdminPanel(true); setIsNavSidebarOpen(false); }}>
                <span className="nav-icon">⚡</span>
                <span>Admin Panel</span>
              </button>
            </>
          )}

          <div className="nav-divider" />
          <div className="nav-section-title">Coming Soon</div>
          <button className="nav-item disabled"><span className="nav-icon">📅</span><span>Meal Planner</span></button>
          <button className="nav-item disabled"><span className="nav-icon">🔍</span><span>Recipe Explorer</span></button>
        </nav>
      </aside>

      {/* Sidebar overlay */}
      {isNavSidebarOpen && (
        <div className="nav-sidebar-overlay" onClick={() => setIsNavSidebarOpen(false)} />
      )}

      {/* ── Top Header ── */}
      <header className="dash-header">
        <div className="dash-header-left">
          <button className="hamburger-btn" onClick={() => setIsNavSidebarOpen(!isNavSidebarOpen)} title="Menu">
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
          <button className="icon-btn add-meal-btn" onClick={() => setIsMealSidebarOpen(true)}>
            ➕ Add Meal
          </button>

          <button
            className="icon-btn"
            onClick={() => onOpenMarketplace && onOpenMarketplace()}
            title="Marketplace"
            style={{ background: "#fff7e9", color: "#eea641" }}
          >
            🏪 Marketplace
          </button>

          <button
            className="icon-btn"
            onClick={handleChefButtonClick}
            title={user?.homecook_approved ? "Homecook Dashboard" : "Become a Homecook"}
            style={{
              background: user?.homecook_approved ? "#dcfce7" : "#fff7e9",
              color: user?.homecook_approved ? "#15803d" : "#eea641",
            }}
          >
            👨‍🍳
          </button>

          {user?.role === "admin" && (
            <button
              className="icon-btn"
              onClick={() => setShowAdminPanel(true)}
              title="Admin Panel"
              style={{ background: "#e0f2fe", color: "#0369a1" }}
            >
              ⚡
            </button>
          )}

          <button
            className="avatar-btn"
            onClick={onOpenProfile}
            title={user?.full_name || "User"}
          >
            {user ? getInitials(user.full_name) : "U"}
          </button>

          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      {/* ── Welcome Banner ── */}
      {user && (
        <div className="welcome-banner">
          <div className="welcome-content">
            <h2>{getGreeting()}, {user.full_name.split(" ")[0]}! 👋</h2>
            {user.homecook_approved && (
              <span className="homecook-badge">✨ Approved Homecook</span>
            )}
          </div>
          {userProfile && (
            <div className="welcome-stats">
              {userProfile.health_goals?.length > 0 && (
                <span className="stat-badge">🎯 {userProfile.health_goals.join(", ")}</span>
              )}
              {userProfile.dietary_preferences?.length > 0 && (
                <span className="stat-badge">🥗 {userProfile.dietary_preferences.join(", ")}</span>
              )}
              {userProfile.activity_level && (
                <span className="stat-badge">🏃 {userProfile.activity_level}</span>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Main Content ── */}
      <main className="dash-main">

        {/* Left column — nutrition + AI recommendations */}
        <div className="dash-left-col">
          <NutritionSummary />
          <AIRecommendations />
        </div>

        {/* Right column — pantry */}
        <div className="dash-right-col">
          <PantryTracker />
        </div>

        {/* Full-width analytics row */}
        <section className="analytics-section">
          <div className="analytics-grid">
            <WeeklyChart />
            <StreakTracker />
            <WeeklyAverages />
          </div>
        </section>

        {/* Footer */}
        <footer className="dash-footer">
          <span>© 2025 NutriAI. All rights reserved.</span>
        </footer>

      </main>

      {/* ── Homecook Application Modal ── */}
      {showHomecookApp && (
        <div
          className="modal-overlay"
          onClick={() => setShowHomecookApp(false)}
          style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width:"90%", maxWidth:"900px", maxHeight:"90vh", overflowY:"auto", background:"#fff", borderRadius:"18px" }}
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
          style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width:"95%", maxWidth:"1200px", maxHeight:"90vh", overflowY:"auto", background:"#fff", borderRadius:"18px" }}
          >
            <AdminDashboard onClose={() => setShowAdminPanel(false)} />
          </div>
        </div>
      )}

      {/* ── Meal Sidebar ── */}
      <MealSidebar
        isOpen={isMealSidebarOpen}
        onClose={() => setIsMealSidebarOpen(false)}
      />

      {/* ── Global AI Chatbot ── available on every page via dashboard wrapper */}
      <AIChatbot />

    </div>
  );
}