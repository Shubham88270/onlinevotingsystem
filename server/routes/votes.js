const express  = require('express');
const { body } = require('express-validator');
const ctrl     = require('../controllers/voteController');
const { protect, adminOnly } = require('../middleware/auth');
const validate    = require('../middleware/validate');
const rateLimiter = require('../middleware/rateLimiter');

const router = express.Router();

const voteRules = [
  body('electionId')
    .notEmpty().withMessage('Election ID is required')
    .isMongoId().withMessage('Invalid election ID'),
  body('candidateId')
    .notEmpty().withMessage('Candidate ID is required')
    .isMongoId().withMessage('Invalid candidate ID'),
];

// Cast vote — authenticated + per-user rate limit
router.post('/',
  protect,
  rateLimiter(5, 60 * 60 * 1000), // 5 votes per hour per user
  voteRules, validate,
  ctrl.castVote);

// Results — public (voters need to see results)
router.get('/results/:electionId', ctrl.getResults);

// Blockchain — authenticated users only
router.get('/blockchain', protect, ctrl.getBlockchain);

// Audit logs — admin only
router.get('/audit', protect, adminOnly, ctrl.getAuditLogs);

// Dashboard stats — admin only
router.get('/dashboard-stats', protect, adminOnly, ctrl.getDashboardStats);

module.exports = router;
