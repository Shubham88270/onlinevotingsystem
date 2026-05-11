import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '../../api/axios.jsx';
import Spinner from '../../components/Spinner.jsx';

const glass = { background:'rgba(255,255,255,0.04)', backdropFilter:'blur(16px)', border:'1px solid rgba(255,255,255,0.08)' };
const inputCls = "w-full rounded-xl px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition";
const inputStyle = { background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)' };

export default function ManageCandidates() {
  const [elections, setElections] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [forms,     setForms]     = useState({});
  const [msgs,      setMsgs]      = useState({});
  const [locked,    setLocked]    = useState({});

  const fetchElections = () => {
    setLoading(true);
    api.get('/elections').then(({ data }) => setElections(Array.isArray(data) ? data : [])).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(() => { fetchElections(); }, []);

  const handleAdd = async (electionId) => {
    const f = forms[electionId] || {};
    if (!f.name?.trim()) return;
    try {
      await api.post(`/elections/${electionId}/candidates`, { name: f.name.trim(), description: f.description || '' });
      setForms(p => ({ ...p, [electionId]: { name:'', description:'' } }));
      setMsgs(p => ({ ...p, [electionId]: { type:'success', text:`✅ "${f.name}" added!` } }));
      fetchElections();
    } catch (err) {
      setMsgs(p => ({ ...p, [electionId]: { type:'error', text:`❌ ${err.response?.data?.message || 'Error'}` } }));
    }
  };

  const handleLock = (electionId, title) => {
    if (!window.confirm(`Lock "${title}"? No more candidates after this.`)) return;
    setLocked(p => ({ ...p, [electionId]: true }));
    setMsgs(p => ({ ...p, [electionId]: { type:'success', text:'🔒 Candidates finalized!' } }));
  };

  if (loading) return <Spinner />;

  return (
    <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.4 }}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Manage Candidates</h1>
        <p className="text-slate-500 text-sm mt-1">Add candidates to existing elections</p>
      </div>

      <div className="space-y-5">
        {elections.map((election, idx) => {
          const isLocked = locked[election._id];
          const msg      = msgs[election._id];
          return (
            <motion.div key={election._id} initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
              transition={{ duration:0.3, delay:idx*0.05 }} style={glass} className="rounded-2xl p-5">

              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-semibold text-white">🗳️ {election.title}</h2>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    election.isActive
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-white/5 text-slate-400 border border-white/10'
                  }`}>{election.isActive ? 'Active' : 'Closed'}</span>
                  {isLocked && <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">🔒 Locked</span>}
                </div>
                {!isLocked && election.candidates.length >= 2 && (
                  <motion.button whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
                    onClick={() => handleLock(election._id, election.title)}
                    className="text-xs px-3 py-1.5 rounded-lg text-amber-400 font-medium transition"
                    style={{ background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.25)' }}>
                    🔒 Finalize
                  </motion.button>
                )}
              </div>

              {/* Message */}
              {msg && (
                <div className={`text-xs px-3 py-2 rounded-lg mb-3 ${
                  msg.type === 'success'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-red-500/10 text-red-400 border border-red-500/20'
                }`}>{msg.text}</div>
              )}

              {/* Candidates */}
              {election.candidates.length === 0 ? (
                <p className="text-sm text-slate-600 mb-3">No candidates yet.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                  {election.candidates.map((c, i) => (
                    <div key={c._id} className="flex items-center justify-between rounded-xl px-3 py-2.5"
                      style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)' }}>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-600 font-bold w-5">#{i+1}</span>
                        <div>
                          <p className="text-sm font-medium text-slate-200">{c.name}</p>
                          {c.description && <p className="text-xs text-slate-500">{c.description}</p>}
                          {c.appliedPost && <p className="text-xs text-violet-400">{c.appliedPost}</p>}
                        </div>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 flex-shrink-0">
                        {c.votes} votes
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Add form */}
              {isLocked ? (
                <div className="rounded-xl px-4 py-3 text-sm text-slate-500 text-center"
                  style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)' }}>
                  🔒 Candidates finalized. No more additions allowed.
                </div>
              ) : (
                <div className="flex gap-2">
                  <input placeholder="Candidate name *"
                    value={forms[election._id]?.name || ''}
                    onChange={e => setForms(p => ({ ...p, [election._id]: { ...p[election._id], name:e.target.value } }))}
                    className={`flex-1 ${inputCls}`} style={inputStyle} />
                  <input placeholder="Description (optional)"
                    value={forms[election._id]?.description || ''}
                    onChange={e => setForms(p => ({ ...p, [election._id]: { ...p[election._id], description:e.target.value } }))}
                    className={`flex-1 ${inputCls}`} style={inputStyle} />
                  <motion.button whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
                    onClick={() => handleAdd(election._id)}
                    className="text-white px-4 py-2 rounded-xl text-sm font-medium transition"
                    style={{ background:'linear-gradient(135deg,#3b82f6,#1e40af)', boxShadow:'0 4px 15px rgba(59,130,246,0.3)' }}>
                    Add
                  </motion.button>
                </div>
              )}
            </motion.div>
          );
        })}
        {elections.length === 0 && (
          <div className="text-center py-16 text-slate-600">
            <p className="text-4xl mb-3">🙋</p>
            <p>No elections found. Create one first.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
