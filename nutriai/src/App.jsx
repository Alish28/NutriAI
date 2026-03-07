import { useState, useEffect } from "react";
import { getFullProfile } from "./services/api";
import Login from "./login/login.jsx";
import Signup from "./signup/signup.jsx";
import Onboarding from "./onboarding/Onboarding.jsx";
import Dashboard from "./dashboard/dashboard.jsx";
import Profile from "./profile/profile.jsx";
import AdminDashboard from "./admin/adminDashboard.jsx";
import "./App.css";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [requiresOnboarding, setRequiresOnboarding] = useState(false);
  const [currentView, setCurrentView] = useState("login");
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false); // ADD THIS

  // Check authentication and onboarding status on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      setIsAuthenticated(false);
      setLoading(false);
      return;
    }

    try {
      const response = await getFullProfile();
      const userData = response.data.user;
      
      // Update localStorage with fresh data
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData); // ADD THIS
      
      setIsAuthenticated(true);
      
      // CHECK IF USER IS ADMIN
      if (userData.role === 'admin') {
        setIsAdmin(true);
        setCurrentView("adminDashboard");
        setRequiresOnboarding(false); // Admins don't need onboarding
      } 
      // Check onboarding status from FRESH server data
      else if (!userData.onboarding_completed) {
        setIsAdmin(false);
        setRequiresOnboarding(true);
        setCurrentView("onboarding");
      } else {
        setIsAdmin(false);
        setRequiresOnboarding(false);
        setCurrentView("dashboard");
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      // Token invalid, clear and show login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setIsAuthenticated(false);
      setUser(null);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSuccess = async () => {
    // After login, check onboarding status
    setIsAuthenticated(true);
    await checkAuthStatus(); // This will determine if admin or needs onboarding
  };

  const handleSignupSuccess = () => {
    setIsAuthenticated(true);
    setRequiresOnboarding(true);
    setCurrentView("onboarding");
  };

  const handleOnboardingComplete = () => {
    setRequiresOnboarding(false);
    setCurrentView("dashboard");
    
    // Update localStorage
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    userData.onboarding_completed = true;
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleUserLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setRequiresOnboarding(false);
    setCurrentView("login");
    setUser(null);
    setIsAdmin(false);
  };

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="app-root" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        fontSize: '18px',
        color: '#666'
      }}>
        Loading...
      </div>
    );
  }

  // Not authenticated - show login or signup
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

  // ====================================
  // ADMIN DASHBOARD (NEW SECTION)
  // ====================================
  if (isAdmin && currentView === "adminDashboard") {
    return (
      <div className="app-root">
        <AdminDashboard
          onLogout={handleUserLogout}
        />
      </div>
    );
  }

  // Authenticated but needs onboarding (regular users only)
  if (requiresOnboarding && currentView === "onboarding") {
    return (
      <div className="app-root">
        <Onboarding onComplete={handleOnboardingComplete} />
      </div>
    );
  }

  // Show profile page (regular users only)
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

  // Show dashboard (regular users only)
  return (
    <div className="app-root">
      <Dashboard
        onOpenProfile={() => setCurrentView("profile")}
        onLogout={handleUserLogout}
      />
    </div>
  );
}

export default App;