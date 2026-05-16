import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  BarElement, ArcElement, Title, Tooltip, Legend
} from 'chart.js';
import api from '../../api/axios.jsx';
import { CountUp, AnimatedCard, SkeletonCard, GlowButton } from '../../components/AnimatedCard.jsx';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

// ── Quick Action Card (3D Tilt + Hover Scale) ─────────────
function QuickActionCard({ item, index, navigate }) {
  const cardRef = React.useRef(null);
  const [tilt, setTilt] = React.useState({});

  const handleMouseMove = useCallback((e) => {
    const card = cardRef.current;
    if (!card) return;
    const rect    = card.getBoundingClientRect();
    const x       = e.clientX - rect.left;
    const y       = e.clientY - rect.top;
    const cx      = rect.width  / 2;
    const cy      = rect.height / 2;
    const rotateX = ((y - cy) / cy) * -18;
    const rotateY = ((x - cx) / cx) *  18;
    setTilt({
      transform:  `perspective(600px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(16px) scale(1.08)`,
      boxShadow:  `${-rotateY * 1.5}px ${rotateX * 1.5}px 30px rgba(0,0,0,0.5), 0 0 30px ${item.color}35`,
      borderColor: `${item.color}55`,
      background:  `${item.color}15`,
      transition:  'none',
    });
  }, [item.color]);

  const handleMouseLeave = useCallback(() => {
    setTilt({
      transform:   'perspective(600px) rotateX(0deg) rotateY(0deg) translateZ(0px) scale(1)',
      boxShadow:   'none',
      borderColor: `${item.color}20`,
      background:  `${item.color}08`,
      transition:  'all 0.5s cubic-bezier(0.34,1.56,0.64,1)',
    });
  }, [item.color]);

  return (
    <motion.button
      ref={cardRef}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.9 + index * 0.07 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => navigate(item.route)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="flex flex-col items-center gap-2 p-4 rounded-xl border"
      style={{
        background:    `${item.color}08`,
        borderColor:   `${item.color}20`,
        cursor:        'pointer',
        transformStyle:'preserve-3d',
        position:      'relative',
        overflow:      'hidden',
        ...tilt,
      }}>
      {/* Glow overlay */}
      <div style={{
        position:   'absolute',
        inset:      0,
        borderRadius: '12px',
        background: `radial-gradient(ellipse at 50% 0%, ${item.color}20, transparent 65%)`,
        pointerEvents: 'none',
      }} />
      {/* Bottom accent line */}
      <div style={{
        position:   'absolute',
        bottom:     0,
        left:       '20%',
        right:      '20%',
        height:     '2px',
        background: `linear-gradient(90deg, transparent, ${item.color}, transparent)`,
        opacity:    0.7,
        pointerEvents: 'none',
      }} />
      <span className="text-2xl" style={{ transform: 'translateZ(12px)', display: 'inline-block' }}>
        {item.icon}
      </span>
      <span className="text-xs font-medium text-slate-400" style={{ transform: 'translateZ(8px)' }}>
        {item.label}
      </span>
    </motion.button>
  );
}

// ── Stat Card ─────────────────────────────────────────────
function StatCard({ icon, label, value, sub, color, delay, onClick, gradient, className = '' }) {
  return (
    <AnimatedCard delay={delay} onClick={onClick} glowColor={`${color}20`}
      className={`relative overflow-hidden rounded-2xl border cursor-pointer group stat-card-3d ${className}`}
      style={{ background: gradient || `linear-gradient(135deg, ${color}12, ${color}06)`, borderColor: `${color}25` }}>
      <div className="p-5 h-full" style={{ backdropFilter: 'blur(16px)' }}>
        <div className="flex items-center justify-between mb-4">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shadow-lg"
            style={{ background: `linear-gradient(135deg, ${color}40, ${color}15)`, border: `1px solid ${color}40` }}>
            {icon}
          </div>
          <motion.div animate={{ scale:[1,1.4,1], opacity:[1,0.5,1] }}
            transition={{ repeat:Infinity, duration:2.5 }}
            className="w-2 h-2 rounded-full" style={{ background: color }} />
        </div>
        <p className="text-3xl font-bold text-white mb-1">
          {value !== null ? <CountUp target={value} /> : '—'}
        </p>
        <p className="text-sm font-semibold" style={{ color }}>{label}</p>
        {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
        {/* Bottom accent line */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 opacity-40 group-hover:opacity-100 transition-opacity"
          style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />
      </div>
    </AnimatedCard>
  );
}

// ── Activity Item ──────────────────────────────────────────
function ActivityItem({ icon, text, time, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.8 + index * 0.1, duration: 0.4 }}
      className="flex items-center gap-3 py-3 border-b border-white/5 last:border-0 group">
      <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-sm flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-300 truncate">{text}</p>
        <p className="text-xs text-slate-600">{time}</p>
      </div>
      <div className="w-1.5 h-1.5 rounded-full bg-blue-500/40 group-hover:bg-blue-400 transition-colors" />
    </motion.div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────
export default function AdminDashboard() {
  const [stats,     setStats]     = useState(null);
  const [elections, setElections] = useState([]);
  const [users,     setUsers]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const navigate = useNavigate();

  const load = useCallback(async () => {
    try {
      const [elRes, usrRes, statsRes] = await Promise.all([
        api.get('/elections'),
        api.get('/auth/users'),
        api.get('/votes/dashboard-stats'),
      ]);
      const elecs   = Array.isArray(elRes.data) ? elRes.data : (elRes.data?.elections || []);
      const usrs    = Array.isArray(usrRes.data) ? usrRes.data : [];
      const ds      = statsRes.data;

      setStats({
        voters:      ds.totalUsers,
        votes:       ds.totalVotes,
        elections:   ds.activeElections,
        pending:     ds.pendingUsers,
        turnout:     ds.turnoutPct,
        hourly:      ds.hourlyVotes || [],
        activity:    ds.recentActivity || [],
      });
      setElections(elecs);
      setUsers(usrs.filter(u => !u.isAdmin).slice(0, 5));
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── PDF Export ──────────────────────────────────────────
  const handleExportPDF = () => {
    const printWindow = window.open('', '_blank');
    const rows = elections.map(e => {
      const total = e.candidates.reduce((s, c) => s + (c.votes || 0), 0);
      const winner = [...e.candidates].sort((a,b) => b.votes - a.votes)[0];
      return `
        <tr>
          <td>${e.title}</td>
          <td>${e.isActive ? 'Active' : 'Closed'}</td>
          <td>${total}</td>
          <td>${winner ? winner.name : '—'}</td>
          <td>${winner ? winner.votes : '—'}</td>
        </tr>`;
    }).join('');

    printWindow.document.write(`
      <html><head><title>VoteApp — Election Results</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 30px; color: #1f2937; }
        h1 { color: #4f46e5; } h2 { color: #374151; margin-top: 24px; }
        table { width: 100%; border-collapse: collapse; margin-top: 12px; }
        th { background: #4f46e5; color: white; padding: 10px 14px; text-align: left; }
        td { padding: 9px 14px; border-bottom: 1px solid #e5e7eb; }
        tr:nth-child(even) td { background: #f9fafb; }
        .meta { color: #6b7280; font-size: 13px; margin-bottom: 20px; }
        .badge { display:inline-block; padding:2px 8px; border-radius:999px; font-size:12px; }
        .active { background:#d1fae5; color:#065f46; }
        .closed { background:#f3f4f6; color:#6b7280; }
      </style></head>
      <body>
        <h1>🗳️ VoteApp — Election Results Report</h1>
        <p class="meta">Generated: ${new Date().toLocaleString()} &nbsp;|&nbsp; Total Elections: ${elections.length} &nbsp;|&nbsp; Total Votes: ${stats?.votes ?? 0} &nbsp;|&nbsp; Turnout: ${stats?.turnout ?? 0}%</p>
        <h2>Election Summary</h2>
        <table>
          <thead><tr><th>Election</th><th>Status</th><th>Total Votes</th><th>Leading Candidate</th><th>Votes</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <p style="margin-top:30px;color:#9ca3af;font-size:12px;">This report is auto-generated by VoteApp. All votes are blockchain-verified.</p>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 500);
  };

  // Chart data — top election by votes
  const topElection = elections.find(e => e.candidates.length > 0) || null;
  const barData = topElection ? {
    labels: topElection.candidates.map(c => c.name.length > 12 ? c.name.slice(0, 12) + '…' : c.name),
    datasets: [{
      label: 'Votes',
      data:  topElection.candidates.map(c => c.votes),
      backgroundColor: ['#3b82f6','#8b5cf6','#06b6d4','#10b981','#f59e0b','#ef4444'].slice(0, topElection.candidates.length),
      borderRadius: 8,
      borderSkipped: false,
    }],
  } : null;

  const totalVotesChart = topElection
    ? topElection.candidates.reduce((s, c) => s + c.votes, 0)
    : 0;

  const pieData = topElection && totalVotesChart > 0 ? {
    labels: topElection.candidates.map(c => c.name.length > 10 ? c.name.slice(0, 10) + '…' : c.name),
    datasets: [{
      data: topElection.candidates.map(c => c.votes),
      backgroundColor: ['#3b82f6','#8b5cf6','#06b6d4','#10b981','#f59e0b','#ef4444'],
      borderWidth: 0,
      hoverOffset: 8,
    }],
  } : null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15,23,42,0.9)',
        borderColor: 'rgba(59,130,246,0.3)',
        borderWidth: 1,
        titleColor: '#94a3b8',
        bodyColor: '#e2e8f0',
        padding: 10,
        cornerRadius: 8,
      },
    },
    scales: {
      x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#64748b', font: { size: 11 } } },
      y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#64748b', font: { size: 11 } }, beginAtZero: true },
    },
    animation: { duration: 1200, easing: 'easeOutQuart' },
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: '#94a3b8', padding: 12, font: { size: 11 }, boxWidth: 10, borderRadius: 3 },
      },
      tooltip: {
        backgroundColor: 'rgba(15,23,42,0.9)',
        borderColor: 'rgba(59,130,246,0.3)',
        borderWidth: 1,
        titleColor: '#94a3b8',
        bodyColor: '#e2e8f0',
        padding: 10,
        cornerRadius: 8,
      },
    },
    animation: { animateRotate: true, duration: 1400, easing: 'easeOutQuart' },
  };

  const statCards = stats ? [
    { icon: '👥', label: 'Total Voters',      value: stats.voters,    color: '#3b82f6', sub: 'Registered users',           route: '/admin/users',      gradient: 'linear-gradient(135deg,rgba(59,130,246,0.15),rgba(59,130,246,0.05))' },
    { icon: '🗳️', label: 'Total Votes Cast',  value: stats.votes,     color: '#a855f7', sub: 'Across all elections',       route: '/admin/monitoring', gradient: 'linear-gradient(135deg,rgba(168,85,247,0.15),rgba(168,85,247,0.05))' },
    { icon: '✅', label: 'Active Elections',   value: stats.elections, color: '#10b981', sub: 'Currently running',          route: '/admin/elections',  gradient: 'linear-gradient(135deg,rgba(16,185,129,0.15),rgba(16,185,129,0.05))' },
    { icon: '⏳', label: 'Pending Approval',   value: stats.pending,   color: '#f59e0b', sub: `Turnout: ${stats.turnout}%`, route: '/admin/users',      gradient: 'linear-gradient(135deg,rgba(245,158,11,0.15),rgba(245,158,11,0.05))' },
  ] : [];

  // Real activity from audit logs
  const actionLabels = {
    VOTE_CAST:        { icon: '🗳️', text: (l) => `${l.actor} voted in "${l.target}"` },
    USER_APPROVED:    { icon: '✅', text: (l) => `Admin approved voter: ${l.target}` },
    ELECTION_CREATED: { icon: '➕', text: (l) => `Election created: "${l.target}"` },
    ELECTION_CLOSED:  { icon: '🔒', text: (l) => `Election closed: "${l.target}"` },
  };

  const activities = (stats?.activity || []).map(log => {
    const def = actionLabels[log.action] || { icon: '📋', text: (l) => l.action };
    return {
      icon: def.icon,
      text: def.text(log),
      time: new Date(log.createdAt).toLocaleTimeString(),
    };
  });

  return (
    <div className="space-y-6">

      {/* Header */}
      <AnimatedCard delay={0} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Welcome back, Admin 👋
            {stats && (
              <span className="ml-3 text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.2)', color:'#6ee7b7' }}>
                📈 {stats.turnout}% Turnout
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <GlowButton onClick={handleExportPDF} variant="ghost">📄 Export PDF</GlowButton>
          <GlowButton onClick={load} variant="ghost">🔄 Refresh</GlowButton>
          <GlowButton onClick={() => navigate('/admin/elections')}>+ New Election</GlowButton>
        </div>
      </AnimatedCard>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading
          ? Array(4).fill(0).map((_, i) => <SkeletonCard key={i} />)
          : statCards.map((c, i) => (
            <StatCard key={c.label} {...c} delay={0.1 + i * 0.08} onClick={() => navigate(c.route)} />
          ))
        }
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Bar Chart */}
        <AnimatedCard delay={0.4} className="lg:col-span-2 rounded-2xl border border-white/10 p-5"
          style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(16px)' }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-white font-semibold">Votes per Candidate</h3>
              <p className="text-slate-500 text-xs mt-0.5">
                {topElection ? topElection.title : 'No active election'}
              </p>
            </div>
            <span className="text-xs px-2 py-1 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              📊 Bar
            </span>
          </div>
          <div className="h-52">
            {barData
              ? <Bar data={barData} options={chartOptions} />
              : <div className="h-full flex items-center justify-center text-slate-600 text-sm">No vote data yet</div>
            }
          </div>
        </AnimatedCard>

        {/* Pie Chart */}
        <AnimatedCard delay={0.5} className="rounded-2xl border border-white/10 p-5"
          style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(16px)' }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-white font-semibold">Vote Share</h3>
              <p className="text-slate-500 text-xs mt-0.5">Percentage breakdown</p>
            </div>
            <span className="text-xs px-2 py-1 rounded-lg bg-violet-500/10 text-violet-400 border border-violet-500/20">
              🥧 Pie
            </span>
          </div>
          <div className="h-52">
            {pieData
              ? <Pie data={pieData} options={pieOptions} />
              : <div className="h-full flex items-center justify-center text-slate-600 text-sm">No votes yet</div>
            }
          </div>
        </AnimatedCard>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Recent Activity */}
        <AnimatedCard delay={0.6} className="rounded-2xl border border-white/10 p-5"
          style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(16px)' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">Recent Activity</h3>
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          </div>
          <div>
            {activities.map((a, i) => (
              <ActivityItem key={i} {...a} index={i} />
            ))}
          </div>
        </AnimatedCard>

        {/* Voter Table */}
        <AnimatedCard delay={0.7} className="rounded-2xl border border-white/10 p-5"
          style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(16px)' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">Recent Voters</h3>
            <GlowButton variant="ghost" onClick={() => navigate('/admin/users')}>
              View All →
            </GlowButton>
          </div>

          {loading ? (
            <div className="space-y-2">
              {Array(4).fill(0).map((_, i) => (
                <div key={i} className="shimmer h-10 rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="space-y-1">
              {users.map((u, i) => (
                <motion.div key={u._id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.9 + i * 0.07 }}
                  whileHover={{ backgroundColor: 'rgba(59,130,246,0.06)', x: 2 }}
                  className="flex items-center gap-3 p-2.5 rounded-xl transition-colors cursor-pointer"
                  onClick={() => navigate('/admin/users')}>
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-violet-500/20 border border-white/10 flex items-center justify-center text-sm font-bold text-blue-300">
                    {u.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-200 font-medium truncate">{u.name}</p>
                    <p className="text-xs text-slate-600 truncate">{u.email}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      u.isApproved
                        ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                        : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                    }`}>
                      {u.isApproved ? '✓ Verified' : '⏳ Pending'}
                    </span>
                    <span className="text-xs text-slate-600 font-mono">{u.voterId?.slice(-6)}</span>
                  </div>
                </motion.div>
              ))}
              {users.length === 0 && (
                <p className="text-slate-600 text-sm text-center py-6">No voters yet</p>
              )}
            </div>
          )}
        </AnimatedCard>
      </div>

      {/* Quick Actions */}
      <AnimatedCard delay={0.8} className="rounded-2xl border border-white/10 p-5"
        style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(16px)' }}>
        <h3 className="text-white font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: '➕', label: 'Create Election', route: '/admin/elections',  color: '#3b82f6' },
            { icon: '👥', label: 'Manage Users',    route: '/admin/users',      color: '#8b5cf6' },
            { icon: '📊', label: 'View Results',    route: '/admin/results',    color: '#10b981' },
            { icon: '⛓️', label: 'Blockchain',      route: '/admin/blockchain', color: '#f59e0b' },
          ].map((item, i) => (
            <QuickActionCard key={item.label} item={item} index={i} navigate={navigate} />
          ))}
        </div>
      </AnimatedCard>
    </div>
  );
}
