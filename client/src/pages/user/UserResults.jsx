import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import api from '../../api/axios.jsx';
import Spinner from '../../components/Spinner.jsx';
import socket from '../../socket.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

const glass     = { background:'rgba(255,255,255,0.04)', backdropFilter:'blur(16px)', border:'1px solid rgba(255,255,255,0.08)' };
const darkCard  = { background:'rgba(15,23,42,0.6)',    backdropFilter:'blur(20px)', border:'1px solid rgba(255,255,255,0.07)' };
const COLORS    = ['#6366f1','#8b5cf6','#06b6d4','#10b981','#f59e0b','#ef4444'];
const GRADIENTS = [
  'linear-gradient(90deg,#6366f1,#8b5cf6)',
  'linear-gradient(90deg,#8b5cf6,#a855f7)',
  'linear-gradient(90deg,#06b6d4,#0891b2)',
  'linear-gradient(90deg,#10b981,#059669)',
  'linear-gradient(90deg,#f59e0b,#d97706)',
  'linear-gradient(90deg,#ef4444,#dc2626)',
];

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

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }}
        className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Election Results</h1>
          <p className="text-slate-500 text-sm mt-1">Live vote counts across all elections</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Live indicator */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
            style={{ background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.2)' }}>
            <motion.span animate={{ scale:[1,1.4,1], opacity:[1,0.5,1] }}
              transition={{ repeat:Infinity, duration:1.5 }}
              className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
            <span className="text-xs text-emerald-400 font-medium">Live</span>
          </div>
          {/* Chart toggle */}
          <div className="flex gap-1 p-1 rounded-xl" style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)' }}>
            {[['bar','📊 Bar'],['pie','🥧 Pie']].map(([t,label]) => (
              <motion.button key={t} whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
                onClick={() => setChartType(t)}
                className="text-xs px-3 py-1.5 rounded-lg font-medium transition"
                style={chartType === t
                  ? { background:'rgba(99,102,241,0.3)', border:'1px solid rgba(99,102,241,0.5)', color:'#a5b4fc' }
                  : { color:'#64748b' }}>
                {label}
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── Election Cards ── */}
      <div className="space-y-6">
        {elections.map((election, idx) => {
          const r       = results[election._id];
          if (!r) return null;
          const winner  = !election.isActive ? r.results[0] : null;
          const leading = election.isActive  ? r.results[0] : null;

          // ── Dark chart options ──
          const chartData = {
            labels: r.results.map(c => c.name.length > 14 ? c.name.slice(0,14)+'…' : c.name),
            datasets: [{
              label: 'Votes',
              data:  r.results.map(c => c.votes),
              backgroundColor: COLORS.slice(0, r.results.length),
              borderRadius: 10,
              borderSkipped: false,
            }],
          };
          const chartOpts = {
            responsive: true, maintainAspectRatio: false,
            plugins: {
              legend: {
                display: chartType === 'pie',
                labels: { color:'#94a3b8', padding:14, font:{ size:12 }, boxWidth:12 },
              },
              tooltip: {
                backgroundColor: 'rgba(8,12,28,0.95)',
                borderColor:     'rgba(99,102,241,0.4)',
                borderWidth:     1,
                titleColor:      '#94a3b8',
                bodyColor:       '#e2e8f0',
                padding:         12,
                cornerRadius:    10,
                callbacks: { label: ctx => ` ${ctx.raw} votes (${r.results[ctx.dataIndex]?.percentage}%)` },
              },
            },
            scales: chartType === 'bar' ? {
              x: {
                grid:  { color:'rgba(255,255,255,0.04)', drawBorder:false },
                ticks: { color:'#64748b', font:{ size:11 } },
              },
              y: {
                grid:  { color:'rgba(255,255,255,0.06)', drawBorder:false },
                ticks: { color:'#64748b', font:{ size:11 } },
                beginAtZero: true,
              },
            } : {},
            animation: { duration:1000, easing:'easeOutQuart' },
          };

          return (
            <motion.div key={election._id}
              initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }}
              transition={{ delay: idx*0.08, duration:0.5 }}
              className="rounded-2xl overflow-hidden" style={glass}>

              {/* ── Election Header ── */}
              <div className="px-5 py-4 flex items-center justify-between flex-wrap gap-3"
                style={{ borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
                <div>
                  <h2 className="font-bold text-white text-lg">{election.title}</h2>
                  {election.description && <p className="text-slate-500 text-xs mt-0.5">{election.description}</p>}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-400">
                    🗳️ <strong className="text-white">{r.totalVotes}</strong> votes
                  </span>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                    election.isActive
                      ? 'text-emerald-400 border border-emerald-500/30'
                      : 'text-slate-400 border border-white/10'
                  }`} style={{
                    background: election.isActive ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.05)',
                  }}>
                    {election.isActive ? '🟢 Live' : '🔴 Closed'}
                  </span>
                </div>
              </div>

              <div className="p-5 space-y-5">

                {/* ── Winner Banner (closed only) ── */}
                <AnimatePresence>
                  {!election.isActive && r.totalVotes > 0 && winner && (
                    <motion.div
                      initial={{ opacity:0, scale:0.95, y:10 }}
                      animate={{ opacity:1, scale:1, y:0 }}
                      exit={{ opacity:0, scale:0.95 }}
                      transition={{ delay:0.2 }}
                      className="relative overflow-hidden rounded-2xl p-5 flex items-center gap-4"
                      style={{
                        background: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(217,119,6,0.1))',
                        border:     '1px solid rgba(245,158,11,0.4)',
                        boxShadow:  '0 0 30px rgba(245,158,11,0.1)',
                      }}>
                      {/* Glow */}
                      <div style={{
                        position:'absolute', top:'-40%', right:'-5%',
                        width:180, height:180, borderRadius:'50%',
                        background:'radial-gradient(circle, rgba(245,158,11,0.25), transparent 70%)',
                        pointerEvents:'none',
                      }} />
                      <motion.div
                        animate={{ rotate:[0,8,-8,0], scale:[1,1.05,1] }}
                        transition={{ repeat:Infinity, duration:3, ease:'easeInOut' }}
                        className="text-5xl flex-shrink-0">🏆</motion.div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-amber-400/80 font-semibold uppercase tracking-widest mb-1">🎉 Winner Declared</p>
                        <p className="text-xl font-extrabold text-white truncate">{winner.name}</p>
                        {winner.appliedPost && <p className="text-sm text-amber-300/70">{winner.appliedPost}</p>}
                        <p className="text-sm text-amber-200/60 mt-1">
                          {winner.votes} votes &nbsp;·&nbsp; {winner.percentage}%
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ── Live Banner (active only) ── */}
                {election.isActive && r.totalVotes > 0 && leading && (
                  <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl"
                    style={{ background:'rgba(99,102,241,0.08)', border:'1px solid rgba(99,102,241,0.2)' }}>
                    <motion.span animate={{ scale:[1,1.2,1] }} transition={{ repeat:Infinity, duration:2 }}
                      className="text-lg">📊</motion.span>
                    <p className="text-xs text-slate-400 flex-1">Voting in progress — winner will be revealed after election closes</p>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0"
                      style={{ background:'rgba(245,158,11,0.15)', border:'1px solid rgba(245,158,11,0.3)', color:'#fcd34d' }}>
                      🔒 Hidden
                    </span>
                  </motion.div>
                )}

                {/* ── Chart ── */}
                {r.totalVotes > 0 && (
                  <div className="rounded-xl p-4" style={{ background:'rgba(8,12,28,0.6)', border:'1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ height: 200 }}>
                      {chartType === 'bar'
                        ? <Bar   data={chartData} options={chartOpts} />
                        : <Pie   data={chartData} options={chartOpts} />}
                    </div>
                  </div>
                )}

                {/* ── Candidate Cards ── */}
                <div className="space-y-3">
                  {r.results.map((c, i) => {
                    const isWinner = !election.isActive && i === 0 && r.totalVotes > 0;
                    const rankEmoji = ['🥇','🥈','🥉'];
                    return (
                      <motion.div key={c._id}
                        initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }}
                        transition={{ delay: idx*0.05 + i*0.06 }}
                        className="rounded-xl p-4"
                        style={{
                          background: isWinner
                            ? 'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(217,119,6,0.06))'
                            : 'rgba(255,255,255,0.03)',
                          border: isWinner
                            ? '1px solid rgba(245,158,11,0.35)'
                            : '1px solid rgba(255,255,255,0.06)',
                          boxShadow: isWinner ? '0 0 20px rgba(245,158,11,0.08)' : 'none',
                        }}>
                        <div className="flex items-center justify-between mb-2.5">
                          <div className="flex items-center gap-2.5">
                            {/* Rank badge */}
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0"
                              style={{
                                background: i < 3 ? `${COLORS[i]}22` : 'rgba(255,255,255,0.06)',
                                border:     i < 3 ? `1px solid ${COLORS[i]}44` : '1px solid rgba(255,255,255,0.08)',
                                color:      i < 3 ? COLORS[i] : '#64748b',
                              }}>
                              {i < 3 ? rankEmoji[i] : `#${i+1}`}
                            </div>
                            <span className="font-semibold text-slate-200 text-sm">{c.name}</span>
                            {isWinner && (
                              <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                                style={{ background:'rgba(245,158,11,0.2)', color:'#fcd34d', border:'1px solid rgba(245,158,11,0.3)' }}>
                                Winner
                              </span>
                            )}
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-bold" style={{ color: COLORS[i % COLORS.length] }}>
                              {c.percentage}%
                            </span>
                            <span className="text-xs text-slate-500 ml-2">({c.votes} votes)</span>
                          </div>
                        </div>
                        {/* Progress bar */}
                        <div className="w-full rounded-full h-2.5 overflow-hidden"
                          style={{ background:'rgba(255,255,255,0.06)' }}>
                          <motion.div
                            initial={{ width:0 }}
                            animate={{ width:`${c.percentage}%` }}
                            transition={{ duration:0.9, delay: idx*0.08 + i*0.06, ease:'easeOut' }}
                            className="h-2.5 rounded-full"
                            style={{ background: isWinner ? 'linear-gradient(90deg,#f59e0b,#d97706)' : GRADIENTS[i % GRADIENTS.length] }} />
                        </div>
                      </motion.div>
                    );
                  })}
                  {r.results.length === 0 && (
                    <p className="text-slate-600 text-sm text-center py-6">No votes cast yet.</p>
                  )}
                </div>

              </div>
            </motion.div>
          );
        })}

        {elections.length === 0 && (
          <div className="text-center py-20 text-slate-600">
            <p className="text-5xl mb-4">📊</p>
            <p className="text-lg font-medium">No elections found</p>
          </div>
        )}
      </div>
    </div>
  );
}
