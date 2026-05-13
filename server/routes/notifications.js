const express = require('express');
const { protect } = require('../middleware/auth');
const Notification = require('../models/Notification');
const rateLimiter = require('../middleware/rateLimiter');

const router = express.Router();

// All routes require auth
router.use(protect);

// GET /api/notifications — get user's notifications (latest 50)
router.get('/', async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(notifications);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/notifications/unread-count
router.get('/unread-count', async (req, res) => {
  try {
    const count = await Notification.countDocuments({ userId: req.user._id, isRead: false });
    res.json({ count });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PUT /api/notifications/:id/read — mark single as read
router.put('/:id/read', async (req, res) => {
  try {
    const notif = await Notification.findOne({ _id: req.params.id, userId: req.user._id });
    if (!notif) return res.status(404).json({ message: 'Not found' });
    notif.isRead = true;
    await notif.save();
    res.json({ success: true });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PUT /api/notifications/read-all — mark all as read
router.put('/read-all', async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.user._id, isRead: false }, { isRead: true });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// DELETE /api/notifications/:id — delete single
router.delete('/:id', async (req, res) => {
  try {
    await Notification.deleteOne({ _id: req.params.id, userId: req.user._id });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// DELETE /api/notifications — clear all
router.delete('/', async (req, res) => {
  try {
    await Notification.deleteMany({ userId: req.user._id });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
