const Notification = require('../models/Notification');

/**
 * Create a notification for a user and emit via Socket.io
 * @param {object} app - Express app (for socket.io)
 * @param {string} userId
 * @param {object} data - { title, message, type, icon, link }
 */
const notify = async (app, userId, { title, message, type = 'info', icon = '🔔', link = '' }) => {
  try {
    const notif = await Notification.create({ userId, title, message, type, icon, link });

    // Emit real-time to user's socket room
    const io = app?.get('io');
    if (io) {
      io.to(`user_${userId}`).emit('notification', {
        _id:       notif._id,
        title,
        message,
        type,
        icon,
        link,
        isRead:    false,
        createdAt: notif.createdAt,
      });
    }

    return notif;
  } catch (err) {
    console.error('notify() error:', err.message);
  }
};

// ── Preset notification helpers ───────────────────────────
const notifyVoteCast = (app, userId, electionTitle) =>
  notify(app, userId, {
    title:   '🗳️ Vote Submitted',
    message: `Your vote in "${electionTitle}" was recorded successfully.`,
    type:    'success', icon: '✅',
  });

const notifyElectionStarted = (app, userId, electionTitle) =>
  notify(app, userId, {
    title:   '🗳️ Election Started',
    message: `"${electionTitle}" is now open for voting.`,
    type:    'info', icon: '🟢',
  });

const notifyResultDeclared = (app, userId, electionTitle) =>
  notify(app, userId, {
    title:   '📊 Results Declared',
    message: `Results for "${electionTitle}" are now available.`,
    type:    'info', icon: '📊',
  });

const notifyAccountApproved = (app, userId) =>
  notify(app, userId, {
    title:   '✅ Account Approved',
    message: 'Your voter account has been approved. You can now vote.',
    type:    'success', icon: '✅',
  });

const notifyAccountRejected = (app, userId) =>
  notify(app, userId, {
    title:   '❌ Account Rejected',
    message: 'Your voter account approval was revoked by admin.',
    type:    'error', icon: '❌',
  });

const notifyOTPSent = (app, userId, email) =>
  notify(app, userId, {
    title:   '📧 OTP Sent',
    message: `A verification OTP was sent to ${email}.`,
    type:    'info', icon: '📧',
  });

const notifyPasswordChanged = (app, userId) =>
  notify(app, userId, {
    title:   '🔒 Password Changed',
    message: 'Your password was changed successfully.',
    type:    'success', icon: '🔒',
  });

const notifyProfileUpdated = (app, userId) =>
  notify(app, userId, {
    title:   '👤 Profile Updated',
    message: 'Your profile information was updated.',
    type:    'success', icon: '👤',
  });

module.exports = {
  notify,
  notifyVoteCast,
  notifyElectionStarted,
  notifyResultDeclared,
  notifyAccountApproved,
  notifyAccountRejected,
  notifyOTPSent,
  notifyPasswordChanged,
  notifyProfileUpdated,
};
