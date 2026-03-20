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
  // currentView values: "login" | "signup" | "onboarding" | "dashboard" | "profile" | "marketplace" | "adminDashboard"
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setIsAuthenticated(false);
      setLoading(false);
      return;
    }

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
      console.error("Auth check failed:", error);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setIsAuthenticated(false);
      setUser(null);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
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
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setIsAuthenticated(false);
    setRequiresOnboarding(false);
    setCurrentView("login");
    setUser(null);
    setIsAdmin(false);
  };

  // Loading screen
  if (loading) {
    return (
      <div
        className="app-root"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          fontSize: "18px",
          color: "#666",
        }}
      >
        Loading...
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    if (currentView === "signup") {
      return (
        <div className="app-root">
          <Signup
            onBackToLogin={() => setCurrentView("login")}
            onSignedUp={handleSignupSuccess}
          />
        </div>
      );
    }
    return (
      <div className="app-root">
        <Login
          onLogin={handleLoginSuccess}
          onGoToSignup={() => setCurrentView("signup")}
        />
      </div>
    );
  }

  // Admin dashboard
  if (isAdmin && currentView === "adminDashboard") {
    return (
      <div className="app-root">
        <AdminDashboard onLogout={handleUserLogout} />
      </div>
    );
  }

  // Onboarding (regular users only)
  if (requiresOnboarding && currentView === "onboarding") {
    return (
      <div className="app-root">
        <Onboarding onComplete={handleOnboardingComplete} />
      </div>
    );
  }

  // Profile page
  if (currentView === "profile") {
    return (
      <div className="app-root">
        <Profile
          onBack={() => setCurrentView("dashboard")}
          onLogout={handleUserLogout}
        />
      </div>
    );
  }

  // Marketplace page
  if (currentView === "marketplace") {
    return (
      <div className="app-root">
        <Marketplace onBack={() => setCurrentView("dashboard")} />
      </div>
    );
  }

  // Dashboard (default for regular users)
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