const jwt      = require('jsonwebtoken');
const crypto   = require('crypto');
const { validationResult } = require('express-validator');
const User     = require('../models/User');
const { sendVerificationEmail } = require('../utils/sendEmail');
const { logAudit } = require('../utils/audit');
const { notifyAccountApproved, notifyAccountRejected, notifyPasswordChanged, notifyProfileUpdated } = require('../utils/notify');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

const generateVerifyToken = () => crypto.randomBytes(32).toString('hex');

// POST /api/auth/register — DISABLED: only admin can register users
exports.register = async (req, res) => {
  return res.status(403).json({
    message: 'Self-registration is disabled. Please contact your administrator to create an account.',
  });
};

// POST /api/auth/login
exports.login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ message: errors.array()[0].msg });

  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ message: 'Invalid credentials' });

    if (!user.isVerified)
      return res.status(403).json({
        message: 'Please verify your email before logging in.',
        notVerified: true,
      });

    // Admin users bypass approval check
    if (!user.isAdmin && !user.isApproved)
      return res.status(403).json({
        message: 'Your account is pending admin approval. Please wait.',
        pendingApproval: true,
      });

    res.json({
      _id:        user._id,
      name:       user.name,
      email:      user.email,
      voterId:    user.voterId,
      photo:      user.photo,
      isAdmin:    user.isAdmin,
      isApproved: user.isApproved,
      votedElections: user.votedElections,
      token:      generateToken(user._id),
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// GET /api/auth/verify-email
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;
    const user = await User.findOne({
      verificationToken:  token,
      verificationExpiry: { $gt: new Date() },
    });
    if (!user) return res.status(400).json({ message: 'Invalid or expired link' });

    user.isVerified         = true;
    user.verificationToken  = null;
    user.verificationExpiry = null;
    await user.save();
    res.redirect(`${process.env.CLIENT_URL}/auth?verified=true`);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// POST /api/auth/resend-verification — resend OTP (not email link)
exports.resendVerification = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user)           return res.status(404).json({ message: 'Email not found' });
    if (user.isVerified) return res.status(400).json({ message: 'Already verified' });

    // 1 min cooldown
    if (user.otpResendAt && new Date() < user.otpResendAt) {
      const secondsLeft = Math.ceil((user.otpResendAt - Date.now()) / 1000);
      return res.status(429).json({
        message:  `Please wait ${secondsLeft} second(s) before resending.`,
        cooldown: secondsLeft,
      });
    }

    const { generateOTP, sendOTPEmail } = require('../utils/sendOTP');
    const otp = generateOTP();
    user.otp              = otp;
    user.otpExpiry        = new Date(Date.now() + 10 * 60 * 1000);
    user.otpResendAt      = new Date(Date.now() +  1 * 60 * 1000);
    user.unverifiedExpiry = new Date(Date.now() + 10 * 60 * 1000); // extend TTL
    await user.save();

    try { await sendOTPEmail(email, user.name, otp); } catch {}
    res.json({
      message:   `OTP sent to ${email}`,
      userId:    user._id,
      expiresIn: 10 * 60,
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// GET /api/auth/me
exports.getMe = async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');
  res.json(user);
};

// GET /api/auth/users (admin)
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// PATCH /api/auth/users/:id/approve (admin) — approve voter
exports.approveUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.isApproved = true;
    user.isVerified = true;          // auto-verify when admin approves
    user.verificationToken  = null;  // clear pending token
    user.verificationExpiry = null;
    await user.save();

    // Notify admin room
    try {
      const io = req.app.get('io');
      if (io) io.to('admin').emit('adminNotification', {
        icon:  '✅',
        title: 'Voter approved',
        desc:  `${user.name} (${user.email}) has been approved to vote.`,
      });
    } catch {}

    res.json({ message: `${user.name} approved successfully`, user });

    // Notify user
    await notifyAccountApproved(req.app, user._id);

    // Audit log
    await logAudit('USER_APPROVED', {
      actorId:  req.user._id,
      actor:    'admin',
      target:   user.name,
      targetId: user._id,
      ip:       req.ip || '',
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// PATCH /api/auth/users/:id/reject (admin) — reject voter
exports.rejectUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.isApproved = false;
    await user.save();
    res.json({ message: `${user.name} rejected` });
    await notifyAccountRejected(req.app, user._id);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// PATCH /api/auth/users/:id/password (admin)
exports.setUserPassword = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 6)
      return res.status(400).json({ message: 'Min 6 characters' });
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.password = password;
    await user.save();
    res.json({ message: `Password updated for ${user.name}` });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// POST /api/auth/admin/register-user (admin) — send OTP to verify real person
exports.adminRegisterUser = async (req, res) => {
  try {
    const { name, email, password, branch, college, university, rollNo, phone } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: 'All fields required' });

    // ── Strong password validation ──────────────────────────
    const strongPw = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$%^&*!]).{8,}$/;
    if (!strongPw.test(password))
      return res.status(400).json({
        message: 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character (@#$%^&*!)',
      });

    // ── Phone validation ────────────────────────────────────
    if (phone && phone.trim()) {
      if (!/^\d{10}$/.test(phone.trim()))
        return res.status(400).json({ message: 'Phone number must be exactly 10 digits.' });
      // Only block if the existing user with this phone is verified
      const phoneExists = await User.findOne({ phone: phone.trim(), isVerified: true });
      if (phoneExists)
        return res.status(400).json({ message: `Phone number "${phone}" is already registered.` });
    }

    // ── Duplicate Roll No check ─────────────────────────────
    if (rollNo && rollNo.trim()) {
      // Only block if the existing user with this rollNo is verified
      const rollExists = await User.findOne({ rollNo: rollNo.trim(), isVerified: true });
      if (rollExists)
        return res.status(400).json({ message: `Roll No "${rollNo}" is already registered.` });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      if (!exists.isVerified) {
        const { generateOTP, sendOTPEmail } = require('../utils/sendOTP');
        const otp = generateOTP();
        // Update all fields in case admin is re-registering with new info
        exists.name             = name;
        exists.password         = password; // will be re-hashed by pre-save hook
        exists.branch           = branch     || exists.branch;
        exists.college          = college    || exists.college;
        exists.university       = university || exists.university;
        exists.rollNo           = rollNo     || exists.rollNo;
        exists.phone            = phone      || exists.phone;
        exists.otp              = otp;
        exists.otpExpiry        = new Date(Date.now() + 10 * 60 * 1000);
        exists.unverifiedExpiry = new Date(Date.now() + 10 * 60 * 1000);
        await exists.save();
        try { await sendOTPEmail(email, exists.name, otp); } catch {}
        return res.json({
          message: `OTP resent to ${email}. Ask user to verify.`,
          userId: exists._id,
          requiresOTP: true,
        });
      }
      return res.status(400).json({ message: `Email "${email}" is already registered and verified.` });
    }

    const { generateOTP, sendOTPEmail } = require('../utils/sendOTP');
    const otp = generateOTP();

    const user = await User.create({
      name, email, password,
      branch:     branch     || '',
      college:    college    || '',
      university: university || '',
      rollNo:     rollNo     || '',
      phone:      phone      || '',
      isAdmin:    false,
      isVerified: false,
      isApproved: false,
      otp,
      otpExpiry:        new Date(Date.now() + 10 * 60 * 1000),
      unverifiedExpiry: new Date(Date.now() + 10 * 60 * 1000), // TTL: auto-delete after 10 min
    });

    // Send email OTP
    try {
      await sendOTPEmail(email, name, otp);
    } catch (emailErr) {
      console.error('OTP email failed:', emailErr.message);
    }

    res.status(201).json({
      message:     `OTP sent to ${email}. Ask user to verify with OTP.`,
      userId:      user._id,
      voterId:     user.voterId,
      requiresOTP: true,
      hasPhone:    false, // phone OTP disabled — SMS gateway not configured
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// POST /api/auth/verify-otp — user enters OTP to complete registration
exports.verifyOTP = async (req, res) => {
  try {
    const { userId, otp } = req.body;
    if (!userId || !otp)
      return res.status(400).json({ message: 'userId and OTP required' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!user.otp || user.otp !== otp)
      return res.status(400).json({ message: 'Invalid OTP' });

    if (new Date() > user.otpExpiry)
      return res.status(400).json({ message: 'OTP expired. Ask admin to resend.' });

    // OTP correct — verify and approve
    user.isVerified       = true;
    user.isApproved       = true;
    user.otp              = null;
    user.otpExpiry        = null;
    user.unverifiedExpiry = null; // cancel TTL — user is now verified
    await user.save();

    res.json({
      message: `✅ OTP verified! You can now login.`,
      email:   user.email,
      voterId: user.voterId,
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// POST /api/auth/verify-phone-otp — verify phone OTP
exports.verifyPhoneOTP = async (req, res) => {
  try {
    const { userId, otp } = req.body;
    if (!userId || !otp)
      return res.status(400).json({ message: 'userId and OTP required' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!user.phoneOtp || user.phoneOtp !== otp)
      return res.status(400).json({ message: 'Invalid phone OTP' });

    if (new Date() > user.phoneOtpExpiry)
      return res.status(400).json({ message: 'Phone OTP expired. Ask admin to resend.' });

    user.phoneVerified  = true;
    user.phoneOtp       = null;
    user.phoneOtpExpiry = null;
    await user.save();

    res.json({ message: '✅ Phone number verified successfully!' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// POST /api/auth/resend-phone-otp — resend phone OTP
exports.resendPhoneOTP = async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!user.phone) return res.status(400).json({ message: 'No phone number on file' });

    const { generateOTP, sendOTPEmail } = require('../utils/sendOTP');
    const otp = generateOTP();
    user.phoneOtp       = otp;
    user.phoneOtpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    try { await sendOTPEmail(user.email, user.name, otp, true); } catch {}
    res.json({ message: `Phone OTP resent to ${user.email}` });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// POST /api/auth/resend-otp — admin resends OTP
exports.resendOTP = async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.isVerified) return res.status(400).json({ message: 'Already verified' });

    // ── 1 min cooldown ──────────────────────────────────────
    if (user.otpResendAt && new Date() < user.otpResendAt) {
      const secondsLeft = Math.ceil((user.otpResendAt - Date.now()) / 1000);
      return res.status(429).json({
        message: `Please wait ${secondsLeft} second(s) before resending.`,
        cooldown: secondsLeft,
      });
    }

    const { generateOTP, sendOTPEmail } = require('../utils/sendOTP');
    const otp = generateOTP();
    user.otp              = otp;
    user.otpExpiry        = new Date(Date.now() + 10 * 60 * 1000);
    user.otpResendAt      = new Date(Date.now() +  1 * 60 * 1000);
    user.unverifiedExpiry = new Date(Date.now() + 10 * 60 * 1000); // extend TTL on resend
    await user.save();

    try { await sendOTPEmail(user.email, user.name, otp); } catch {}
    res.json({
      message:   `OTP resent to ${user.email}`,
      expiresIn: 10 * 60,
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// DELETE /api/auth/users/:id (admin) — delete user
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.isAdmin) return res.status(403).json({ message: 'Cannot delete admin user' });
    await user.deleteOne();
    res.json({ message: `User "${user.name}" deleted successfully` });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
exports.updateProfile = async (req, res) => {
  try {
    const { name, photo, branch, college, university, rollNo } = req.body;
    const user = await User.findById(req.user._id);
    if (name)       user.name       = name;
    if (photo)      user.photo      = photo;
    if (branch      !== undefined) user.branch     = branch;
    if (college     !== undefined) user.college    = college;
    if (university  !== undefined) user.university = university;
    if (rollNo      !== undefined) user.rollNo     = rollNo;
    await user.save();
    res.json({ message: 'Profile updated' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// POST /api/auth/change-password — change password with old password
exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword)
      return res.status(400).json({ message: 'Both fields required' });
    if (newPassword.length < 6)
      return res.status(400).json({ message: 'New password min 6 characters' });

    const user = await User.findById(req.user._id);
    const match = await user.matchPassword(oldPassword);
    if (!match)
      return res.status(400).json({ message: 'Old password is incorrect' });

    user.password = newPassword;
    await user.save();
    res.json({ message: '✅ Password changed successfully!' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// POST /api/auth/forgot-password — send OTP to email for password reset
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'Email not found' });

    // ── 1 min resend cooldown ───────────────────────────────
    if (user.otpResendAt && new Date() < user.otpResendAt) {
      const secondsLeft = Math.ceil((user.otpResendAt - Date.now()) / 1000);
      return res.status(429).json({
        message: `Please wait ${secondsLeft} second(s) before requesting another OTP.`,
        cooldown: secondsLeft,
      });
    }

    const { generateOTP, sendOTPEmail } = require('../utils/sendOTP');
    const otp = generateOTP();
    user.otp         = otp;
    user.otpExpiry   = new Date(Date.now() + 10 * 60 * 1000); // 10 min
    user.otpResendAt = new Date(Date.now() +  1 * 60 * 1000); // 1 min cooldown
    await user.save();

    try {
      await sendOTPEmail(email, user.name, otp);
    } catch (e) {
      console.error('OTP email failed:', e.message);
    }

    res.json({
      message:   `OTP sent to ${email}`,
      userId:    user._id,
      expiresIn: 10 * 60, // seconds
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// POST /api/auth/reset-password — verify OTP then set new password
exports.resetPassword = async (req, res) => {
  try {
    const { userId, otp, newPassword } = req.body;
    if (!userId || !otp || !newPassword)
      return res.status(400).json({ message: 'All fields required' });
    if (newPassword.length < 6)
      return res.status(400).json({ message: 'Password min 6 characters' });

    const user = await User.findById(userId);
    if (!user)              return res.status(404).json({ message: 'User not found' });
    if (!user.otp || user.otp !== otp)
      return res.status(400).json({ message: 'Invalid OTP' });
    if (new Date() > user.otpExpiry)
      return res.status(400).json({ message: 'OTP expired. Request again.' });

    user.password  = newPassword;
    user.otp       = null;
    user.otpExpiry = null;
    await user.save();

    res.json({ message: '✅ Password reset successfully! You can now login.' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
