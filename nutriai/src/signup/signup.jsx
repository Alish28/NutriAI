import { useState } from "react";
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

  function change(e) {
    const { name, type, checked, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function submit(e) {
    e.preventDefault();
    if (!form.name || !form.email || !form.password || !form.confirm) {
      alert("Please fill in all fields");
      return;
    }
    if (form.password.length < 6) {
      alert("Password should be at least 6 characters");
      return;
    }
    if (form.password !== form.confirm) {
      alert("Passwords do not match");
      return;
    }

    // For now: simulate success and go to dashboard
    console.log("signup", form);
    if (onSignedUp) onSignedUp();
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

          <form className="form" onSubmit={submit}>
            <div className="input-group">
              <label>Full Name</label>
              <div className="input-pill">
                <input
                  name="name"
                  value={form.name}
                  onChange={change}
                  placeholder="Full Name"
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

            <label className="checkbox-row">
              <input
                type="checkbox"
                name="hasDietary"
                checked={form.hasDietary}
                onChange={change}
              />
              <span>I have dietary restrictions</span>
            </label>

            <label className="checkbox-row">
              <input
                type="checkbox"
                name="enableAi"
                checked={form.enableAi}
                onChange={change}
              />
              <span>Enable personalized nutrition suggestions</span>
            </label>

            <button className="primary primary-wide" type="submit">
              Create Account
            </button>

            <p className="auth-footer center">
              Already have an account?{" "}
              <button
                type="button"
                className="link-btn"
                onClick={onBackToLogin}
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