import { useState } from "react";
import { register as registerAPI } from "../services/api";
import "./signup.css";

export default function Signup({ onBackToLogin, onSignedUp }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
    hasDietary: false,
    enableAi: false,
  });
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function change(e) {
    const { name, type, checked, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function submit(e) {
    e.preventDefault();
    setError("");
    
    if (!form.name || !form.email || !form.password || !form.confirm) {
      setError("Please fill in all fields");
      return;
    }
    if (form.password.length < 6) {
      setError("Password should be at least 6 characters");
      return;
    }
    if (form.password !== form.confirm) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const response = await registerAPI({
        email: form.email,
        password: form.password,
        full_name: form.name,
      });
      
      // Save token and user to localStorage
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      // Call parent component's onSignedUp
      if (onSignedUp) onSignedUp();
      
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-overlay">
          <h1>NutriAI</h1>
          <p>Discover meals that match your goals and lifestyle.</p>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-card signup-card">
          <h2 className="auth-heading center">Welcome to NutriAI!</h2>
          <h3 className="auth-title">Create your NutriAI account</h3>
          <p className="auth-subtext">
            Start your journey to healthier, sustainable eating today!
          </p>

          {error && (
            <div style={{
              padding: '12px',
              backgroundColor: '#fee',
              color: '#c00',
              borderRadius: '8px',
              marginBottom: '16px',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          <form className="form" onSubmit={submit}>
            <div className="input-group">
              <label>Full Name</label>
              <div className="input-pill">
                <input
                  name="name"
                  value={form.name}
                  onChange={change}
                  placeholder="Full Name"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label>Email</label>
              <div className="input-pill">
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={change}
                  placeholder="Email"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label>Password</label>
              <div className="input-pill">
                <input
                  type={show ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={change}
                  placeholder="Password"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label>Confirm Password</label>
              <div className="input-pill">
                <input
                  type={show ? "text" : "password"}
                  name="confirm"
                  value={form.confirm}
                  onChange={change}
                  placeholder="Confirm Password"
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  className="eye"
                  onClick={() => setShow((s) => !s)}
                  disabled={loading}
                >
                  {show ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
            </div>

            <button className="primary primary-wide" type="submit" disabled={loading}>
              {loading ? "Creating Account..." : "Create Account"}
            </button>

            <p className="auth-footer center">
              Already have an account?{" "}
              <button
                type="button"
                className="link-btn"
                onClick={onBackToLogin}
                disabled={loading}
              >
                Sign in
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}