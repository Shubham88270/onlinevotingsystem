const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');
const helmet   = require('helmet');
const http     = require('http');
const { Server } = require('socket.io');
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const authRoutes     = require('./routes/auth');
const electionRoutes = require('./routes/elections');
const voteRoutes     = require('./routes/votes');

const app    = express();
const server = http.createServer(app);

// Socket.io setup
const io = new Server(server, {
  cors: { origin: process.env.CLIENT_URL || 'http://localhost:3000', methods: ['GET', 'POST'] }
});

// Make io accessible in controllers
app.set('io', io);

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(cors({
  origin: function (origin, callback) {
    const allowed = [
      'http://localhost:3000',
      'https://onlinevotingsystem-five.vercel.app',
      'https://onlinevotingsystem-git-main-shubham88270s-projects.vercel.app',
      'https://onlinevotingsystem-6d3u734nd-shubham88270s-projects.vercel.app',
      process.env.CLIENT_URL,
    ].filter(Boolean);
    if (!origin) return callback(null, true);
    if (allowed.includes(origin)) return callback(null, true);
    console.warn(`CORS blocked origin: ${origin}`);
    callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' })); // 10mb for base64 photos

// Routes
app.use('/api/auth',      authRoutes);
app.use('/api/elections', electionRoutes);
app.use('/api/votes',     voteRoutes);
app.get('/',         (req, res) => res.json({ message: 'VoteApp API running ✅' }));
app.get('/api/test', (req, res) => res.json({ success: true, env: process.env.NODE_ENV, clientUrl: process.env.CLIENT_URL || 'not set' }));

// Socket.io — users join election rooms for live updates
io.on('connection', (socket) => {
  socket.on('joinElection', (electionId) => {
    socket.join(electionId);
  });
  socket.on('leaveElection', (electionId) => {
    socket.leave(electionId);
  });
  // Admin joins a dedicated room to receive admin notifications
  socket.on('joinAdmin', () => {
    socket.join('admin');
  });
});

// ── Vote deadline auto-close (runs every minute) ──────────
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
      // Notify all connected clients
      io.emit('electionClosed', { electionId: election._id, title: election.title });
      io.to('admin').emit('adminNotification', {
        icon:  '🔒',
        title: 'Election closed',
        desc:  `"${election.title}" has ended automatically.`,
      });
      await logAudit('ELECTION_CLOSED', {
        actor:    'system',
        target:   election.title,
        targetId: election._id,
        meta:     { reason: 'endDate reached' },
      });
      console.log(`🔒 Auto-closed election: ${election.title}`);
    }
  } catch (err) {
    console.error('Auto-close error:', err.message);
  }
}, 60 * 1000); // every 60 seconds

// Connect MongoDB & start server
const PORT = process.env.PORT || 5000;

// Start server FIRST so Render detects the open port immediately
server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error('❌ DB connection failed:', err.message));

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received — shutting down gracefully');
  server.close(() => process.exit(0));
});
