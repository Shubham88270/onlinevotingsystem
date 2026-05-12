const { Resend } = require('resend');

const getResend = () => new Resend(process.env.RESEND_API_KEY);

const sendVerificationEmail = async (toEmail, name, token) => {
  const verifyUrl = `${process.env.CLIENT_URL}/verify-email?token=${token}`;

  try {
    const resend = getResend();
    const { data, error } = await resend.emails.send({
      from:    'VoteApp <onboarding@resend.dev>',
      to:      [toEmail],
      subject: '✅ Verify Your Email — VoteApp',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:500px;margin:auto;padding:30px;border:1px solid #e5e7eb;border-radius:12px;">
          <h2 style="color:#4f46e5;text-align:center;">🗳️ VoteApp</h2>
          <h3 style="color:#1f2937;">Hello, ${name}!</h3>
          <p style="color:#6b7280;">Please verify your email address to activate your account.</p>
          <div style="text-align:center;margin:30px 0;">
            <a href="${verifyUrl}" style="background:#4f46e5;color:white;padding:12px 30px;border-radius:8px;text-decoration:none;font-weight:bold;">
              ✅ Verify Email
            </a>
          </div>
          <p style="color:#9ca3af;font-size:12px;text-align:center;">This link expires in 24 hours.</p>
        </div>
      `,
    });

    if (error) throw new Error(error.message);
    console.log(`✅ Verification email sent to ${toEmail} — ID: ${data.id}`);
  } catch (err) {
    console.error(`❌ Verification email failed to ${toEmail}:`, err.message);
    throw err;
  }
};

module.exports = { sendVerificationEmail };
