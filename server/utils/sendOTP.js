const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendOTPEmail(email, name) {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  console.log("[OTP] Resend key loaded:", process.env.RESEND_API_KEY ? "✅ Yes" : "❌ MISSING");
  console.log("[OTP] Sending to:", email, "| OTP:", otp); // remove after testing

  const { data, error } = await resend.emails.send({
    from: "IntellMeet <onboarding@resend.dev>", // ✅ FIXED — Resend's built-in test sender
    to: email,
    subject: "Your IntellMeet Verification Code",
    html: `
      <div style="font-family: Inter, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px; background: #0f172a; border-radius: 16px; color: #f1f5f9;">
        <h1 style="color: #38bdf8; font-size: 24px; margin-bottom: 8px;">🚀 IntellMeet</h1>
        <h2 style="font-size: 20px; margin-bottom: 16px;">Verify your email</h2>
        <p style="color: #94a3b8; margin-bottom: 28px;">Hi ${name}, use the code below to complete your registration. It expires in 10 minutes.</p>
        <div style="background: #1e293b; border-radius: 12px; padding: 28px; text-align: center; margin-bottom: 28px;">
          <div style="font-size: 42px; font-weight: 800; letter-spacing: 10px; color: #38bdf8;">
            ${otp}
          </div>
        </div>
        <p style="color: #64748b; font-size: 13px;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  });

  if (error) {
    console.error("[OTP] Resend error:", error);
    throw new Error(error.message);
  }

  console.log("[OTP] Email sent successfully, id:", data?.id);
  return otp;
}

module.exports = { sendOTPEmail };