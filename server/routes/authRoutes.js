const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");

const User = require("../models/User");
const OTP = require("../models/OTP");
const { sendOTPEmail } = require("../utils/sendOTP");

// Rate limiting — max 10 auth requests per 15 minutes per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: "Too many attempts, please try again in 15 minutes." },
});

// ── STEP 1: Send OTP ─────────────────────────────────────────────────────────
// POST /api/auth/send-otp
// Called when user fills in registration form and clicks "Send OTP"
router.post("/send-otp", authLimiter, async (req, res) => {
  try {
    const { email, name } = req.body;
    if (!email || !name) return res.status(400).json({ message: "Email and name are required" });

    // Check if email already registered
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "Email already registered" });

    // Delete any existing OTP for this email before creating a new one
    await OTP.deleteMany({ email });

    const otp = await sendOTPEmail(email, name);

    // Store hashed OTP in DB (plain OTP only leaves via email)
    const hashedOTP = await bcrypt.hash(otp, 10);
    await OTP.create({ email, otp: hashedOTP });

    res.json({ message: "OTP sent to your email" });
  } catch (err) {
    console.error("Send OTP error:", err.message);
    res.status(500).json({ message: "Failed to send OTP. Please try again." });
  }
});

// ── STEP 2: Verify OTP + Complete Registration ───────────────────────────────
// POST /api/auth/register
router.post("/register", authLimiter, async (req, res) => {
  try {
    const { name, email, password, otp } = req.body;

    if (!name || !email || !password || !otp) {
      return res.status(400).json({ message: "All fields including OTP are required" });
    }

    // Verify OTP
    const otpRecord = await OTP.findOne({ email });
    if (!otpRecord) {
      return res.status(400).json({ message: "OTP expired or not sent. Please request a new one." });
    }

    const otpMatch = await bcrypt.compare(otp, otpRecord.otp);
    if (!otpMatch) {
      return res.status(400).json({ message: "Invalid OTP. Please check your email." });
    }

    // OTP valid — delete it so it can't be reused
    await OTP.deleteMany({ email });

    // Create user
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, password: hashedPassword });

    res.status(201).json({ message: "Registration successful", userId: user._id });
  } catch (err) {
    console.error("Register error:", err.message);
    res.status(500).json({ message: "Registration failed" });
  }
});

// ── LOGIN ─────────────────────────────────────────────────────────────────────
// POST /api/auth/login
router.post("/login", authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ message: "Login failed" });
  }
});

module.exports = router;