import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { API_BASE_URL } from "../config";

function Register() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1 = fill form, 2 = enter OTP
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  // Step 1 — send OTP
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError(""); setInfo("");

    if (!name.trim() || !email.trim() || !password.trim()) {
      return setError("Please fill in all fields.");
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      return setError("Please enter a valid email address.");
    }
    if (password.length < 6) {
      return setError("Password must be at least 6 characters.");
    }

    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/api/auth/send-otp`, { name, email });
      setInfo(`OTP sent to ${email}. Check your inbox.`);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2 — verify OTP + complete registration
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError(""); setInfo("");

    if (!otp.trim() || otp.length !== 6) {
      return setError("Please enter the 6-digit OTP from your email.");
    }

    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/api/auth/register`, { name, email, password, otp });
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.logo}>🚀 IntellMeet</h1>
        <h2 style={styles.heading}>Create account</h2>
        <p style={styles.sub}>
          {step === 1 ? "Get started for free" : "Enter the 6-digit code sent to your email"}
        </p>

        {/* Step indicator */}
        <div style={styles.steps}>
          <div style={{ ...styles.step, ...(step >= 1 ? styles.stepActive : {}) }}>1</div>
          <div style={styles.stepLine} />
          <div style={{ ...styles.step, ...(step >= 2 ? styles.stepActive : {}) }}>2</div>
        </div>

        {error && <div style={styles.error}>{error}</div>}
        {info && <div style={styles.infoBox}>{info}</div>}

        {step === 1 && (
          <form onSubmit={handleSendOTP} style={styles.form}>
            <label style={styles.label}>Full Name</label>
            <input type="text" placeholder="Your name" value={name}
              onChange={(e) => setName(e.target.value)} style={styles.input} disabled={loading} />

            <label style={styles.label}>Email</label>
            <input type="email" placeholder="you@example.com" value={email}
              onChange={(e) => setEmail(e.target.value)} style={styles.input} disabled={loading} />

            <label style={styles.label}>Password</label>
            <input type="password" placeholder="Min. 6 characters" value={password}
              onChange={(e) => setPassword(e.target.value)} style={styles.input} disabled={loading} />

            <button type="submit" style={styles.btn} disabled={loading}>
              {loading ? "Sending OTP..." : "Send Verification Code"}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyOTP} style={styles.form}>
            <label style={styles.label}>Verification Code</label>
            <input
              type="text"
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              style={{ ...styles.input, textAlign: "center", fontSize: 22, letterSpacing: 8, fontWeight: 700 }}
              disabled={loading}
              maxLength={6}
              autoFocus
            />

            <button type="submit" style={styles.btn} disabled={loading || otp.length < 6}>
              {loading ? "Verifying..." : "Verify & Create Account"}
            </button>

            <button
              type="button"
              onClick={() => { setStep(1); setOtp(""); setError(""); setInfo(""); }}
              style={styles.backBtn}
            >
              ← Change email or resend
            </button>
          </form>
        )}

        <p style={styles.footer}>
          Already have an account?{" "}
          <Link to="/login" style={styles.link}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "#0f172a", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" },
  card: { background: "#111827", borderRadius: 16, padding: 40, width: "100%", maxWidth: 420, boxShadow: "0 20px 60px rgba(0,0,0,0.4)", border: "1px solid #1f2937", color: "#f1f5f9" },
  logo: { color: "#38bdf8", fontSize: 22, marginBottom: 24, fontWeight: 800 },
  heading: { color: "#f1f5f9", fontSize: 26, fontWeight: 700, marginBottom: 6 },
  sub: { color: "#94a3b8", fontSize: 15, marginBottom: 20 },
  steps: { display: "flex", alignItems: "center", marginBottom: 24 },
  step: { width: 32, height: 32, borderRadius: "50%", background: "#1e293b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#64748b", flexShrink: 0 },
  stepActive: { background: "#2563eb", color: "#fff" },
  stepLine: { flex: 1, height: 2, background: "#1e293b", margin: "0 8px" },
  error: { background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", borderRadius: 8, padding: "12px 14px", fontSize: 14, marginBottom: 20 },
  infoBox: { background: "rgba(37,99,235,0.15)", color: "#93c5fd", border: "1px solid #2563eb", borderRadius: 8, padding: "12px 14px", fontSize: 14, marginBottom: 20 },
  form: { display: "flex", flexDirection: "column", gap: 8 },
  label: { color: "#94a3b8", fontSize: 13, fontWeight: 600, marginTop: 8 },
  input: { background: "#1e293b", border: "1px solid #334155", borderRadius: 8, color: "#f1f5f9", padding: "12px 14px", fontSize: 15, outline: "none", width: "100%" },
  btn: { marginTop: 20, background: "#2563eb", color: "#fff", border: "none", borderRadius: 8, padding: 13, fontSize: 15, fontWeight: 600, cursor: "pointer" },
  backBtn: { marginTop: 10, background: "none", color: "#94a3b8", border: "none", fontSize: 13, cursor: "pointer", textDecoration: "underline" },
  footer: { marginTop: 24, color: "#94a3b8", fontSize: 14, textAlign: "center" },
  link: { color: "#38bdf8", textDecoration: "none", fontWeight: 600 },
};

export default Register;