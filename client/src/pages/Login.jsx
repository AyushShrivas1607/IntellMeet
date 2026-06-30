import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { FaBolt, FaUsers, FaRobot } from "react-icons/fa";
import "./auth.css";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Please fill in all fields.");
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post("http://localhost:5000/api/auth/login", {
        email,
        password,
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("userId", res.data.user.id);
      localStorage.setItem("userName", res.data.user.name);

      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* LEFT — brand panel */}
      <div className="auth-brand">
        <div className="signal-rings">
          <div className="signal-ring" />
          <div className="signal-ring" />
          <div className="signal-ring" />
        </div>

        <div className="auth-brand-content">
          <div className="auth-logo">
            <span className="dot" />
            IntellMeet
          </div>

          <h1>
            Meetings that <span className="accent">run themselves.</span>
          </h1>

          <p className="lede">
            Host controls, live hand-raising, and AI-written summaries —
            built for teams who don't have time to take notes.
          </p>

          <div className="auth-feature-list">
            <div className="auth-feature">
              <span className="icon"><FaUsers /></span>
              Real host controls — mute all or any participant, instantly.
            </div>
            <div className="auth-feature">
              <span className="icon"><FaBolt /></span>
              Raise hand, no awkward unmuting to ask a question.
            </div>
            <div className="auth-feature">
              <span className="icon"><FaRobot /></span>
              Every meeting ends with an AI summary and action items.
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT — form */}
      <div className="auth-form-side">
        <div className="auth-card">
          <div className="mobile-logo">IntellMeet</div>

          <h2>Welcome back</h2>
          <p className="sub">Sign in to your account</p>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleLogin} className="auth-form">
            <label className="auth-label">Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="auth-input"
              disabled={loading}
            />

            <label className="auth-label">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="auth-input"
              disabled={loading}
            />

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className="auth-footer">
            Don't have an account? <Link to="/register">Register</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;