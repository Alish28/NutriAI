import { useState, useEffect } from "react";
import Login from "./login/login.jsx";
import Signup from "./signup/signup.jsx";
import Dashboard from "./dashboard/dashboard.jsx";
import Profile from "./profile/profile.jsx";
import "./App.css";

function App() {
  const [isAuthed, setIsAuthed] = useState(false);
  const [view, setView] = useState("login"); // 'login' | 'signup' | 'dashboard' | 'profile'

  // Check if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthed(true);
      setView("dashboard");
    }
  }, []);

  if (!isAuthed) {
    if (view === "signup") {
      return (
        <div className="app-root">
          <Signup
            onBackToLogin={() => setView("login")}
            onSignedUp={() => {
              setIsAuthed(true);
              setView("dashboard");
            }}
          />
        </div>
      );
    }

    return (
      <div className="app-root">
        <Login
          onLogin={() => {
            setIsAuthed(true);
            setView("dashboard");
          }}
          onGoToSignup={() => setView("signup")}
        />
      </div>
    );
  }

  if (view === "profile") {
    return (
      <div className="app-root">
        <Profile
          onBack={() => setView("dashboard")}
          onLogout={() => {
            setIsAuthed(false);
            setView("login");
          }}
        />
      </div>
    );
  }

  return (
    <div className="app-root">
      <Dashboard
        onOpenProfile={() => setView("profile")}
        onLogout={() => {
          setIsAuthed(false);
          setView("login");
        }}
      />
    </div>
  );
}

export default App;