const express     = require('express');
const { body }    = require('express-validator');
const ctrl        = require('../controllers/authController');
const { protect, adminOnly } = require('../middleware/auth');
const validate    = require('../middleware/validate');
const rateLimiter = require('../middleware/rateLimiter');

const router = express.Router();

const registerRules = [
  body('name').trim().notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Name 2-50 chars')
    .matches(/^[a-zA-Z\s]+$/).withMessage('Name: letters only'),
  body('email').trim().isEmail().withMessage('Valid email required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password min 6 chars')
    .matches(/\d/).withMessage('Password must contain a number'),
];

const loginRules = [
  body('email').trim().isEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required'),
];

router.post('/register',            rateLimiter(5, 15*60*1000), registerRules, validate, ctrl.register);
router.post('/login',               rateLimiter(10, 15*60*1000), loginRules, validate, ctrl.login);
router.get('/verify-email',         ctrl.verifyEmail);
router.post('/resend-verification', rateLimiter(3, 60*60*1000), ctrl.resendVerification);
router.get('/me',                   protect, ctrl.getMe);
router.patch('/profile',            protect, ctrl.updateProfile);
router.post('/change-password',     protect, ctrl.changePassword);
router.post('/forgot-password',     ctrl.forgotPassword);
router.post('/reset-password',      ctrl.resetPassword);
router.get('/users',                protect, adminOnly, ctrl.getUsers);
router.patch('/users/:id/approve',  protect, adminOnly, ctrl.approveUser);
router.patch('/users/:id/reject',   protect, adminOnly, ctrl.rejectUser);
router.patch('/users/:id/password', protect, adminOnly, ctrl.setUserPassword);
router.delete('/users/:id',         protect, adminOnly, ctrl.deleteUser);
router.post('/admin/register-user', protect, adminOnly, ctrl.adminRegisterUser);
router.post('/verify-otp',          ctrl.verifyOTP);
router.post('/resend-otp',          ctrl.resendOTP);
// phone OTP routes removed — SMS gateway not configured

module.exports = router;
