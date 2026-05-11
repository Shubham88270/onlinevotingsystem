import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../api/axios.jsx';
import Spinner from '../../components/Spinner.jsx';

const glass = { background:'rgba(255,255,255,0.04)', backdropFilter:'blur(16px)', border:'1px solid rgba(255,255,255,0.08)' };
const inputCls = "w-full rounded-xl px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition";
const inputStyle = { background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)' };

const emptyUser = () => ({ name:'', email:'', password:'', showPw:false, branch:'', college:'', university:'', rollNo:'', phone:'' });

// ── Password strength checker ─────────────────────────────
function getPwStrength(pw) {
  if (!pw) return { score: 0, label: '', color: '' };
  const checks = {
    upper:   /[A-Z]/.test(pw),
    lower:   /[a-z]/.test(pw),
    number:  /\d/.test(pw),
    special: /[@#$%^&*!]/.test(pw),
    length:  pw.length >= 8,
  };
  const score = Object.values(checks).filter(Boolean).length;
  const map = [
    { label: '',         color: '' },
    { label: 'Very Weak', color: '#ef4444' },
    { label: 'Weak',      color: '#f97316' },
    { label: 'Fair',      color: '#eab308' },
    { label: 'Good',      color: '#3b82f6' },
    { label: 'Strong',    color: '#10b981' },
  ];
  return { score, ...map[score], checks };
}

export default function ManageUsers() {
  const [users,      setUsers]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [rows,       setRows]       = useState([emptyUser()]);
  const [regLoading, setRegLoading] = useState(false);
  const [tab,        setTab]        = useState('all');
  const [otpModal,   setOtpModal]   = useState(null);  // { userId, email, name }
  const [otpValue,   setOtpValue]   = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpMsg,     setOtpMsg]     = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const cooldownRef = useRef(null);

  // Start 60s cooldown timer
  const startCooldown = () => {
    setResendCooldown(60);
    clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) { clearInterval(cooldownRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const fetchUsers = () => {
    setLoading(true);
    api.get('/auth/users').then(({ data }) => setUsers(Array.isArray(data) ? data : [])).catch(() => toast.error('Failed')).finally(() => setLoading(false));
  };
  useEffect(() => { fetchUsers(); }, []);

  const handleApprove = async (id, name) => {
    try { await api.patch(`/auth/users/${id}/approve`); toast.success(`✅ ${name} approved!`); fetchUsers(); }
    catch { toast.error('Failed'); }
  };
  const handleReject = async (id, name) => {
    try { await api.patch(`/auth/users/${id}/reject`); toast.success(`${name} revoked`); fetchUsers(); }
    catch { toast.error('Failed'); }
  };
  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    try { await api.delete(`/auth/users/${id}`); toast.success(`🗑️ ${name} deleted`); fetchUsers(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const addRow    = () => setRows(p => [...p, emptyUser()]);
  const removeRow = (i) => { if (rows.length > 1) setRows(p => p.filter((_,idx) => idx !== i)); };
  const updateRow = (i, f, v) => setRows(p => { const u=[...p]; u[i]={...u[i],[f]:v}; return u; });

  const handleRegisterAll = async (e) => {
    e.preventDefault();
    const strongPw = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$%^&*!]).{8,}$/;

    // Client-side validation
    for (let idx = 0; idx < rows.length; idx++) {
      const r = rows[idx];
      if (!r.name.trim() || !r.email.trim() || !r.password) continue; // skip empty rows
      if (!strongPw.test(r.password)) {
        return toast.error(`User #${idx+1}: Password must have uppercase, lowercase, number & special char (@#$%^&*!), min 8 chars`);
      }
      if (r.phone && !/^\d{10}$/.test(r.phone.trim())) {
        return toast.error(`User #${idx+1}: Phone number must be exactly 10 digits`);
      }
    }

    // Check duplicate rollNo within the form rows
    const rollNos = rows.map(r => r.rollNo.trim()).filter(Boolean);
    const uniqueRolls = new Set(rollNos);
    if (uniqueRolls.size !== rollNos.length)
      return toast.error('Duplicate Roll No found in the form. Each Roll No must be unique.');

    // Check duplicate phone within the form rows
    const phones = rows.map(r => r.phone.trim()).filter(Boolean);
    const uniquePhones = new Set(phones);
    if (uniquePhones.size !== phones.length)
      return toast.error('Duplicate Phone No found in the form. Each phone must be unique.');

    const valid = rows.filter(r => r.name.trim() && r.email.trim() && r.password.length >= 8);
    if (!valid.length) return toast.error('Fill at least one complete row');
    setRegLoading(true);
    let ok = 0;
    for (const r of valid) {
      try {
        const { data } = await api.post('/auth/admin/register-user', { name:r.name, email:r.email, password:r.password, branch:r.branch, college:r.college, university:r.university, rollNo:r.rollNo, phone:r.phone });
        ok++;
        if (data.requiresOTP) {
          setOtpModal({ userId:data.userId, email:r.email, name:r.name });
          setOtpValue(''); setOtpMsg('');
          startCooldown(); // start 1 min cooldown on first send
        }
      } catch (err) { toast.error(`${r.email}: ${err.response?.data?.message || 'Error'}`); }
    }
    if (ok) { setRows([emptyUser()]); fetchUsers(); }
    setRegLoading(false);
  };

  const handleVerifyOTP = async () => {
    if (otpValue.length !== 6) return setOtpMsg('❌ Enter 6-digit OTP');
    setOtpLoading(true);
    try {
      const { data } = await api.post('/auth/verify-otp', { userId:otpModal.userId, otp:otpValue });
      toast.success(`✅ ${otpModal.name} email verified! ID: ${data.voterId}`);
      setOtpModal(null); setOtpValue(''); fetchUsers();
    } catch (err) { setOtpMsg(err.response?.data?.message || '❌ Invalid OTP'); }
    finally { setOtpLoading(false); }
  };

  const handleResendOTP = async () => {
    if (resendCooldown > 0) return;
    try {
      await api.post('/auth/resend-otp', { userId:otpModal.userId });
      setOtpMsg('✅ OTP resent to email!');
      startCooldown();
    } catch (err) {
      const cd = err.response?.data?.cooldown;
      if (cd) { setResendCooldown(cd); startCooldown(); }
      setOtpMsg(err.response?.data?.message || 'Failed');
    }
  };

  if (loading) return <Spinner />;

  const verifiedUsers = users.filter(u => u.isVerified);
  const pending       = verifiedUsers.filter(u => !u.isAdmin && !u.isApproved);
  const filtered      = tab === 'pending' ? pending : verifiedUsers;
  const otpPending    = users.filter(u => !u.isVerified && !u.isAdmin).length;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }}>
        <h1 className="text-2xl font-bold text-white">Manage Users</h1>
        <p className="text-slate-500 text-sm mt-1">Register and manage voter accounts</p>
      </motion.div>

      {/* Register Form */}
      <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }}
        className="rounded-2xl p-6" style={glass}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm" style={{ background:'rgba(139,92,246,0.2)', border:'1px solid rgba(139,92,246,0.3)' }}>👥</div>
            <div>
              <h2 className="font-semibold text-white">Register New Users</h2>
              <p className="text-slate-500 text-xs">OTP sent to user email for verification</p>
            </div>
          </div>
          <motion.button whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }} onClick={addRow}
            className="text-sm px-4 py-2 rounded-xl font-medium text-white"
            style={{ background:'linear-gradient(135deg, #8b5cf6, #6d28d9)', boxShadow:'0 4px 15px rgba(139,92,246,0.3)' }}>
            + Add User
          </motion.button>
        </div>

        <form onSubmit={handleRegisterAll} className="space-y-3">
          {rows.map((row, i) => (
            <motion.div key={i} initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }} transition={{ delay:i*0.05 }}
              className="rounded-xl p-4 space-y-3" style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-violet-400 px-2 py-0.5 rounded-full" style={{ background:'rgba(139,92,246,0.1)', border:'1px solid rgba(139,92,246,0.2)' }}>
                  User #{i+1}
                </span>
                <button type="button" onClick={() => removeRow(i)} disabled={rows.length === 1}
                  className="text-red-400/50 hover:text-red-400 disabled:opacity-20 text-sm transition">✕ Remove</button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Full Name *</label>
                  <input value={row.name} onChange={e => updateRow(i,'name',e.target.value)} placeholder="Ali Ahmed" className={inputCls} style={inputStyle} />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Email *</label>
                  <input type="email" value={row.email} onChange={e => updateRow(i,'email',e.target.value)} placeholder="ali@example.com" className={inputCls} style={inputStyle} />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Password *</label>
                  <div className="relative">
                    <input type={row.showPw ? 'text' : 'password'} value={row.password} onChange={e => updateRow(i,'password',e.target.value)} placeholder="Min 8 chars, A-Z a-z 0-9 @#$%" className={`${inputCls} pr-8`} style={inputStyle} />
                    <button type="button" onClick={() => updateRow(i,'showPw',!row.showPw)} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 text-xs">{row.showPw ? '🙈' : '👁️'}</button>
                  </div>
                  {/* Strength bar */}
                  {row.password && (() => {
                    const s = getPwStrength(row.password);
                    return (
                      <div className="mt-1.5 space-y-1">
                        <div className="flex gap-1">
                          {[1,2,3,4,5].map(n => (
                            <div key={n} className="h-1 flex-1 rounded-full transition-all duration-300"
                              style={{ background: n <= s.score ? s.color : 'rgba(255,255,255,0.08)' }} />
                          ))}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium" style={{ color: s.color }}>{s.label}</span>
                          <div className="flex gap-2">
                            {[
                              { key:'upper',   label:'A-Z' },
                              { key:'lower',   label:'a-z' },
                              { key:'number',  label:'0-9' },
                              { key:'special', label:'@#$%' },
                              { key:'length',  label:'8+' },
                            ].map(c => (
                              <span key={c.key} className="text-xs px-1.5 py-0.5 rounded font-mono"
                                style={{
                                  background: s.checks?.[c.key] ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)',
                                  color:      s.checks?.[c.key] ? '#6ee7b7' : '#475569',
                                  border:     `1px solid ${s.checks?.[c.key] ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.06)'}`,
                                }}>
                                {s.checks?.[c.key] ? '✓' : '·'} {c.label}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Roll No</label>
                  <input value={row.rollNo} onChange={e => updateRow(i,'rollNo',e.target.value)} placeholder="2021CS001" className={inputCls} style={{
                    ...inputStyle,
                    borderColor: row.rollNo && rows.filter((r,ri) => ri !== i && r.rollNo.trim() && r.rollNo.trim() === row.rollNo.trim()).length > 0
                      ? 'rgba(239,68,68,0.6)' : 'rgba(255,255,255,0.1)',
                  }} />
                  {row.rollNo && rows.filter((r,ri) => ri !== i && r.rollNo.trim() === row.rollNo.trim()).length > 0 && (
                    <p className="text-xs text-red-400 mt-1">⚠️ Duplicate Roll No in this form</p>
                  )}
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Phone No <span className="text-slate-600">(10 digits)</span></label>
                  <input
                    type="tel"
                    value={row.phone}
                    onChange={e => updateRow(i,'phone', e.target.value.replace(/\D/g,'').slice(0,10))}
                    placeholder="9876543210"
                    maxLength={10}
                    className={inputCls}
                    style={{
                      ...inputStyle,
                      borderColor: row.phone && row.phone.length > 0 && row.phone.length !== 10
                        ? 'rgba(239,68,68,0.6)'
                        : rows.filter((r,ri) => ri !== i && r.phone.trim() && r.phone.trim() === row.phone.trim()).length > 0
                          ? 'rgba(239,68,68,0.6)' : 'rgba(255,255,255,0.1)',
                    }}
                  />
                  {row.phone.length > 0 && row.phone.length !== 10 && (
                    <p className="text-xs text-red-400 mt-1">⚠️ Must be exactly 10 digits ({row.phone.length}/10)</p>
                  )}
                  {row.phone.length === 10 && rows.filter((r,ri) => ri !== i && r.phone.trim() === row.phone.trim()).length > 0 && (
                    <p className="text-xs text-red-400 mt-1">⚠️ Duplicate phone in this form</p>
                  )}
                  {row.phone.length === 10 && (
                    <p className="text-xs text-emerald-400 mt-1">✓ Valid phone number</p>
                  )}
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Branch</label>
                  <input value={row.branch} onChange={e => updateRow(i,'branch',e.target.value)} placeholder="Computer Science" className={inputCls} style={inputStyle} />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">College</label>
                  <input value={row.college} onChange={e => updateRow(i,'college',e.target.value)} placeholder="ABC College" className={inputCls} style={inputStyle} />
                </div>
                <div className="sm:col-span-3">
                  <label className="text-xs text-slate-500 mb-1 block">University</label>
                  <input value={row.university} onChange={e => updateRow(i,'university',e.target.value)} placeholder="XYZ University" className={inputCls} style={inputStyle} />
                </div>
              </div>
            </motion.div>
          ))}

          <button type="button" onClick={addRow} className="w-full py-2.5 rounded-xl text-sm text-slate-500 hover:text-slate-300 transition" style={{ border:'1px dashed rgba(255,255,255,0.1)' }}>
            + Add another user
          </button>

          <motion.button type="submit" disabled={regLoading} whileHover={{ scale:1.01 }} whileTap={{ scale:0.98 }}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
            style={{ background:'linear-gradient(135deg, #8b5cf6, #6d28d9)', boxShadow:'0 4px 15px rgba(139,92,246,0.3)' }}>
            {regLoading ? '⏳ Registering...' : `➕ Register ${rows.length} User(s)`}
          </motion.button>
        </form>
      </motion.div>

      {/* Users Table */}
      <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}
        className="rounded-2xl overflow-hidden" style={glass}>
        <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor:'rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-3">
            <h2 className="font-semibold text-white">All Users</h2>
            {otpPending > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full text-blue-300" style={{ background:'rgba(59,130,246,0.1)', border:'1px solid rgba(59,130,246,0.2)' }}>
                ⏳ {otpPending} awaiting OTP
              </span>
            )}
          </div>
          <div className="flex gap-2">
            {['all','pending'].map(t => (
              <motion.button key={t} whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
                onClick={() => setTab(t)}
                className="text-xs px-3 py-1.5 rounded-lg font-medium transition"
                style={tab === t
                  ? { background:'rgba(59,130,246,0.2)', border:'1px solid rgba(59,130,246,0.4)', color:'#93c5fd' }
                  : { background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', color:'#64748b' }}>
                {t === 'all' ? `All (${verifiedUsers.length})` : `Pending (${pending.length})`}
              </motion.button>
            ))}
          </div>
        </div>

        {pending.length > 0 && tab === 'all' && (
          <div className="mx-5 mt-3 px-4 py-2.5 rounded-xl text-sm text-amber-300 flex items-center gap-2" style={{ background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.2)' }}>
            🔔 <strong>{pending.length}</strong> voter(s) pending approval
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background:'rgba(255,255,255,0.03)' }}>
                {['Voter','Voter ID','Branch / College','Status','Votes','Actions'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, i) => (
                <motion.tr key={u._id} initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:i*0.04 }}
                  className="border-t transition-colors hover:bg-white/[0.02]" style={{ borderColor:'rgba(255,255,255,0.04)' }}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-violet-500/20 border border-white/10 flex items-center justify-center text-sm font-bold text-blue-300">
                        {u.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-slate-200">{u.name}</p>
                        <p className="text-xs text-slate-600">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="font-mono text-xs text-slate-400 px-2 py-1 rounded-lg" style={{ background:'rgba(255,255,255,0.05)' }}>{u.voterId || '—'}</span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="text-xs text-slate-500 space-y-0.5">
                      {u.branch     && <p className="text-slate-400">🎓 {u.branch}</p>}
                      {u.college    && <p>🏫 {u.college}</p>}
                      {u.university && <p>🏛️ {u.university}</p>}
                      {u.rollNo     && <p>🔢 {u.rollNo}</p>}
                      {u.phone      && <p>📱 {u.phone} {u.phoneVerified ? <span className="text-emerald-400">✓</span> : <span className="text-amber-400">⏳</span>}</p>}
                      {!u.branch && !u.college && !u.university && !u.rollNo && !u.phone && <p className="text-slate-700">—</p>}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium w-fit" style={u.isAdmin ? { background:'rgba(99,102,241,0.1)', border:'1px solid rgba(99,102,241,0.2)', color:'#a5b4fc' } : { background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', color:'#64748b' }}>
                        {u.isAdmin ? '👑 Admin' : '👤 User'}
                      </span>
                      {!u.isAdmin && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium w-fit" style={u.isApproved ? { background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.2)', color:'#6ee7b7' } : { background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.2)', color:'#fcd34d' }}>
                          {u.isApproved ? '✅ Approved' : '⏳ Pending'}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-slate-400">{u.votedElections?.length || 0}</td>
                  <td className="px-5 py-4">
                    {!u.isAdmin && (
                      <div className="flex gap-1.5 flex-wrap">
                        {!u.isApproved ? (
                          <motion.button whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
                            onClick={() => handleApprove(u._id, u.name)}
                            className="text-xs px-2.5 py-1 rounded-lg font-medium transition"
                            style={{ background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.2)', color:'#6ee7b7' }}>
                            ✅ Approve
                          </motion.button>
                        ) : (
                          <motion.button whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
                            onClick={() => handleReject(u._id, u.name)}
                            className="text-xs px-2.5 py-1 rounded-lg font-medium transition"
                            style={{ background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.2)', color:'#fcd34d' }}>
                            ⏸ Revoke
                          </motion.button>
                        )}
                        <motion.button whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
                          onClick={() => handleDelete(u._id, u.name)}
                          className="text-xs px-2.5 py-1 rounded-lg font-medium transition"
                          style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)', color:'#fca5a5' }}>
                          🗑️ Delete
                        </motion.button>
                      </div>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-slate-600">
              <p className="text-3xl mb-2">👥</p>
              <p>No users found.</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* OTP Modal */}
      <AnimatePresence>
        {otpModal && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4 backdrop-blur-sm">
            <motion.div initial={{ scale:0.9, y:20 }} animate={{ scale:1, y:0 }} exit={{ scale:0.9, y:20 }}
              className="rounded-2xl p-8 max-w-sm w-full text-center" style={{ background:'rgba(15,23,42,0.95)', border:'1px solid rgba(99,102,241,0.3)', boxShadow:'0 25px 60px rgba(0,0,0,0.5)' }}>

              {/* Step indicator removed — phone OTP disabled */}

              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4"
                style={{ background:'rgba(59,130,246,0.1)', border:'1px solid rgba(59,130,246,0.2)' }}>
                📧
              </div>

              <h3 className="text-xl font-bold text-white mb-1">
                Email Verification
              </h3>
              <p className="text-slate-500 text-sm mb-1">Email OTP sent to:</p>
              <p className="font-semibold mb-3" style={{ color:'#60a5fa' }}>
                {otpModal.email}
              </p>
              <p className="text-slate-600 text-xs mb-5">
                Ask <strong className="text-slate-400">{otpModal.name}</strong> to check their email and share the OTP.
              </p>

              <input type="text" maxLength={6} value={otpValue}
                onChange={e => { setOtpValue(e.target.value.replace(/\D/g,'')); setOtpMsg(''); }}
                placeholder="_ _ _ _ _ _"
                className="w-full rounded-xl px-4 py-3 text-center text-2xl font-bold tracking-widest text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 mb-3"
                style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(99,102,241,0.3)', letterSpacing:'0.5em' }} />

              {otpMsg && (
                <p className={`text-sm mb-3 ${otpMsg.startsWith('✅') || otpMsg.startsWith('📱') ? 'text-emerald-400' : 'text-red-400'}`}>
                  {otpMsg}
                </p>
              )}

              <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }}
                onClick={handleVerifyOTP}
                disabled={otpLoading || otpValue.length !== 6}
                className="w-full py-2.5 rounded-xl font-semibold text-white disabled:opacity-50 mb-2"
                style={{ background:'linear-gradient(135deg, #3b82f6, #1e40af)', boxShadow:'0 4px 20px rgba(59,130,246,0.3)' }}>
                {otpLoading ? '⏳ Verifying...' : '✅ Verify Email OTP'}
              </motion.button>

              <div className="flex gap-2">
                <button
                  onClick={handleResendOTP}
                  disabled={resendCooldown > 0}
                  className="flex-1 text-sm py-2 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ border:`1px solid rgba(59,130,246,0.2)`, color: resendCooldown > 0 ? '#475569' : '#60a5fa' }}>
                  {resendCooldown > 0 ? `🔄 Resend in ${resendCooldown}s` : '🔄 Resend'}
                </button>
                <button onClick={() => { setOtpModal(null); setOtpValue(''); setResendCooldown(0); clearInterval(cooldownRef.current); }} className="flex-1 text-sm py-2 rounded-xl text-slate-500 hover:text-slate-300 transition" style={{ border:'1px solid rgba(255,255,255,0.08)' }}>Cancel</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
