import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '../../api/axios.jsx';
import Spinner from '../../components/Spinner.jsx';

const glass = { background:'rgba(255,255,255,0.04)', backdropFilter:'blur(16px)', border:'1px solid rgba(255,255,255,0.08)' };

export default function VotesMonitoring() {
  const [elections, setElections] = useState([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    api.get('/elections').then(({ data }) => setElections(Array.isArray(data) ? data : [])).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const totalVotesAll = elections.reduce((s, e) => s + e.candidates.reduce((cs, c) => cs + (c.votes||0), 0), 0);

  return (
    <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.4 }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Votes Monitoring</h1>
          <p className="text-slate-500 text-sm mt-1">Live vote tracking across all elections</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-white">{totalVotesAll}</p>
          <p className="text-xs text-slate-500">Total votes cast</p>
        </div>
      </div>

      <div className="space-y-5">
        {elections.map((election, idx) => {
          const totalVotes = election.candidates.reduce((s, c) => s + (c.votes||0), 0);
          const sorted = [...election.candidates].sort((a,b) => b.votes - a.votes);
          const COLORS = ['linear-gradient(90deg,#3b82f6,#6366f1)','linear-gradient(90deg,#8b5cf6,#a855f7)','linear-gradient(90deg,#06b6d4,#0891b2)','linear-gradient(90deg,#10b981,#059669)','linear-gradient(90deg,#f59e0b,#d97706)','linear-gradient(90deg,#ef4444,#dc2626)'];

          return (
            <motion.div key={election._id} initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
              transition={{ duration:0.3, delay:idx*0.06 }} style={glass} className="rounded-2xl p-5">

              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="font-semibold text-white">{election.title}</h2>
                  {election.description && <p className="text-xs text-slate-500 mt-0.5">{election.description}</p>}
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-lg font-bold text-white">{totalVotes}</p>
                    <p className="text-xs text-slate-500">votes</p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    election.isActive
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-white/5 text-slate-400 border border-white/10'
                  }`}>{election.isActive ? '🟢 Active' : '🔴 Closed'}</span>
                </div>
              </div>

              {sorted.length === 0 ? (
                <p className="text-sm text-slate-600">No candidates.</p>
              ) : (
                <div className="space-y-3">
                  {sorted.map((c, i) => {
                    const pct = totalVotes > 0 ? ((c.votes / totalVotes) * 100).toFixed(1) : 0;
                    return (
                      <div key={c._id}>
                        <div className="flex justify-between text-sm mb-1.5">
                          <span className="font-medium text-slate-200 flex items-center gap-1.5">
                            {i === 0 && totalVotes > 0 && <span className="text-amber-400">🏆</span>}
                            {c.name}
                          </span>
                          <span className="text-slate-400">{c.votes} <span className="text-slate-600">({pct}%)</span></span>
                        </div>
                        <div className="w-full rounded-full h-2.5 overflow-hidden" style={{ background:'rgba(255,255,255,0.06)' }}>
                          <motion.div initial={{ width:0 }} animate={{ width:`${pct}%` }}
                            transition={{ duration:0.8, delay:idx*0.06 + i*0.05, ease:'easeOut' }}
                            className="h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          );
        })}
        {elections.length === 0 && (
          <div className="text-center py-16 text-slate-600">
            <p className="text-4xl mb-3">📡</p>
            <p>No elections found.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
