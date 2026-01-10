import { useState } from "react";
import "./login.css";

export default function Login({ onLogin, onGoToSignup }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);

  function submit(e) {
    e.preventDefault();
    if (!email || !password) {
      alert("Please fill in email and password");
      return;
    }
    if (onLogin) onLogin();
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

          <form className="form" onSubmit={submit}>
            <div className="input-group">
              <label>Email</label>
              <div className="input-pill">
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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

            <button className="primary" type="submit">
              Login
            </button>

            <p className="auth-footer">
              Don&apos;t have an account?{" "}
              <button
                type="button"
                className="link-btn"
                onClick={onGoToSignup}
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