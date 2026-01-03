import { useState } from "react";
import Login from "./login/login.jsx";
import Signup from "./signup/signup.jsx";
import Dashboard from "./dashboard/dashboard.jsx";
import Profile from "./profile/profile.jsx";
import "./App.css";

function App() {
  const [isAuthed, setIsAuthed] = useState(false);
  const [view, setView] = useState("login"); // 'login' | 'signup' | 'dashboard' | 'profile'

  if (!isAuthed) {
    if (view === "signup") {
      return (
        <Signup
          onBackToLogin={() => setView("login")}
          onSignedUp={() => {
            setIsAuthed(true);
            setView("dashboard");
          }}
        />
      );
    }

    return (
      <Login
        onLogin={() => {
          setIsAuthed(true);
          setView("dashboard");
        }}
        onGoToSignup={() => setView("signup")}
      />
    );
  }

  if (view === "profile") {
    return (
      <Profile
        onBack={() => setView("dashboard")}
        onLogout={() => {
          setIsAuthed(false);
          setView("login");
        }}
      />
    );
  }

  return (
    <Dashboard
      onOpenProfile={() => setView("profile")}
      onLogout={() => {
        setIsAuthed(false);
        setView("login");
      }}
    />
  );
}

export default App;
