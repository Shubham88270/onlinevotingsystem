import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bar, Pie, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import api from '../../api/axios.jsx';
import Spinner from '../../components/Spinner.jsx';
import socket from '../../socket.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

const COLORS = ['#6366f1','#8b5cf6','#06b6d4','#10b981','#f59e0b','#ef4444'];
const GRADIENTS = [
  'linear-gradient(135deg,#6366f1,#8b5cf6)',
  'linear-gradient(135deg,#8b5cf6,#a855f7)',
  'linear-gradient(135deg,#06b6d4,#0891b2)',
  'linear-gradient(135deg,#10b981,#059669)',
  'linear-gradient(135deg,#f59e0b,#d97706)',
  'linear-gradient(135deg,#ef4444,#dc2626)',
];

// ── Stat Card ──────────────────────────────────────────────
function StatCard({ icon, label, value, color, delay, sub }) {
  return (
    <motion.div
      initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
      transition={{ delay, duration:0.4 }}
      whileHover={{ y:-4, boxShadow:`0 20px 40px ${color}20` }}
      className="rounded-2xl p-5 relative overflow-hidden"
      style={{ background:'rgba(255,255,255,0.04)', backdropFilter:'blur(20px)', border:`1px solid ${color}25` }}>
      {/* Glow bg */}
      <div style={{
        position:'absolute', top:0, right:0,
        width:80, height:80, borderRadius:'50%',
        background:`radial-gradient(circle, ${color}20, transparent 70%)`,
        pointerEvents:'none',
      }} />
      <div className="relative z-10">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-3"
          style={{ background:`${color}20`, border:`1px solid ${color}40` }}>
          {icon}
        </div>
        <p className="text-2xl font-extrabold text-white">{value}</p>
        <p className="text-xs font-semibold mt-0.5" style={{ color }}>{label}</p>
        {sub && <p className="text-xs text-slate-600 mt-0.5">{sub}</p>}
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-0.5"
        style={{ background:`linear-gradient(90deg, transparent, ${color}, transparent)` }} />
    </motion.div>
  );
}

// ── Candidate Avatar ───────────────────────────────────────
function CandidateAvatar({ name, photo, size = 44, color, isWinner }) {
  const initials = name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2) || '?';
  return (
    <div style={{
      width:size, height:size, borderRadius:size*0.28, overflow:'hidden', flexShrink:0,
      border: isWinner ? '2px solid #f59e0b' : `2px solid ${color}50`,
      boxShadow: isWinner ? `0 0 16px rgba(245,158,11,0.5)` : `0 0 12px ${color}30`,
    }}>
      {photo
        ? <img src={photo} alt={name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
        : <div style={{
            width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center',
            background: isWinner ? 'linear-gradient(135deg,#f59e0b,#d97706)' : `linear-gradient(135deg,${color},${color}99)`,
            color:'#fff', fontWeight:700, fontSize:size*0.3,
          }}>{initials}</div>
      }
    </div>
  );
}

export default function UserResults() {
  const [elections, setElections] = useState([]);
  const [results,   setResults]   = useState({});
  const [loading,   setLoading]   = useState(true);
  const [chartType, setChartType] = useState('bar');

  const loadResults = async (elecs) => {
    const res = {};
    await Promise.all(elecs.map(async e => {
      try { const { data } = await api.get(`/votes/results/${e._id}`); res[e._id] = data; }
      catch { res[e._id] = { totalVotes:0, results:[] }; }
    }));
    setResults(res);
  };

  useEffect(() => {
    api.get('/elections').then(async ({ data }) => {
      const safe = Array.isArray(data) ? data : [];
      setElections(safe);
      await loadResults(safe);
      socket.connect();
      safe.forEach(e => socket.emit('joinElection', e._id));
    }).finally(() => setLoading(false));

    socket.on('voteUpdate', ({ electionId, candidates }) => {
      setResults(prev => {
        const old = prev[electionId];
        if (!old) return prev;
        const total   = candidates.reduce((s,c) => s+c.votes, 0);
        const updated = candidates
          .map(c => ({ ...c, percentage: total > 0 ? ((c.votes/total)*100).toFixed(1) : '0.0' }))
          .sort((a,b) => b.votes-a.votes);
        return { ...prev, [electionId]: { ...old, totalVotes:total, results:updated } };
      });
    });

    return () => { socket.off('voteUpdate'); socket.disconnect(); };
  }, []);

  if (loading) return <Spinner />;

  // ── Global stats ──
  const totalVotesAll  = Object.values(results).reduce((s,r) => s+(r?.totalVotes||0), 0);
  const activeCount    = elections.filter(e => e.isActive).length;
  const closedCount    = elections.length - activeCount;
  const totalCandidates = Object.values(results).reduce((s,r) => s+(r?.results?.length||0), 0);

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <motion.div initial={{ opacity:0, y:-12 }} animate={{ opacity:1, y:0 }}
        className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Election Results</h1>
          <p className="text-slate-500 text-sm mt-1">Live vote tracking across all elections</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
            style={{ background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.25)' }}>
            <motion.span animate={{ scale:[1,1.5,1], opacity:[1,0.4,1] }}
              transition={{ repeat:Infinity, duration:1.5 }}
              className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
            <span className="text-xs text-emerald-400 font-semibold">Live Updates</span>
          </div>
          {/* Chart toggle */}
          <div className="flex gap-1 p-1 rounded-xl"
            style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)' }}>
            {[['bar','📊'],['pie','🥧']].map(([t,icon]) => (
              <motion.button key={t} whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
                onClick={() => setChartType(t)}
                className="text-xs px-3 py-1.5 rounded-lg font-medium transition"
                style={chartType === t
                  ? { background:'rgba(99,102,241,0.3)', border:'1px solid rgba(99,102,241,0.5)', color:'#a5b4fc' }
                  : { color:'#64748b' }}>
                {icon} {t === 'bar' ? 'Bar' : 'Pie'}
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── Global Stats Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="🗳️" label="Total Votes"      value={totalVotesAll}    color="#6366f1" delay={0}    sub="Across all elections" />
        <StatCard icon="📋" label="Total Elections"  value={elections.length} color="#06b6d4" delay={0.05} sub="All time" />
        <StatCard icon="🟢" label="Live Elections"   value={activeCount}      color="#10b981" delay={0.1}  sub="Currently active" />
        <StatCard icon="👥" label="Total Candidates" value={totalCandidates}  color="#8b5cf6" delay={0.15} sub="Across all elections" />
      </div>

      {/* ── Election Dashboards ── */}
      <div className="space-y-8">
        {elections.map((election, idx) => {
          const r      = results[election._id];
          if (!r) return null;
          const winner  = !election.isActive ? r.results[0] : null;
          const leading = election.isActive  ? r.results[0] : null;
          const winMargin = r.results.length >= 2 ? r.results[0]?.votes - r.results[1]?.votes : null;

          const chartData = {
            labels: r.results.map(c => c.name.length > 12 ? c.name.slice(0,12)+'…' : c.name),
            datasets: [{
              label: 'Votes',
              data:  r.results.map(c => c.votes),
              backgroundColor: COLORS.slice(0, r.results.length),
              borderRadius: 10,
              borderSkipped: false,
            }],
          };
          const chartOpts = {
            responsive:true, maintainAspectRatio:false,
            plugins: {
              legend: { display: chartType==='pie', labels:{ color:'#94a3b8', padding:14, font:{size:11}, boxWidth:10 } },
              tooltip: {
                backgroundColor:'rgba(8,12,28,0.95)', borderColor:'rgba(99,102,241,0.4)', borderWidth:1,
                titleColor:'#94a3b8', bodyColor:'#e2e8f0', padding:12, cornerRadius:10,
                callbacks: { label: ctx => ` ${ctx.raw} votes (${r.results[ctx.dataIndex]?.percentage}%)` },
              },
            },
            scales: chartType==='bar' ? {
              x: { grid:{color:'rgba(255,255,255,0.04)'}, ticks:{color:'#64748b',font:{size:11}} },
              y: { grid:{color:'rgba(255,255,255,0.05)'}, ticks:{color:'#64748b',font:{size:11}}, beginAtZero:true },
            } : {},
            animation:{ duration:1000, easing:'easeOutQuart' },
          };

          return (
            <motion.div key={election._id}
              initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }}
              transition={{ delay:idx*0.08, duration:0.5 }}
              className="rounded-2xl overflow-hidden"
              style={{ background:'rgba(255,255,255,0.03)', backdropFilter:'blur(20px)', border:'1px solid rgba(255,255,255,0.07)' }}>

              {/* ── Election Header ── */}
              <div className="px-6 py-4 flex items-center justify-between flex-wrap gap-3"
                style={{ borderBottom:'1px solid rgba(255,255,255,0.06)', background:'rgba(255,255,255,0.02)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                    style={{ background:'rgba(99,102,241,0.15)', border:'1px solid rgba(99,102,241,0.3)' }}>
                    🗳️
                  </div>
                  <div>
                    <h2 className="font-bold text-white text-lg leading-tight">{election.title}</h2>
                    {election.description && <p className="text-slate-500 text-xs mt-0.5">{election.description}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="text-center px-3 py-1.5 rounded-xl"
                    style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)' }}>
                    <p className="text-lg font-bold text-white">{r.totalVotes}</p>
                    <p className="text-xs text-slate-500">votes cast</p>
                  </div>
                  <div className="text-center px-3 py-1.5 rounded-xl"
                    style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)' }}>
                    <p className="text-lg font-bold text-white">{r.results.length}</p>
                    <p className="text-xs text-slate-500">candidates</p>
                  </div>
                  <span className={`text-xs px-3 py-1.5 rounded-full font-semibold`}
                    style={election.isActive
                      ? { background:'rgba(16,185,129,0.15)', border:'1px solid rgba(16,185,129,0.3)', color:'#34d399' }
                      : { background:'rgba(99,102,241,0.15)', border:'1px solid rgba(99,102,241,0.3)', color:'#a5b4fc' }}>
                    {election.isActive ? '🟢 Live' : '✅ Final'}
                  </span>
                </div>
              </div>

              <div className="p-6 space-y-6">

                {/* ── Winner Spotlight (closed only) ── */}
                <AnimatePresence>
                  {!election.isActive && r.totalVotes > 0 && winner && (
                    <motion.div
                      initial={{ opacity:0, scale:0.95, y:10 }}
                      animate={{ opacity:1, scale:1, y:0 }}
                      exit={{ opacity:0 }}
                      transition={{ delay:0.2 }}
                      className="relative overflow-hidden rounded-2xl p-6"
                      style={{
                        background:'linear-gradient(135deg, rgba(245,158,11,0.18), rgba(217,119,6,0.08), rgba(15,23,42,0.5))',
                        border:'1px solid rgba(245,158,11,0.4)',
                        boxShadow:'0 0 40px rgba(245,158,11,0.12)',
                      }}>
                      {/* Animated glow */}
                      <motion.div animate={{ opacity:[0.3,0.6,0.3], scale:[1,1.1,1] }}
                        transition={{ repeat:Infinity, duration:3 }}
                        style={{
                          position:'absolute', top:'-20%', right:'5%',
                          width:200, height:200, borderRadius:'50%',
                          background:'radial-gradient(circle, rgba(245,158,11,0.3), transparent 70%)',
                          pointerEvents:'none',
                        }} />
                      <div className="relative z-10 flex items-center gap-5 flex-wrap">
                        <motion.div animate={{ rotate:[0,5,-5,0] }} transition={{ repeat:Infinity, duration:4 }}
                          className="text-6xl flex-shrink-0">🏆</motion.div>
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <CandidateAvatar name={winner.name} photo={winner.photo} size={64} color="#f59e0b" isWinner />
                          <div className="min-w-0">
                            <p className="text-xs text-amber-400/80 font-bold uppercase tracking-widest mb-1">🎉 Winner Declared</p>
                            <p className="text-2xl font-extrabold text-white truncate">{winner.name}</p>
                            {winner.appliedPost && <p className="text-sm text-amber-300/70 mt-0.5">{winner.appliedPost}</p>}
                            <div className="flex items-center gap-3 mt-2 flex-wrap">
                              <span className="text-sm font-bold text-amber-300">{winner.votes} votes</span>
                              <span className="text-sm text-amber-200/60">·</span>
                              <span className="text-sm font-bold text-amber-300">{winner.percentage}%</span>
                              {winMargin !== null && winMargin > 0 && (
                                <>
                                  <span className="text-sm text-amber-200/60">·</span>
                                  <span className="text-xs px-2 py-0.5 rounded-full"
                                    style={{ background:'rgba(245,158,11,0.2)', color:'#fcd34d', border:'1px solid rgba(245,158,11,0.3)' }}>
                                    +{winMargin} margin
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ── Live Banner ── */}
                {election.isActive && r.totalVotes > 0 && leading && (
                  <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
                    className="flex items-center gap-4 px-5 py-4 rounded-2xl"
                    style={{ background:'rgba(99,102,241,0.08)', border:'1px solid rgba(99,102,241,0.2)' }}>
                    <motion.span animate={{ scale:[1,1.3,1] }} transition={{ repeat:Infinity, duration:2 }}
                      className="text-2xl flex-shrink-0">📊</motion.span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-300">Voting in Progress</p>
                      <p className="text-xs text-slate-500 mt-0.5">Winner will be revealed after election closes</p>
                    </div>
                    <span className="text-xs px-3 py-1.5 rounded-full font-semibold flex-shrink-0"
                      style={{ background:'rgba(245,158,11,0.15)', border:'1px solid rgba(245,158,11,0.3)', color:'#fcd34d' }}>
                      🔒 Results Hidden
                    </span>
                  </motion.div>
                )}

                {r.totalVotes === 0 && (
                  <div className="text-center py-10 text-slate-600">
                    <p className="text-4xl mb-2">📭</p>
                    <p className="text-sm">No votes cast yet</p>
                  </div>
                )}

                {r.totalVotes > 0 && (
                  <>
                    {/* ── Chart (full width, toggle bar/pie) ── */}
                    <div className="rounded-2xl p-5"
                      style={{ background:'rgba(8,12,28,0.7)', border:'1px solid rgba(255,255,255,0.06)' }}>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-slate-300">Vote Distribution</h3>
                        <div className="flex gap-1 p-0.5 rounded-lg"
                          style={{ background:'rgba(255,255,255,0.05)' }}>
                          {[['bar','📊 Bar'],['pie','🥧 Pie']].map(([t,icon]) => (
                            <button key={t} onClick={() => setChartType(t)}
                              className="text-xs px-3 py-1.5 rounded-md transition font-medium"
                              style={chartType===t
                                ? { background:'rgba(99,102,241,0.3)', color:'#a5b4fc', border:'1px solid rgba(99,102,241,0.4)' }
                                : { color:'#475569' }}>
                              {icon}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div style={{ height:240 }}>
                        {chartType==='bar'
                          ? <Bar  data={chartData} options={chartOpts} />
                          : <Pie  data={chartData} options={chartOpts} />}
                      </div>
                    </div>

                    {/* ── Leaderboard (full width, below chart) ── */}
                    <div className="rounded-2xl p-5"
                      style={{ background:'rgba(8,12,28,0.7)', border:'1px solid rgba(255,255,255,0.06)' }}>
                      <h3 className="text-sm font-semibold text-slate-300 mb-4">🏅 Leaderboard</h3>
                      <div className="space-y-2.5">
                        {r.results.map((c, i) => {
                          const isWin = !election.isActive && i === 0;
                          const rankEmoji = ['🥇','🥈','🥉'];
                          return (
                            <motion.div key={c._id}
                              initial={{ opacity:0, x:10 }} animate={{ opacity:1, x:0 }}
                              transition={{ delay:i*0.06 }}
                              whileHover={{ x:3 }}
                              className="flex items-center gap-3 p-3 rounded-xl transition-all"
                              style={{
                                background: isWin ? 'rgba(245,158,11,0.1)' : 'rgba(255,255,255,0.03)',
                                border: isWin ? '1px solid rgba(245,158,11,0.25)' : '1px solid rgba(255,255,255,0.05)',
                              }}>
                              <span className="text-lg flex-shrink-0 w-7 text-center">
                                {i < 3 ? rankEmoji[i] : <span className="text-xs text-slate-500 font-bold">#{i+1}</span>}
                              </span>
                              <CandidateAvatar name={c.name} photo={c.photo} size={36} color={COLORS[i%COLORS.length]} isWinner={isWin} />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-slate-200 truncate">{c.name}</p>
                                {c.appliedPost && <p className="text-xs text-slate-600 truncate">{c.appliedPost}</p>}
                              </div>
                              <div className="text-right flex-shrink-0">
                                <p className="text-sm font-bold" style={{ color: COLORS[i%COLORS.length] }}>{c.percentage}%</p>
                                <p className="text-xs text-slate-600">{c.votes} votes</p>
                              </div>
                            </motion.div>
                          );
                          })}
                        </div>
                      </div>

                    {/* ── Candidate Progress Cards ── */}
                    <div>
                      <h3 className="text-sm font-semibold text-slate-400 mb-3 flex items-center gap-2">
                        <span>📈</span> Detailed Breakdown
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {r.results.map((c, i) => {
                          const isWin = !election.isActive && i === 0 && r.totalVotes > 0;
                          return (
                            <motion.div key={c._id}
                              initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }}
                              transition={{ delay:idx*0.05+i*0.06 }}
                              whileHover={{ y:-3, boxShadow: isWin ? '0 12px 30px rgba(245,158,11,0.2)' : '0 8px 24px rgba(0,0,0,0.4)' }}
                              className="rounded-xl p-4 relative overflow-hidden"
                              style={{
                                background: isWin
                                  ? 'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(217,119,6,0.05))'
                                  : 'rgba(255,255,255,0.03)',
                                border: isWin
                                  ? '1px solid rgba(245,158,11,0.3)'
                                  : '1px solid rgba(255,255,255,0.06)',
                              }}>
                              {/* Rank number bg */}
                              <div style={{
                                position:'absolute', top:8, right:12,
                                fontSize:40, fontWeight:900, opacity:0.04, color:'#fff', lineHeight:1,
                                userSelect:'none',
                              }}>#{i+1}</div>

                              <div className="flex items-center gap-3 mb-3">
                                <CandidateAvatar name={c.name} photo={c.photo} size={40} color={COLORS[i%COLORS.length]} isWinner={isWin} />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-bold text-slate-200 truncate">{c.name}</p>
                                  {c.appliedPost && <p className="text-xs text-slate-500 truncate">{c.appliedPost}</p>}
                                </div>
                                {isWin && (
                                  <span className="text-xs px-2 py-0.5 rounded-full font-bold flex-shrink-0"
                                    style={{ background:'rgba(245,158,11,0.2)', color:'#fcd34d', border:'1px solid rgba(245,158,11,0.3)' }}>
                                    🏆
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-slate-500">{c.votes} votes</span>
                                <span className="text-sm font-extrabold" style={{ color: isWin ? '#f59e0b' : COLORS[i%COLORS.length] }}>
                                  {c.percentage}%
                                </span>
                              </div>

                              <div className="w-full rounded-full h-2 overflow-hidden"
                                style={{ background:'rgba(255,255,255,0.06)' }}>
                                <motion.div
                                  initial={{ width:0 }}
                                  animate={{ width:`${c.percentage}%` }}
                                  transition={{ duration:1, delay:idx*0.08+i*0.07, ease:'easeOut' }}
                                  className="h-2 rounded-full"
                                  style={{ background: isWin ? 'linear-gradient(90deg,#f59e0b,#d97706)' : GRADIENTS[i%GRADIENTS.length] }} />
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          );
        })}

        {elections.length === 0 && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
            className="text-center py-24 text-slate-600">
            <p className="text-6xl mb-4">📊</p>
            <p className="text-lg font-semibold text-slate-500">No elections found</p>
            <p className="text-sm mt-1">Elections will appear here once created</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
