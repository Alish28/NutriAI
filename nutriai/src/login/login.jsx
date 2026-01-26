import { useState } from "react";
import { login as loginAPI } from "../services/api";
import "./login.css";

export default function Login({ onLogin, onGoToSignup }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setError("");
    
    if (!email || !password) {
      setError("Please fill in email and password");
      return;
    }

    setLoading(true);

    try {
      const response = await loginAPI({ email, password });
      
      // Save token and user to localStorage
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      // Call parent component's onLogin
      if (onLogin) onLogin();
      
    } catch (err) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-overlay">
          <h1>NutriAI</h1>
          <p>Smart meal planning, less waste, healthier you.</p>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-card">
          <h2 className="auth-heading">Welcome back</h2>
          <p className="auth-subtext">
            Log in to view your personalized NutriAI dashboard.
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
              <label>Email</label>
              <div className="input-pill">
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  className="eye"
                  onClick={() => setShow((s) => !s)}
                >
                  {show ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
            </div>

            <button className="primary" type="submit" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>

            <p className="auth-footer">
              Don&apos;t have an account?{" "}
              <button
                type="button"
                className="link-btn"
                onClick={onGoToSignup}
                disabled={loading}
              >
                Sign up
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}