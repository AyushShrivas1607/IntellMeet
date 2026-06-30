import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { FaBolt, FaUsers, FaRobot } from "react-icons/fa";
import "./auth.css";

function Register() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    if (!name.trim() || !email.trim() || !password.trim()) {
      setError("Please fill in all fields.");
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      await axios.post("http://localhost:5000/api/auth/register", {
        name,
        email,
        password,
      });

      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
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
            Set up in <span className="accent">under a minute.</span>
          </h1>

          <p className="lede">
            Create your account and start hosting meetings with real
            host controls, hand-raising, and AI-generated summaries.
          </p>

          <div className="auth-feature-list">
            <div className="auth-feature">
              <span className="icon"><FaUsers /></span>
              You're the host by default — mute anyone, anytime.
            </div>
            <div className="auth-feature">
              <span className="icon"><FaBolt /></span>
              Participants raise hands instead of interrupting.
            </div>
            <div className="auth-feature">
              <span className="icon"><FaRobot /></span>
              Walk away with a written summary, every time.
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT — form */}
      <div className="auth-form-side">
        <div className="auth-card">
          <div className="mobile-logo">IntellMeet</div>

          <h2>Create account</h2>
          <p className="sub">Get started for free</p>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleRegister} className="auth-form">
            <label className="auth-label">Name</label>
            <input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="auth-input"
              disabled={loading}
            />

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
              placeholder="Min. 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="auth-input"
              disabled={loading}
            />

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <p className="auth-footer">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;