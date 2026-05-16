import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../api/axios.jsx';
import Spinner from '../../components/Spinner.jsx';
import CountdownTimer from '../../components/CountdownTimer.jsx';

const SYMBOLS = ['🌸','⭐','🦁','🌙','🔥','🌊','🦅','🌿','⚡','🎯','🏆','🎪','🌺','🦋','🐯','🌻','🍀','🦚','🌈','🎖️'];
const POSTS   = ['Class Representative (CR)','President','Vice President','Secretary','Treasurer','Cultural Secretary','Sports Secretary','Technical Head','Other'];
const YEARS   = ['1st Year','2nd Year','3rd Year','4th Year','5th Year'];

const glass = { background:'rgba(255,255,255,0.04)', backdropFilter:'blur(16px)', border:'1px solid rgba(255,255,255,0.08)' };
const inputCls = "w-full rounded-xl px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition";
const inputStyle = { background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)' };
const labelCls = "text-xs font-medium text-slate-400 mb-1.5 block";
const sectionTitle = "text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2";

const emptyCandidate = (i) => ({
  // Basic
  name:'', rollNumber:'', course:'', year:'1st Year',
  // Contact
  email:'', mobile:'',
  // Position
  appliedPost: POSTS[0], symbol: SYMBOLS[i % SYMBOLS.length], description:'',
  // Eligibility
  attendance:'', disciplineRecord:'Good', approvalStatus:'Pending',
  // Manifesto
  plans:'', goals:'', slogan:'',
  // Documents
  photo:'', collegeId:'', signature:'',
  // UI
  _expanded: i === 0,
});

// File → base64
const toBase64 = (file) => new Promise((res, rej) => {
  const reader = new FileReader();
  reader.onload  = () => res(reader.result);
  reader.onerror = rej;
  reader.readAsDataURL(file);
});

export default function ManageElections() {
  const [elections,  setElections]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [msg,        setMsg]        = useState('');
  const [creating,   setCreating]   = useState(false);
  const [form,       setForm]       = useState({ title:'', description:'', endDate:'' });
  const [candidates, setCandidates] = useState([emptyCandidate(0), emptyCandidate(1)]);

  const fetchElections = (showLoader = false) => {
    if (showLoader) setLoading(true);
    api.get('/elections').then(({ data }) => setElections(Array.isArray(data) ? data : [])).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(() => { fetchElections(true); }, []);

  const addCandidate = () => setCandidates(p => [...p, emptyCandidate(p.length)]);
  const removeCandidate = (i) => { if (candidates.length > 2) setCandidates(p => p.filter((_,idx) => idx !== i)); };
  const updateCandidate = (i, f, v) => setCandidates(p => { const u=[...p]; u[i]={...u[i],[f]:v}; return u; });
  const toggleExpand = (i) => setCandidates(p => { const u=[...p]; u[i]={...u[i],_expanded:!u[i]._expanded}; return u; });

  const handleFileUpload = async (i, field, file) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { alert('File too large. Max 2MB.'); return; }
    const b64 = await toBase64(file);
    updateCandidate(i, field, b64);
  };

  const handleCreate = async (e) => {
    e.preventDefault(); setMsg('');

    // ── Strict Validation ──
    if (!form.title.trim())       return setMsg('❌ Election title is required');
    if (!form.description.trim()) return setMsg('❌ Description is required');
    if (!form.endDate)            return setMsg('❌ End date & time is required');
    if (new Date(form.endDate) <= new Date()) return setMsg('❌ End date must be in the future');

    const valid = candidates.filter(c => c.name.trim());
    if (valid.length < 2) return setMsg('❌ At least 2 candidates with names are required');

    // Check each candidate has name filled
    const incomplete = candidates.findIndex((c, i) => i < 2 && !c.name.trim());
    if (incomplete !== -1) return setMsg(`❌ Candidate ${incomplete + 1} name is required`);

    setCreating(true);
    try {
      const payload = {
        title:       form.title.trim(),
        description: form.description.trim(),
        endDate:     form.endDate,
      };

      const { data: election } = await api.post('/elections', payload);

      await Promise.all(valid.map(c => api.post(`/elections/${election._id}/candidates`, {
        name: `${c.symbol} ${c.name}`,
        rollNumber: c.rollNumber, course: c.course, year: c.year,
        email: c.email, mobile: c.mobile,
        appliedPost: c.appliedPost, description: c.description, symbol: c.symbol,
        attendance: c.attendance, disciplineRecord: c.disciplineRecord, approvalStatus: c.approvalStatus,
        plans: c.plans, goals: c.goals, slogan: c.slogan,
        photo: c.photo, collegeId: c.collegeId, signature: c.signature,
      })));

      setForm({ title:'', description:'', endDate:'' });
      setCandidates([emptyCandidate(0), emptyCandidate(1)]);
      setMsg(`✅ "${payload.title}" created with ${valid.length} candidates!`);
      fetchElections(false);
    } catch (err) {
      setMsg(`❌ ${err.response?.data?.message || 'Something went wrong'}`);
    } finally { setCreating(false); }
  };

  const handleToggle = async (id) => { await api.patch(`/elections/${id}/toggle`); fetchElections(false); };
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this election?')) return;
    await api.delete(`/elections/${id}`); fetchElections(false);
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }}>
        <h1 className="text-2xl font-bold text-white">Manage Elections</h1>
        <p className="text-slate-500 text-sm mt-1">Create elections with full candidate profiles</p>
      </motion.div>

      {/* Create Form */}
      <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }}
        className="rounded-2xl p-6" style={glass}>
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm" style={{ background:'rgba(59,130,246,0.2)', border:'1px solid rgba(59,130,246,0.3)' }}>🗳️</div>
          <h2 className="font-semibold text-white">Create New Election</h2>
        </div>

        <form onSubmit={handleCreate} className="space-y-6">

          {/* Election Info */}
          <div className="rounded-xl p-4 space-y-4" style={{ background:'rgba(59,130,246,0.05)', border:'1px solid rgba(59,130,246,0.15)' }}>
            <p className={sectionTitle} style={{ color:'#93c5fd' }}>
              <span>🗳️</span> Election Details
              <span className="text-red-400 font-normal normal-case tracking-normal text-xs ml-2">* All fields required</span>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className={labelCls}>Election Title <span className="text-red-400">*</span></label>
                <input value={form.title} onChange={e => setForm({...form,title:e.target.value})}
                  placeholder="e.g. Student Council 2026" className={inputCls} style={inputStyle} />
              </div>
              <div>
                <label className={labelCls}>Description <span className="text-red-400">*</span></label>
                <input value={form.description} onChange={e => setForm({...form,description:e.target.value})}
                  placeholder="Brief description of election" className={inputCls} style={inputStyle} />
              </div>
              <div>
                <label className={labelCls}>End Date & Time <span className="text-red-400">*</span></label>
                <input type="datetime-local" value={form.endDate} min={new Date().toISOString().slice(0,16)}
                  onChange={e => setForm({...form,endDate:e.target.value})}
                  className={inputCls} style={{ ...inputStyle, colorScheme:'dark' }} />
                <p className="text-xs text-slate-600 mt-1">Election auto-closes at this time</p>
              </div>
            </div>
          </div>

          {/* Candidates */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className={sectionTitle} style={{ color:'#a78bfa' }}>
                <span>🙋</span> Candidates
                <span className="text-violet-400 font-normal normal-case tracking-normal">({candidates.length} added)</span>
                <span className="text-red-400 font-normal normal-case tracking-normal text-xs ml-2">* Min 2 required</span>
              </p>
              <motion.button type="button" whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
                onClick={addCandidate}
                className="text-xs px-3 py-1.5 rounded-lg font-medium text-violet-300 transition"
                style={{ background:'rgba(139,92,246,0.15)', border:'1px solid rgba(139,92,246,0.3)' }}>
                + Add Candidate
              </motion.button>
            </div>

            <div className="space-y-3">
              {candidates.map((c, i) => (
                <motion.div key={i} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.05 }}
                  className="rounded-2xl overflow-hidden" style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)' }}>

                  {/* Candidate Header */}
                  <div className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-white/[0.02] transition"
                    onClick={() => toggleExpand(i)}>
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{c.symbol}</span>
                      <div>
                        <p className="text-sm font-medium text-slate-200">{c.name || `Candidate ${i+1}`}</p>
                        <p className="text-xs text-slate-600">{c.appliedPost || 'No post selected'} {c.rollNumber ? `· ${c.rollNumber}` : ''}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {c.name && <span className="text-xs px-2 py-0.5 rounded-full text-emerald-400" style={{ background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.2)' }}>✓ Filled</span>}
                      <button type="button" onClick={e => { e.stopPropagation(); removeCandidate(i); }}
                        disabled={candidates.length <= 2}
                        className="text-red-400/50 hover:text-red-400 disabled:opacity-20 text-sm transition px-2">✕</button>
                      <motion.span animate={{ rotate: c._expanded ? 180 : 0 }} className="text-slate-500 text-xs">▼</motion.span>
                    </div>
                  </div>

                  {/* Expanded Form */}
                  <AnimatePresence>
                    {c._expanded && (
                      <motion.div initial={{ height:0, opacity:0 }} animate={{ height:'auto', opacity:1 }} exit={{ height:0, opacity:0 }}
                        transition={{ duration:0.3 }} className="overflow-hidden">
                        <div className="px-4 pb-4 space-y-4 border-t" style={{ borderColor:'rgba(255,255,255,0.06)' }}>

                          {/* Basic Details */}
                          <div className="pt-4">
                            <p className={sectionTitle} style={{ color:'#93c5fd' }}><span>👤</span> Basic Details</p>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                              <div className="sm:col-span-2">
                                <label className={labelCls}>Full Name *</label>
                                <input value={c.name} onChange={e => updateCandidate(i,'name',e.target.value)}
                                  placeholder="Candidate full name" className={inputCls} style={inputStyle} />
                              </div>
                              <div>
                                <label className={labelCls}>Roll Number</label>
                                <input value={c.rollNumber} onChange={e => updateCandidate(i,'rollNumber',e.target.value)}
                                  placeholder="2021CS001" className={inputCls} style={inputStyle} />
                              </div>
                              <div>
                                <label className={labelCls}>Symbol</label>
                                <select value={c.symbol} onChange={e => updateCandidate(i,'symbol',e.target.value)}
                                  className={inputCls} style={{ ...inputStyle, colorScheme:'dark' }}>
                                  {SYMBOLS.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                              </div>
                              <div className="sm:col-span-2">
                                <label className={labelCls}>Course / Branch</label>
                                <input value={c.course} onChange={e => updateCandidate(i,'course',e.target.value)}
                                  placeholder="e.g. B.Tech Computer Science" className={inputCls} style={inputStyle} />
                              </div>
                              <div>
                                <label className={labelCls}>Year</label>
                                <select value={c.year} onChange={e => updateCandidate(i,'year',e.target.value)}
                                  className={inputCls} style={{ ...inputStyle, colorScheme:'dark' }}>
                                  {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                              </div>
                            </div>
                          </div>

                          {/* Contact Info */}
                          <div>
                            <p className={sectionTitle} style={{ color:'#6ee7b7' }}><span>📞</span> Contact Info</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className={labelCls}>Email ID</label>
                                <input type="email" value={c.email} onChange={e => updateCandidate(i,'email',e.target.value)}
                                  placeholder="candidate@college.edu" className={inputCls} style={inputStyle} />
                              </div>
                              <div>
                                <label className={labelCls}>Mobile Number</label>
                                <input type="tel" value={c.mobile} onChange={e => updateCandidate(i,'mobile',e.target.value)}
                                  placeholder="+91 9876543210" className={inputCls} style={inputStyle} />
                              </div>
                            </div>
                          </div>

                          {/* Position Details */}
                          <div>
                            <p className={sectionTitle} style={{ color:'#fcd34d' }}><span>🏅</span> Position Details</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className={labelCls}>Applied Post *</label>
                                <select value={c.appliedPost} onChange={e => updateCandidate(i,'appliedPost',e.target.value)}
                                  className={inputCls} style={{ ...inputStyle, colorScheme:'dark', background:'rgba(255,255,255,0.06)', color:'#e2e8f0' }}>
                                  {POSTS.map(p => <option key={p} value={p} style={{ background:'#000', color:'#e2e8f0' }}>{p}</option>)}
                                </select>
                              </div>
                              <div>
                                <label className={labelCls}>Party / Extra Info</label>
                                <input value={c.description} onChange={e => updateCandidate(i,'description',e.target.value)}
                                  placeholder="Party name or tagline" className={inputCls} style={inputStyle} />
                              </div>
                            </div>
                          </div>

                          {/* Eligibility */}
                          <div>
                            <p className={sectionTitle} style={{ color:'#f9a8d4' }}><span>✅</span> Eligibility Info</p>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div>
                                <label className={labelCls}>Attendance %</label>
                                <input value={c.attendance} onChange={e => updateCandidate(i,'attendance',e.target.value)}
                                  placeholder="e.g. 85%" className={inputCls} style={inputStyle} />
                              </div>
                              <div>
                                <label className={labelCls}>Discipline Record</label>
                                <select value={c.disciplineRecord} onChange={e => updateCandidate(i,'disciplineRecord',e.target.value)}
                                  className={inputCls} style={{ ...inputStyle, colorScheme:'dark' }}>
                                  {['Good','Satisfactory','Poor'].map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                              </div>
                              <div>
                                <label className={labelCls}>Approval Status</label>
                                <select value={c.approvalStatus} onChange={e => updateCandidate(i,'approvalStatus',e.target.value)}
                                  className={inputCls} style={{ ...inputStyle, colorScheme:'dark' }}>
                                  {['Pending','Approved','Rejected'].map(s => (
                                    <option key={s} value={s}>{s}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          </div>

                          {/* Manifesto */}
                          <div>
                            <p className={sectionTitle} style={{ color:'#a5b4fc' }}><span>📋</span> Manifesto</p>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div>
                                <label className={labelCls}>Campaign Slogan</label>
                                <input value={c.slogan} onChange={e => updateCandidate(i,'slogan',e.target.value)}
                                  placeholder="e.g. Together We Rise!" className={inputCls} style={inputStyle} />
                              </div>
                              <div>
                                <label className={labelCls}>Goals</label>
                                <input value={c.goals} onChange={e => updateCandidate(i,'goals',e.target.value)}
                                  placeholder="Key goals" className={inputCls} style={inputStyle} />
                              </div>
                              <div>
                                <label className={labelCls}>Plans</label>
                                <input value={c.plans} onChange={e => updateCandidate(i,'plans',e.target.value)}
                                  placeholder="Action plans" className={inputCls} style={inputStyle} />
                              </div>
                            </div>
                          </div>

                          {/* Documents */}
                          <div>
                            <p className={sectionTitle} style={{ color:'#67e8f9' }}><span>📎</span> Documents <span className="text-slate-600 font-normal normal-case tracking-normal">(max 2MB each)</span></p>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              {/* Photo */}
                              <div>
                                <label className={labelCls}>Candidate Photo</label>
                                <div className="flex items-center gap-2">
                                  {c.photo && <img src={c.photo} alt="photo" className="w-10 h-10 rounded-lg object-cover border border-white/10" />}
                                  <label className={`${inputCls} cursor-pointer flex items-center gap-2 text-slate-500 hover:text-slate-300 transition`} style={inputStyle}>
                                    📷 {c.photo ? 'Change' : 'Upload Photo'}
                                    <input type="file" accept="image/*" className="hidden" onChange={e => handleFileUpload(i,'photo',e.target.files[0])} />
                                  </label>
                                </div>
                              </div>
                              {/* College ID */}
                              <div>
                                <label className={labelCls}>College ID Proof</label>
                                <label className={`${inputCls} cursor-pointer flex items-center gap-2 text-slate-500 hover:text-slate-300 transition`} style={inputStyle}>
                                  🪪 {c.collegeId ? '✓ Uploaded' : 'Upload ID'}
                                  <input type="file" accept="image/*,.pdf" className="hidden" onChange={e => handleFileUpload(i,'collegeId',e.target.files[0])} />
                                </label>
                              </div>
                              {/* Signature */}
                              <div>
                                <label className={labelCls}>Signature</label>
                                <label className={`${inputCls} cursor-pointer flex items-center gap-2 text-slate-500 hover:text-slate-300 transition`} style={inputStyle}>
                                  ✍️ {c.signature ? '✓ Uploaded' : 'Upload Signature'}
                                  <input type="file" accept="image/*" className="hidden" onChange={e => handleFileUpload(i,'signature',e.target.files[0])} />
                                </label>
                              </div>
                            </div>
                          </div>

                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>

            <button type="button" onClick={addCandidate}
              className="mt-3 w-full py-2.5 rounded-xl text-sm text-slate-500 hover:text-slate-300 transition"
              style={{ border:'1px dashed rgba(255,255,255,0.1)' }}>
              + Add another candidate
            </button>
          </div>

          {/* Submit */}
          <div className="flex items-center gap-4">
            <motion.button type="submit" disabled={creating}
              whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60 flex items-center gap-2"
              style={{ background:'linear-gradient(135deg, #3b82f6, #1e40af)', boxShadow:'0 4px 20px rgba(59,130,246,0.3)' }}>
              {creating
                ? <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Creating...</>
                : '🗳️ Create Election'}
            </motion.button>
            <AnimatePresence>
              {msg && (
                <motion.p initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0 }}
                  className={`text-sm font-medium ${msg.startsWith('✅') ? 'text-emerald-400' : 'text-red-400'}`}>
                  {msg}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </form>
      </motion.div>

      {/* Elections List */}
      <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}
        className="rounded-2xl overflow-hidden" style={glass}>
        <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor:'rgba(255,255,255,0.06)' }}>
          <h2 className="font-semibold text-white">All Elections</h2>
          <span className="text-xs px-2 py-1 rounded-lg text-slate-400" style={{ background:'rgba(255,255,255,0.05)' }}>
            {elections.length} total
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background:'rgba(255,255,255,0.03)' }}>
                {['Election','Candidates','Status','Timeline','Actions'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {elections.map((e, i) => {
                const isExpired = e.endDate && new Date(e.endDate) < new Date();
                const active = e.isActive && !isExpired;
                return (
                  <motion.tr key={e._id} initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:i*0.05 }}
                    className="border-t transition-colors hover:bg-white/[0.02]" style={{ borderColor:'rgba(255,255,255,0.04)' }}>
                    <td className="px-5 py-4">
                      <p className="font-medium text-slate-200">{e.title}</p>
                      {e.description && <p className="text-xs text-slate-600 mt-0.5">{e.description}</p>}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1">
                        {e.candidates.slice(0,3).map(c => (
                          <span key={c._id} className="text-xs px-2 py-0.5 rounded-full text-slate-400" style={{ background:'rgba(255,255,255,0.05)' }}>
                            {c.name?.slice(0,12)}
                          </span>
                        ))}
                        {e.candidates.length > 3 && <span className="text-xs text-slate-600">+{e.candidates.length-3}</span>}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${active ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20' : 'text-slate-500 bg-slate-500/10 border border-slate-500/20'}`}>
                        {active ? '🟢 Active' : '🔴 Closed'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <CountdownTimer endDate={e.endDate} isActive={e.isActive} onExpire={() => fetchElections(false)} />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        <motion.button whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
                          onClick={() => handleToggle(e._id)}
                          className="text-xs px-3 py-1.5 rounded-lg font-medium"
                          style={{ background:'rgba(59,130,246,0.1)', border:'1px solid rgba(59,130,246,0.2)', color:'#93c5fd' }}>
                          {e.isActive ? 'Close' : 'Open'}
                        </motion.button>
                        <motion.button whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
                          onClick={() => handleDelete(e._id)}
                          className="text-xs px-3 py-1.5 rounded-lg font-medium"
                          style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)', color:'#fca5a5' }}>
                          Delete
                        </motion.button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
          {elections.length === 0 && (
            <div className="text-center py-12 text-slate-600">
              <p className="text-3xl mb-2">🗳️</p>
              <p>No elections yet. Create one above!</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
