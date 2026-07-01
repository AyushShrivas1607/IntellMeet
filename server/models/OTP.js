const mongoose = require("mongoose");

// OTP expires automatically after 10 minutes via MongoDB TTL index
const otpSchema = new mongoose.Schema({
  email: { type: String, required: true, index: true },
  otp: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: 600 }, // 600s = 10 minutes
});

module.exports = mongoose.model("OTP", otpSchema);