import { useState, useEffect } from "react";
import Login from "./login/login.jsx";
import Signup from "./signup/signup.jsx";
import Onboarding from "./onboarding/Onboarding.jsx";
import Dashboard from "./dashboard/dashboard.jsx";
import Profile from "./profile/profile.jsx";
import "./App.css";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [requiresOnboarding, setRequiresOnboarding] = useState(false);
  const [currentView, setCurrentView] = useState("login"); // 'login' | 'signup' | 'onboarding' | 'dashboard' | 'profile'

  // Check authentication and onboarding status on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userString = localStorage.getItem('user');
    
    if (token && userString) {
      setIsAuthenticated(true);
      const userData = JSON.parse(userString);
      
      // Check if user has completed onboarding
      const hasCompletedOnboarding = userData.onboarding_completed || false;
      
      if (!hasCompletedOnboarding) {
        setRequiresOnboarding(true);
        setCurrentView("onboarding");
      } else {
        setCurrentView("dashboard");
      }
    }
  }, []);

  const handleSignupSuccess = () => {
    setIsAuthenticated(true);
    setRequiresOnboarding(true);
    setCurrentView("onboarding");
  };

  const handleOnboardingComplete = () => {
    setRequiresOnboarding(false);
    setCurrentView("dashboard");
  };

  const handleUserLogout = () => {
    setIsAuthenticated(false);
    setRequiresOnboarding(false);
    setCurrentView("login");
  };

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
          onLogin={() => {
            setIsAuthenticated(true);
            setCurrentView("dashboard");
          }}
          onGoToSignup={() => setCurrentView("signup")}
        />
      </div>
    );
  }

  // Authenticated but needs onboarding
  if (requiresOnboarding && currentView === "onboarding") {
    return (
      <div className="app-root">
        <Onboarding onComplete={handleOnboardingComplete} />
      </div>
    );
  }

  // Show profile page
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

  // Show dashboard
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