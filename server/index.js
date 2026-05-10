const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');
const helmet   = require('helmet');
const http     = require('http');
const { Server } = require('socket.io');
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

// ── Validate required env vars at startup ─────────────────
const REQUIRED_ENV = ['MONGO_URI', 'JWT_SECRET'];
const missingEnv = REQUIRED_ENV.filter(k => !process.env[k]);
if (missingEnv.length) {
  console.error(`❌ Missing required environment variables: ${missingEnv.join(', ')}`);
  process.exit(1);
}

const authRoutes     = require('./routes/auth');
const electionRoutes = require('./routes/elections');
const voteRoutes     = require('./routes/votes');

const app    = express();
const server = http.createServer(app);

// ── CORS origins ──────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:3000',
  'https://onlinevotingsystem-five.vercel.app',
  'https://onlinevotingsystem-git-main-shubham88270s-projects.vercel.app',
  'https://onlinevotingsystem-6d3u734nd-shubham88270s-projects.vercel.app',
  process.env.CLIENT_URL,
].filter(Boolean);

const corsOrigin = (origin, callback) => {
  if (!origin) return callback(null, true); // Postman / server-to-server
  if (allowedOrigins.includes(origin)) return callback(null, true);
  console.warn(`⚠️  CORS blocked origin: ${origin}`);
  callback(new Error(`CORS blocked: ${origin}`));
};

// ── Socket.io setup ───────────────────────────────────────
const io = new Server(server, {
  cors: { origin: allowedOrigins, methods: ['GET', 'POST'], credentials: true }
});

app.set('io', io);

// ── Security middleware ───────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy:     false, // handled by frontend
}));

// ── CORS — must be before routes ──────────────────────────
app.use(cors({ origin: corsOrigin, credentials: true }));

// ── Body parser ───────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));

// ── Health check ──────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok', uptime: process.uptime() }));
app.get('/',       (req, res) => res.json({ message: 'VoteApp API running ✅' }));
app.get('/api/test', (req, res) => res.json({
  success:   true,
  env:       process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'not set',
}));

// ── Routes ────────────────────────────────────────────────
app.use('/api/auth',      authRoutes);
app.use('/api/elections', electionRoutes);
app.use('/api/votes',     voteRoutes);

// ── 404 handler ───────────────────────────────────────────
app.use((req, res) => res.status(404).json({ message: `Route ${req.path} not found` }));

// ── Global error handler ──────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ message: 'Internal server error' });
});

// ── Socket.io events ──────────────────────────────────────
io.on('connection', (socket) => {
  socket.on('joinElection', (electionId) => {
    if (typeof electionId === 'string') socket.join(electionId);
  });
  socket.on('leaveElection', (electionId) => {
    if (typeof electionId === 'string') socket.leave(electionId);
  });
  socket.on('joinAdmin', () => socket.join('admin'));
  socket.on('error', (err) => console.error('Socket error:', err.message));
});

// ── Vote deadline auto-close (every 60s) ─────────────────
const Election = require('./models/Election');
const { logAudit } = require('./utils/audit');

setInterval(async () => {
  try {
    const expired = await Election.find({
      isActive: true,
      endDate:  { $lte: new Date(), $ne: null },
    });
    for (const election of expired) {
      election.isActive = false;
      await election.save();
      io.emit('electionClosed', { electionId: election._id, title: election.title });
      io.to('admin').emit('adminNotification', {
        icon: '🔒', title: 'Election closed',
        desc: `"${election.title}" has ended automatically.`,
      });
      await logAudit('ELECTION_CLOSED', {
        actor: 'system', target: election.title,
        targetId: election._id, meta: { reason: 'endDate reached' },
      });
      console.log(`🔒 Auto-closed: ${election.title}`);
    }
  } catch (err) {
    console.error('Auto-close error:', err.message);
  }
}, 60 * 1000);

// ── Start server ──────────────────────────────────────────
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`   NODE_ENV:    ${process.env.NODE_ENV || 'development'}`);
  console.log(`   CLIENT_URL:  ${process.env.CLIENT_URL || 'not set'}`);
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error('❌ DB connection failed:', err.message));

// ── Graceful shutdown ─────────────────────────────────────
process.on('SIGTERM', async () => {
  console.log('SIGTERM — shutting down gracefully');
  server.close(async () => {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    process.exit(0);
  });
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Promise Rejection:', reason);
});

module.exports = app;
