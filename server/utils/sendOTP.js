const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const sendOTPEmail = async (toEmail, name, otp, isPhone = false) => {
  const subject = isPhone
    ? '📱 Your Phone Verification OTP — VoteApp'
    : '🔐 Your OTP for VoteApp Registration';
  const heading = isPhone ? 'Phone Number Verification' : 'Registration Verification';
  const desc    = isPhone
    ? 'Use the OTP below to verify your phone number:'
    : 'Your admin has registered you on VoteApp. Use the OTP below to verify your identity:';

  try {
    const { data, error } = await resend.emails.send({
      from:    'VoteApp <onboarding@resend.dev>',
      to:      toEmail,
      subject,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:30px;border:1px solid #e5e7eb;border-radius:12px;">
          <h2 style="color:#4f46e5;text-align:center;">🗳️ VoteApp</h2>
          <h3 style="color:#1f2937;">Hello, ${name}!</h3>
          <h4 style="color:#4f46e5;">${heading}</h4>
          <p style="color:#6b7280;">${desc}</p>
          <div style="text-align:center;margin:30px 0;">
            <div style="background:#f0f4ff;border:2px dashed #6366f1;border-radius:12px;padding:20px;display:inline-block;">
              <p style="margin:0;font-size:36px;font-weight:bold;letter-spacing:10px;color:#4f46e5;">${otp}</p>
            </div>
          </div>
          <p style="color:#6b7280;text-align:center;">This OTP expires in <strong>10 minutes</strong>.</p>
          <p style="color:#9ca3af;font-size:12px;text-align:center;">If you did not expect this, please ignore.</p>
        </div>
      `,
    });

    if (error) {
      console.error(`❌ OTP email failed to ${toEmail}:`, error.message);
      throw new Error(error.message);
    }

    console.log(`✅ OTP email sent to ${toEmail} — ID: ${data.id}`);
  } catch (err) {
    console.error(`❌ OTP email failed to ${toEmail}:`, err.message);
    throw err;
  }
};

module.exports = { generateOTP, sendOTPEmail };
