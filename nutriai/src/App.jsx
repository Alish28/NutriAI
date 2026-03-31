import { useState, useEffect } from "react";
import { getFullProfile } from "./services/api";
import Login from "./login/login.jsx";
import Signup from "./signup/signup.jsx";
import Onboarding from "./onboarding/Onboarding.jsx";
import Dashboard from "./dashboard/dashboard.jsx";
import Profile from "./profile/profile.jsx";
import AdminDashboard from "./admin/adminDashboard.jsx";
import Marketplace from "./marketplace/marketplace.jsx";
import "./App.css";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [requiresOnboarding, setRequiresOnboarding] = useState(false);
  const [currentView, setCurrentView] = useState("login");
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    const token = localStorage.getItem("token");

    // No token — go straight to login, no error needed
    if (!token) {
      setIsAuthenticated(false);
      setLoading(false);
      return;
    }

    // FIX: Check if token looks valid before even calling the API
    // JWT tokens have 3 parts separated by dots
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      console.warn('Invalid token format, clearing...');
      clearAuth();
      setLoading(false);
      return;
    }

    // FIX: Check token expiry from the payload before making API call
    try {
      const payload = JSON.parse(atob(tokenParts[1]));
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) {
        console.warn('Token expired, clearing...');
        clearAuth();
        setLoading(false);
        return;
      }
    } catch {
      // Couldn't decode — clear and go to login
      clearAuth();
      setLoading(false);
      return;
    }

    // Token looks valid, verify with server
    try {
      const response = await getFullProfile();
      const userData = response.data.user;

      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);
      setIsAuthenticated(true);

      if (userData.role === "admin") {
        setIsAdmin(true);
        setRequiresOnboarding(false);
        setCurrentView("adminDashboard");
      } else if (!userData.onboarding_completed) {
        setIsAdmin(false);
        setRequiresOnboarding(true);
        setCurrentView("onboarding");
      } else {
        setIsAdmin(false);
        setRequiresOnboarding(false);
        setCurrentView("dashboard");
      }
    } catch (error) {
      // FIX: Only log as warning, not error — this is expected when token expires
      console.warn("Auth check failed:", error.message);
      clearAuth();
    } finally {
      setLoading(false);
    }
  };

  // FIX: Centralized auth clear function
  const clearAuth = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setIsAuthenticated(false);
    setUser(null);
    setIsAdmin(false);
    setCurrentView("login");
  };

  const handleLoginSuccess = async () => {
    setIsAuthenticated(true);
    await checkAuthStatus();
  };

  const handleSignupSuccess = () => {
    setIsAuthenticated(true);
    setRequiresOnboarding(true);
    setCurrentView("onboarding");
  };

  const handleOnboardingComplete = () => {
    setRequiresOnboarding(false);
    setCurrentView("dashboard");
    const userData = JSON.parse(localStorage.getItem("user") || "{}");
    userData.onboarding_completed = true;
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const handleUserLogout = () => {
    clearAuth();
  };

  // Loading screen
  if (loading) {
    return (
      <div className="app-root" style={{
        display:"flex", alignItems:"center", justifyContent:"center",
        height:"100vh", flexDirection:"column", gap:16,
      }}>
        <div style={{ fontSize:48, animation:"spin 1s linear infinite" }}>🍽️</div>
        <p style={{ fontSize:16, color:"#666", fontWeight:500 }}>Loading NutriAI…</p>
        <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    if (currentView === "signup") {
      return (
        <div className="app-root">
          <Signup onBackToLogin={() => setCurrentView("login")} onSignedUp={handleSignupSuccess}/>
        </div>
      );
    }
    return (
      <div className="app-root">
        <Login onLogin={handleLoginSuccess} onGoToSignup={() => setCurrentView("signup")}/>
      </div>
    );
  }

  if (isAdmin && currentView === "adminDashboard") {
    return <div className="app-root"><AdminDashboard onLogout={handleUserLogout}/></div>;
  }

  if (requiresOnboarding && currentView === "onboarding") {
    return <div className="app-root"><Onboarding onComplete={handleOnboardingComplete}/></div>;
  }

  if (currentView === "profile") {
    return (
      <div className="app-root">
        <Profile onBack={() => setCurrentView("dashboard")} onLogout={handleUserLogout}/>
      </div>
    );
  }

  if (currentView === "marketplace") {
    return (
      <div className="app-root">
        <Marketplace onBack={() => setCurrentView("dashboard")}/>
      </div>
    );
  }

  return (
    <div className="app-root">
      <Dashboard
        onOpenProfile={() => setCurrentView("profile")}
        onOpenMarketplace={() => setCurrentView("marketplace")}
        onLogout={handleUserLogout}
      />
    </div>
  );
}

export default App;