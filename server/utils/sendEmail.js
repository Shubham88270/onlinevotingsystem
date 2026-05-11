const Brevo = require('@getbrevo/brevo');

const getClient = () => {
  const client = Brevo.ApiClient.instance;
  client.authentications['api-key'].apiKey = process.env.BREVO_API_KEY;
  return new Brevo.TransactionalEmailsApi();
};

const sendVerificationEmail = async (toEmail, name, token) => {
  const verifyUrl = `${process.env.CLIENT_URL}/verify-email?token=${token}`;

  try {
    const api = getClient();
    await api.sendTransacEmail({
      sender:  { name: 'VoteApp', email: process.env.EMAIL_USER },
      to:      [{ email: toEmail, name }],
      subject: '✅ Verify Your Email — VoteApp',
      htmlContent: `
        <div style="font-family:Arial,sans-serif;max-width:500px;margin:auto;padding:30px;border:1px solid #e5e7eb;border-radius:12px;">
          <h2 style="color:#4f46e5;text-align:center;">🗳️ VoteApp</h2>
          <h3 style="color:#1f2937;">Hello, ${name}!</h3>
          <p style="color:#6b7280;">Thank you for registering. Please verify your email address to activate your account.</p>
          <div style="text-align:center;margin:30px 0;">
            <a href="${verifyUrl}"
              style="background:#4f46e5;color:white;padding:12px 30px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;">
              ✅ Verify Email
            </a>
          </div>
          <p style="color:#9ca3af;font-size:12px;text-align:center;">
            This link expires in 24 hours. If you did not register, ignore this email.
          </p>
        </div>
      `,
    });
    console.log(`✅ Verification email sent to ${toEmail}`);
  } catch (err) {
    console.error(`❌ Verification email failed to ${toEmail}:`, err.message);
    throw err;
  }
};

module.exports = { sendVerificationEmail };
