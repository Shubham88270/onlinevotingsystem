import React, { useEffect, useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  BarElement, ArcElement, Title, Tooltip, Legend,
} from 'chart.js';
import api from '../../api/axios.jsx';
import Spinner from '../../components/Spinner.jsx';
import socket from '../../socket.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

const COLORS = ['#6366f1','#8b5cf6','#06b6d4','#10b981','#f59e0b','#ef4444','#f97316','#84cc16'];
const glass  = { background:'rgba(255,255,255,0.04)', backdropFilter:'blur(20px)', border:'1px solid rgba(255,255,255,0.08)' };

// ── Candidate Avatar ──────────────────────────────────────────────────────────
function CandidateAvatar({ candidate, size = 56, isWinner }) {
  const initials = candidate.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2);
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.28, overflow: 'hidden', flexShrink: 0,
      border: isWinner ? '2px solid #f59e0b' : '2px solid rgba(255,255,255,0.1)',
      boxShadow: isWinner ? '0 0 16px rgba(245,158,11,0.5)' : 'none',
    }}>
      {candidate.photo ? (
        <img src={candidate.photo} alt={candidate.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
      ) : (
        <div style={{
          width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center',
          background: isWinner ? 'linear-gradient(135deg,#f59e0b,#d97706)' : 'linear-gradient(135deg,#6366f1,#4f46e5)',
          color:'#fff', fontWeight:700, fontSize: size * 0.32,
        }}>{initials}</div>
      )}
    </div>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, color, delay }) {
  return (
    <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay, duration:0.4 }}
      whileHover={{ y:-3, boxShadow:'0 12px 40px rgba(0,0,0,0.4)' }}
      className="rounded-2xl p-5 flex items-center gap-4" style={glass}>
      <div style={{
        width:48, height:48, borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center',
        fontSize:22, background:`${color}22`, border:`1px solid ${color}44`,
      }}>{icon}</div>
      <div>
        <p style={{ color:'#64748b', fontSize:12, marginBottom:2 }}>{label}</p>
        <p style={{ color:'#f1f5f9', fontSize:22, fontWeight:700, lineHeight:1 }}>{value}</p>
      </div>
    </motion.div>
  );
}

// ── Download helpers ──────────────────────────────────────────────────────────
function downloadCSV(election, r) {
  const rows = [
    ['Rank','Candidate','Applied Post','Votes','Percentage'],
    ...r.results.map((c,i) => [i+1, c.name, c.appliedPost||'—', c.votes, `${c.percentage}%`]),
    [],
    ['Election', election.title],
    ['Total Votes', r.totalVotes],
    ['Status', election.isActive ? 'Live' : 'Final'],
  ];
  const csv = rows.map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type:'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = `${election.title.replace(/\s+/g,'_')}_results.csv`; a.click();
  URL.revokeObjectURL(url);
}

// ── Single Election Dashboard ─────────────────────────────────────────────────
function ElectionDashboard({ election, r, idx }) {
  const [chartType,  setChartType]  = useState('bar');
  const [search,     setSearch]     = useState('');
  const [sortBy,     setSortBy]     = useState('votes'); // votes | name
  const [expanded,   setExpanded]   = useState(idx === 0);

  const winner = !election.isActive ? r.results[0] : null; // winner only when closed
  const leading = election.isActive ? r.results[0] : null; // leading candidate during live

  const filtered = useMemo(() => {
    let list = [...r.results];
    if (search.trim()) list = list.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
    if (sortBy === 'name') list.sort((a,b) => a.name.localeCompare(b.name));
    else list.sort((a,b) => b.votes - a.votes);
    return list;
  }, [r.results, search, sortBy]);

  const chartData = {
    labels: r.results.map(c => c.name.length > 14 ? c.name.slice(0,14)+'…' : c.name),
    datasets: [{
      label: 'Votes',
      data: r.results.map(c => c.votes),
      backgroundColor: COLORS.slice(0, r.results.length),
      borderRadius: 10,
      borderSkipped: false,
    }],
  };

  const chartOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { display: chartType === 'pie', labels: { color:'#94a3b8', padding:14, font:{ size:12 } } },
      tooltip: {
        backgroundColor:'rgba(8,12,28,0.95)', borderColor:'rgba(99,102,241,0.3)', borderWidth:1,
        titleColor:'#94a3b8', bodyColor:'#e2e8f0', padding:12, cornerRadius:10,
        callbacks: { label: ctx => ` ${ctx.raw} votes (${r.results[ctx.dataIndex]?.percentage}%)` },
      },
    },
    scales: chartType === 'bar' ? {
      x: { grid:{ color:'rgba(255,255,255,0.04)' }, ticks:{ color:'#64748b', font:{ size:11 } } },
      y: { grid:{ color:'rgba(255,255,255,0.04)' }, ticks:{ color:'#64748b', font:{ size:11 } }, beginAtZero:true },
    } : {},
    animation: { duration:900, easing:'easeOutQuart' },
  };

  const winMargin = r.results.length >= 2
    ? r.results[0].votes - r.results[1].votes
    : null;

  return (
    <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
      transition={{ delay: idx * 0.07, duration:0.5 }}
      className="rounded-2xl overflow-hidden" style={glass}>

      {/* ── Election Header ── */}
      <div className="px-6 py-5 cursor-pointer select-none"
        style={{ borderBottom: expanded ? '1px solid rgba(255,255,255,0.06)' : 'none' }}
        onClick={() => setExpanded(p => !p)}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-lg font-bold text-white truncate">{election.title}</h2>
              {/* Status badge */}
              {election.isActive ? (
                <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-semibold"
                  style={{ background:'rgba(16,185,129,0.15)', border:'1px solid rgba(16,185,129,0.3)', color:'#34d399' }}>
                  <motion.span animate={{ scale:[1,1.4,1] }} transition={{ repeat:Infinity, duration:1.5 }}
                    className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                  Live Counting
                </span>
              ) : (
                <span className="text-xs px-2.5 py-1 rounded-full font-semibold"
                  style={{ background:'rgba(99,102,241,0.15)', border:'1px solid rgba(99,102,241,0.3)', color:'#a5b4fc' }}>
                  ✅ Final Result Declared
                </span>
              )}
            </div>
            {election.description && (
              <p className="text-slate-500 text-sm mt-1 truncate">{election.description}</p>
            )}
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <button onClick={e => { e.stopPropagation(); downloadCSV(election, r); }}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl font-medium transition"
              style={{ background:'rgba(59,130,246,0.15)', border:'1px solid rgba(59,130,246,0.3)', color:'#93c5fd' }}
              title="Download CSV">
              ⬇️ CSV
            </button>
            <motion.span animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration:0.25 }}
              className="text-slate-500 text-lg">▾</motion.span>
          </div>
        </div>

        {/* Quick stats row */}
        <div className="flex items-center gap-6 mt-3 flex-wrap">
          <span className="text-sm text-slate-400">🗳️ <strong className="text-white">{r.totalVotes}</strong> votes cast</span>
          <span className="text-sm text-slate-400">👥 <strong className="text-white">{r.results.length}</strong> candidates</span>
          {!election.isActive && winMargin !== null && r.totalVotes > 0 && (
            <span className="text-sm text-slate-400">📈 Winning margin: <strong className="text-amber-400">{winMargin}</strong></span>
          )}
          {election.isActive && (
            <span className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.2)', color:'#fcd34d' }}>
              🔒 Winner hidden until election closes
            </span>
          )}
        </div>
      </div>

      {/* ── Expanded Content ── */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div key="body"
            initial={{ height:0, opacity:0 }} animate={{ height:'auto', opacity:1 }}
            exit={{ height:0, opacity:0 }} transition={{ duration:0.35, ease:[0.22,1,0.36,1] }}
            style={{ overflow:'hidden' }}>
            <div className="p-6 space-y-6">

              {/* ── Winner Banner — only when election is CLOSED ── */}
              {!election.isActive && r.totalVotes > 0 && winner && (
                <motion.div initial={{ opacity:0, scale:0.96 }} animate={{ opacity:1, scale:1 }}
                  transition={{ delay:0.15 }}
                  className="relative overflow-hidden rounded-2xl p-5 flex items-center gap-5"
                  style={{
                    background:'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(217,119,6,0.08))',
                    border:'1px solid rgba(245,158,11,0.35)',
                    boxShadow:'0 0 40px rgba(245,158,11,0.12)',
                  }}>
                  {/* Glow blob */}
                  <div style={{
                    position:'absolute', top:'-30%', right:'-5%',
                    width:160, height:160, borderRadius:'50%',
                    background:'radial-gradient(circle, rgba(245,158,11,0.2), transparent 70%)',
                    pointerEvents:'none',
                  }} />
                  <motion.div animate={{ rotate:[0,8,-8,0] }} transition={{ repeat:Infinity, duration:3, ease:'easeInOut' }}
                    className="text-5xl flex-shrink-0">🏆</motion.div>
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <CandidateAvatar candidate={winner} size={60} isWinner />
                    <div className="min-w-0">
                      <p className="text-xs text-amber-400/70 font-medium uppercase tracking-wider">Winner</p>
                      <p className="text-xl font-extrabold text-white truncate">{winner.name}</p>
                      {winner.appliedPost && <p className="text-sm text-amber-300/70">{winner.appliedPost}</p>}
                      <p className="text-sm text-amber-200/60 mt-0.5">{winner.votes} votes · {winner.percentage}%</p>
                    </div>
                  </div>
                  {winMargin !== null && (
                    <div className="text-right flex-shrink-0 hidden sm:block">
                      <p className="text-xs text-slate-500">Winning margin</p>
                      <p className="text-2xl font-bold text-amber-400">+{winMargin}</p>
                      <p className="text-xs text-slate-600">votes ahead</p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* ── Live — Leading candidate (no winner declared) ── */}
              {election.isActive && r.totalVotes > 0 && leading && (
                <motion.div initial={{ opacity:0, scale:0.96 }} animate={{ opacity:1, scale:1 }}
                  transition={{ delay:0.15 }}
                  className="relative overflow-hidden rounded-2xl p-4 flex items-center gap-4"
                  style={{
                    background:'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(5,150,105,0.05))',
                    border:'1px solid rgba(16,185,129,0.25)',
                  }}>
                  <motion.span animate={{ scale:[1,1.2,1] }} transition={{ repeat:Infinity, duration:1.5 }}
                    className="text-3xl flex-shrink-0">📊</motion.span>
                  <div>
                    <p className="text-xs text-emerald-400/70 font-medium uppercase tracking-wider">Currently Leading</p>
                    <p className="text-lg font-bold text-white">{leading.name}</p>
                    <p className="text-sm text-emerald-300/70">{leading.votes} votes · {leading.percentage}%</p>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="text-xs text-slate-500">Winner declared after</p>
                    <p className="text-xs text-slate-400">election closes 🔒</p>
                  </div>
                </motion.div>
              )}
                <div className="text-center py-10 text-slate-600">
                  <p className="text-4xl mb-3">📊</p>
                  <p className="text-sm">No votes cast yet.</p>
                </div>
              )}

              {r.totalVotes > 0 && (
                <>
                  {/* ── Charts ── */}
                  <div className="rounded-2xl p-5" style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)' }}>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-semibold text-slate-300">Vote Distribution</h3>
                      <div className="flex gap-1.5">
                        {[['bar','📊 Bar'],['pie','🥧 Pie']].map(([t,label]) => (
                          <button key={t} onClick={() => setChartType(t)}
                            className="text-xs px-3 py-1.5 rounded-lg font-medium transition"
                            style={chartType === t
                              ? { background:'rgba(99,102,241,0.25)', border:'1px solid rgba(99,102,241,0.4)', color:'#a5b4fc' }
                              : { background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', color:'#64748b' }}>
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div style={{ height: 220 }}>
                      {chartType === 'bar'
                        ? <Bar data={chartData} options={chartOpts} />
                        : <Pie data={chartData} options={chartOpts} />}
                    </div>
                  </div>

                  {/* ── Candidate Cards Grid ── */}
                  <div>
                    {/* Search + Sort toolbar */}
                    <div className="flex items-center gap-3 mb-4 flex-wrap">
                      <div className="flex items-center gap-2 flex-1 min-w-0 rounded-xl px-3 py-2"
                        style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)' }}>
                        <span className="text-slate-500 text-sm">🔍</span>
                        <input value={search} onChange={e => setSearch(e.target.value)}
                          placeholder="Search candidates…"
                          className="bg-transparent text-sm text-slate-300 placeholder-slate-600 focus:outline-none w-full" />
                        {search && (
                          <button onClick={() => setSearch('')} className="text-slate-600 hover:text-slate-400 text-xs">✕</button>
                        )}
                      </div>
                      <div className="flex gap-1.5">
                        {[['votes','🔢 Votes'],['name','🔤 Name']].map(([s,label]) => (
                          <button key={s} onClick={() => setSortBy(s)}
                            className="text-xs px-3 py-2 rounded-xl font-medium transition whitespace-nowrap"
                            style={sortBy === s
                              ? { background:'rgba(99,102,241,0.2)', border:'1px solid rgba(99,102,241,0.35)', color:'#a5b4fc' }
                              : { background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', color:'#64748b' }}>
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <AnimatePresence>
                        {filtered.map((c, i) => {
                          const isWinner = !election.isActive && c._id === winner?._id && r.totalVotes > 0;
                          const rank = r.results.findIndex(x => x._id === c._id);
                          const rankColors = ['#f59e0b','#94a3b8','#cd7c2f'];
                          const rankEmoji  = ['🥇','🥈','🥉'];
                          return (
                            <motion.div key={c._id}
                              layout
                              initial={{ opacity:0, scale:0.92 }}
                              animate={{ opacity:1, scale:1 }}
                              exit={{ opacity:0, scale:0.88 }}
                              transition={{ delay: i * 0.04, duration:0.3 }}
                              whileHover={{ y:-4, boxShadow: isWinner ? '0 16px 48px rgba(245,158,11,0.25)' : '0 12px 36px rgba(0,0,0,0.5)' }}
                              className="rounded-2xl p-4 relative overflow-hidden"
                              style={{
                                background: isWinner
                                  ? 'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(217,119,6,0.06))'
                                  : 'rgba(255,255,255,0.04)',
                                border: isWinner
                                  ? '1px solid rgba(245,158,11,0.4)'
                                  : '1px solid rgba(255,255,255,0.07)',
                                boxShadow: isWinner ? '0 0 30px rgba(245,158,11,0.1)' : 'none',
                              }}>

                              {/* Winner pulse ring */}
                              {isWinner && (
                                <motion.div animate={{ scale:[1,1.05,1], opacity:[0.5,0.2,0.5] }}
                                  transition={{ repeat:Infinity, duration:2.5 }}
                                  style={{
                                    position:'absolute', inset:-1, borderRadius:16,
                                    border:'2px solid rgba(245,158,11,0.5)', pointerEvents:'none',
                                  }} />
                              )}

                              {/* Rank badge */}
                              <div style={{
                                position:'absolute', top:12, right:12,
                                width:28, height:28, borderRadius:8,
                                display:'flex', alignItems:'center', justifyContent:'center',
                                fontSize:16,
                                background: rank < 3 ? `${rankColors[rank]}22` : 'rgba(255,255,255,0.06)',
                                border: rank < 3 ? `1px solid ${rankColors[rank]}44` : '1px solid rgba(255,255,255,0.08)',
                              }}>
                                {rank < 3 ? rankEmoji[rank] : `#${rank+1}`}
                              </div>

                              {/* Avatar + name */}
                              <div className="flex items-center gap-3 mb-4">
                                <CandidateAvatar candidate={c} size={52} isWinner={isWinner} />
                                <div className="min-w-0 flex-1">
                                  <p className="font-bold text-white text-sm truncate pr-8">{c.name}</p>
                                  {c.appliedPost && (
                                    <p className="text-xs text-slate-500 truncate">{c.appliedPost}</p>
                                  )}
                                  {c.symbol && (
                                    <p className="text-xs text-slate-600 mt-0.5">{c.symbol}</p>
                                  )}
                                </div>
                              </div>

                              {/* Vote count */}
                              <div className="flex items-end justify-between mb-3">
                                <div>
                                  <p className="text-2xl font-extrabold" style={{ color: isWinner ? '#f59e0b' : '#e2e8f0' }}>
                                    {c.votes}
                                  </p>
                                  <p className="text-xs text-slate-600">votes</p>
                                </div>
                                <p className="text-lg font-bold" style={{ color: COLORS[rank % COLORS.length] }}>
                                  {c.percentage}%
                                </p>
                              </div>

                              {/* Animated progress bar */}
                              <div className="w-full rounded-full h-2" style={{ background:'rgba(255,255,255,0.06)' }}>
                                <motion.div
                                  initial={{ width:0 }}
                                  animate={{ width:`${c.percentage}%` }}
                                  transition={{ duration:0.9, delay: i*0.06, ease:'easeOut' }}
                                  className="h-2 rounded-full"
                                  style={{
                                    background: isWinner
                                      ? 'linear-gradient(90deg,#f59e0b,#d97706)'
                                      : `linear-gradient(90deg,${COLORS[rank%COLORS.length]},${COLORS[(rank+1)%COLORS.length]})`,
                                  }} />
                              </div>

                              {/* Winner badge */}
                              {isWinner && (
                                <motion.div initial={{ opacity:0, y:4 }} animate={{ opacity:1, y:0 }}
                                  transition={{ delay:0.4 }}
                                  className="mt-3 text-center text-xs font-bold py-1 rounded-lg"
                                  style={{ background:'rgba(245,158,11,0.2)', color:'#fcd34d', border:'1px solid rgba(245,158,11,0.3)' }}>
                                  🏆 Winner
                                </motion.div>
                              )}
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    </div>

                    {filtered.length === 0 && (
                      <p className="text-center text-slate-600 text-sm py-8">No candidates match your search.</p>
                    )}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminResults() {
  const [elections, setElections] = useState([]);
  const [results,   setResults]   = useState({});
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');

  const loadResults = async (elecs) => {
    const res = {};
    await Promise.all(elecs.map(async e => {
      try { const { data } = await api.get(`/votes/results/${e._id}`); res[e._id] = data; }
      catch { res[e._id] = { totalVotes:0, results:[] }; }
    }));
    setResults(res);
  };

  useEffect(() => {
    const init = async () => {
      try {
        const { data: elecs } = await api.get('/elections');
        const safeElecs = Array.isArray(elecs) ? elecs : [];
        setElections(safeElecs);
        await loadResults(safeElecs);
        socket.connect();
        safeElecs.forEach(e => socket.emit('joinElection', e._id));
      } catch { setError('Failed to load results'); }
      finally { setLoading(false); }
    };
    init();

    socket.on('voteUpdate', ({ electionId, candidates }) => {
      setResults(prev => {
        const old = prev[electionId];
        if (!old) return prev;
        const total = candidates.reduce((s,c) => s + c.votes, 0);
        const updated = candidates
          .map(c => ({ ...c, percentage: total > 0 ? ((c.votes/total)*100).toFixed(1) : '0.0' }))
          .sort((a,b) => b.votes - a.votes);
        return { ...prev, [electionId]: { ...old, totalVotes:total, results:updated, winner:updated[0] } };
      });
    });

    return () => { socket.off('voteUpdate'); socket.disconnect(); };
  }, []);

  // Global stats
  const totalVotesAll  = Object.values(results).reduce((s,r) => s + (r?.totalVotes||0), 0);
  const activeCount    = elections.filter(e => e.isActive).length;
  const closedCount    = elections.length - activeCount;

  if (loading) return <Spinner />;
  if (error)   return <p className="text-red-400 p-4">{error}</p>;

  return (
    <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.4 }}
      className="space-y-6">

      {/* ── Page Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white">Election Results</h1>
          <p className="text-slate-500 text-sm mt-1">Live vote counts and final results across all elections</p>
        </div>
        <div className="flex items-center gap-2">
          <motion.span animate={{ scale:[1,1.3,1] }} transition={{ repeat:Infinity, duration:2 }}
            className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-xs text-emerald-400 font-medium">Live Updates</span>
        </div>
      </div>

      {/* ── Global Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="🗳️" label="Total Votes Cast"  value={totalVotesAll} color="#6366f1" delay={0}    />
        <StatCard icon="📋" label="Total Elections"   value={elections.length} color="#06b6d4" delay={0.05} />
        <StatCard icon="🟢" label="Live Elections"    value={activeCount}   color="#10b981" delay={0.1}  />
        <StatCard icon="✅" label="Closed Elections"  value={closedCount}   color="#f59e0b" delay={0.15} />
      </div>

      {/* ── Election Dashboards ── */}
      <div className="space-y-4">
        {elections.map((election, idx) => {
          const r = results[election._id];
          if (!r) return null;
          return <ElectionDashboard key={election._id} election={election} r={r} idx={idx} />;
        })}
        {elections.length === 0 && (
          <div className="text-center py-20 text-slate-600">
            <p className="text-5xl mb-4">📊</p>
            <p className="text-lg font-medium">No elections found</p>
            <p className="text-sm mt-1">Create an election to see results here.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
