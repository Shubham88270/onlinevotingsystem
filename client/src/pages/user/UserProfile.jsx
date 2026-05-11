import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext.jsx';
import Avatar from '../../components/Avatar.jsx';
import api from '../../api/axios.jsx';

const glass = { background:'rgba(255,255,255,0.04)', backdropFilter:'blur(16px)', border:'1px solid rgba(255,255,255,0.08)' };
const inputCls = "w-full rounded-xl px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition input-3d";
const inputStyle = { background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)' };

// File → base64
const toBase64 = (file) => new Promise((res, rej) => {
  const r = new FileReader();
  r.onload = () => res(r.result);
  r.onerror = rej;
  r.readAsDataURL(file);
});

export default function UserProfile() {
  const { user, refreshUser } = useAuth();
  const photoRef = useRef(null);

  const [form, setForm] = useState({
    name: user?.name || '', branch: user?.branch || '',
    college: user?.college || '', university: user?.university || '', rollNo: user?.rollNo || '',
  });
  const [photo,     setPhoto]     = useState(user?.photo || '');
  const [saving,    setSaving]    = useState(false);
  const [photoSaving, setPhotoSaving] = useState(false);
  const [pwMode,    setPwMode]    = useState(null);
  const [pwForm,    setPwForm]    = useState({ oldPw:'', newPw:'', confirm:'', show:false });
  const [pwLoading, setPwLoading] = useState(false);
  const [otpStep,   setOtpStep]   = useState(1);
  const [otpEmail,  setOtpEmail]  = useState(user?.email || '');
  const [otpUserId, setOtpUserId] = useState('');
  const [otpValue,  setOtpValue]  = useState('');
  const [otpNewPw,  setOtpNewPw]  = useState('');
  const [otpLoading,setOtpLoading]= useState(false);
  // Timers
  const [otpExpiry,   setOtpExpiry]   = useState(0);  // seconds until OTP expires
  const [resendCooldown, setResendCooldown] = useState(0); // seconds until resend allowed

  // Countdown tick
  useEffect(() => {
    if (otpExpiry <= 0 && resendCooldown <= 0) return;
    const t = setInterval(() => {
      setOtpExpiry(s => Math.max(0, s - 1));
      setResendCooldown(s => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(t);
  }, [otpExpiry, resendCooldown]);

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2) : 'U';

  // ── Photo upload ──
  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return toast.error('Max 2MB');
    setPhotoSaving(true);
    try {
      const b64 = await toBase64(file);
      setPhoto(b64);
      await api.patch('/auth/profile', { photo: b64 });
      await refreshUser();
      toast.success('✅ Profile photo updated!');
    } catch { toast.error('Failed to upload photo'); }
    finally { setPhotoSaving(false); }
  };

  // ── Save profile ──
  const handleProfileSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Name required');
    setSaving(true);
    try {
      await api.patch('/auth/profile', { name:form.name, branch:form.branch, college:form.college, university:form.university, rollNo:form.rollNo });
      await refreshUser();
      toast.success('✅ Profile updated!');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  // ── Change password with old ──
  const handleChangeWithOld = async (e) => {
    e.preventDefault();
    if (!pwForm.oldPw) return toast.error('Enter old password');
    if (pwForm.newPw.length < 6) return toast.error('Min 6 characters');
    if (pwForm.newPw !== pwForm.confirm) return toast.error('Passwords do not match');
    setPwLoading(true);
    try {
      const { data } = await api.post('/auth/change-password', { oldPassword:pwForm.oldPw, newPassword:pwForm.newPw });
      toast.success(data.message);
      setPwMode(null); setPwForm({ oldPw:'', newPw:'', confirm:'', show:false });
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setPwLoading(false); }
  };

  // ── OTP reset ──
  const handleSendOTP = async () => {
    if (!otpEmail) return toast.error('Enter email');
    setOtpLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email:otpEmail });
      setOtpUserId(data.userId);
      setOtpStep(2);
      setOtpExpiry(10 * 60);    // 10 min countdown
      setResendCooldown(60);    // 1 min resend cooldown
      toast.success(`OTP sent to ${otpEmail}`);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed';
      const cd  = err.response?.data?.cooldown;
      if (cd) setResendCooldown(cd);
      toast.error(msg);
    }
    finally { setOtpLoading(false); }
  };

  const handleResendOTP = async () => {
    if (resendCooldown > 0) return;
    setOtpLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: otpEmail });
      setOtpExpiry(10 * 60);
      setResendCooldown(60);
      toast.success('OTP resent!');
    } catch (err) {
      const cd = err.response?.data?.cooldown;
      if (cd) setResendCooldown(cd);
      toast.error(err.response?.data?.message || 'Failed');
    }
    finally { setOtpLoading(false); }
  };

  const handleResetWithOTP = async () => {
    if (otpValue.length !== 6) return toast.error('Enter 6-digit OTP');
    if (otpNewPw.length < 6) return toast.error('Min 6 characters');
    setOtpLoading(true);
    try {
      const { data } = await api.post('/auth/reset-password', { userId:otpUserId, otp:otpValue, newPassword:otpNewPw });
      toast.success(data.message); setPwMode(null); setOtpStep(1); setOtpValue(''); setOtpNewPw('');
    } catch (err) { toast.error(err.response?.data?.message || 'Invalid OTP'); }
    finally { setOtpLoading(false); }
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }}>
        <h1 className="text-2xl font-bold text-white">My Profile</h1>
        <p className="text-slate-500 text-sm mt-1">Manage your voter profile</p>
      </motion.div>

      {/* ── Voter Card ── */}
      <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }}
        className="relative overflow-hidden rounded-2xl p-6"
        style={{ background:'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(139,92,246,0.15))', border:'1px solid rgba(99,102,241,0.3)' }}>
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-10 animate-pulse-glow"
          style={{ background:'radial-gradient(circle, #6366f1, transparent)', transform:'translate(30%,-30%)' }} />

        <div className="relative z-10 flex items-center gap-5">
          {/* Profile Photo */}
          <div className="relative flex-shrink-0">
            <motion.div whileHover={{ scale:1.05 }}
              className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-indigo-500/40 shadow-lg shadow-indigo-500/20 cursor-pointer relative"
              onClick={() => photoRef.current?.click()}>
              {photo ? (
                <img src={photo} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-2xl font-bold text-white">
                  {initials}
                </div>
              )}
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-white text-xs font-medium">📷 Change</span>
              </div>
            </motion.div>

            {/* Upload indicator */}
            {photoSaving && (
              <div className="absolute inset-0 rounded-2xl bg-black/60 flex items-center justify-center">
                <svg className="animate-spin w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
              </div>
            )}

            {/* Camera badge */}
            <motion.button whileHover={{ scale:1.1 }} whileTap={{ scale:0.9 }}
              onClick={() => photoRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center text-sm shadow-lg"
              style={{ background:'linear-gradient(135deg,#6366f1,#4f46e5)', border:'2px solid rgba(15,23,42,1)' }}>
              📷
            </motion.button>

            <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
          </div>

          <div>
            <h2 className="text-xl font-bold text-white">{user?.name}</h2>
            <p className="text-indigo-300 text-sm">{user?.email}</p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="text-xs font-mono px-2.5 py-1 rounded-full"
                style={{ background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.15)', color:'#c7d2fe' }}>
                🪪 {user?.voterId}
              </span>
              <span className="text-xs px-2.5 py-1 rounded-full font-medium"
                style={user?.isApproved
                  ? { background:'rgba(16,185,129,0.2)', border:'1px solid rgba(16,185,129,0.3)', color:'#6ee7b7' }
                  : { background:'rgba(245,158,11,0.2)', border:'1px solid rgba(245,158,11,0.3)', color:'#fcd34d' }}>
                {user?.isApproved ? '✅ Verified' : '⏳ Pending'}
              </span>
            </div>
            <p className="text-slate-500 text-xs mt-2">Click photo to change profile picture</p>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.15 }}
        className="grid grid-cols-2 gap-4">
        {[
          { label:'Elections Voted', value: user?.votedElections?.length || 0, icon:'🗳️', color:'#6366f1' },
          { label:'Account Status',  value: user?.isApproved ? 'Active' : 'Pending', icon: user?.isApproved ? '✅' : '⏳', color: user?.isApproved ? '#10b981' : '#f59e0b' },
        ].map((s, i) => (
          <motion.div key={s.label} whileHover={{ y:-2 }}
            className="rounded-xl p-4 text-center" style={glass}>
            <p className="text-2xl mb-1">{s.icon}</p>
            <p className="text-lg font-bold text-white">{s.value}</p>
            <p className="text-xs text-slate-500">{s.label}</p>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Edit Profile */}
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}
          className="rounded-2xl overflow-hidden" style={glass}>
          <div className="px-5 py-4 border-b flex items-center gap-2" style={{ borderColor:'rgba(255,255,255,0.06)' }}>
            <span>✏️</span><h2 className="font-semibold text-white">Edit Profile</h2>
          </div>
          <div className="p-5">
            <form onSubmit={handleProfileSave} className="space-y-3">
              {[
                { label:'Full Name', key:'name', placeholder:'Your name' },
                { label:'Roll No',   key:'rollNo', placeholder:'2021CS001' },
                { label:'Branch',    key:'branch', placeholder:'Computer Science' },
                { label:'College',   key:'college', placeholder:'ABC College' },
                { label:'University',key:'university', placeholder:'XYZ University' },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-xs text-slate-500 mb-1 block">{f.label}</label>
                  <input value={form[f.key]} onChange={e => setForm({...form,[f.key]:e.target.value})}
                    placeholder={f.placeholder} className={inputCls} style={inputStyle} />
                </div>
              ))}
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Email (cannot change)</label>
                <input value={user?.email} disabled
                  className="w-full rounded-xl px-3 py-2 text-sm text-slate-600 cursor-not-allowed"
                  style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.05)' }} />
              </div>
              <motion.button type="submit" disabled={saving}
                whileHover={{ scale:1.01 }} whileTap={{ scale:0.98 }}
                className="w-full py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60 btn-3d"
                style={{ background:'linear-gradient(135deg,#6366f1,#4f46e5)', boxShadow:'0 4px 15px rgba(99,102,241,0.3)' }}>
                {saving ? '⏳ Saving...' : 'Save Changes'}
              </motion.button>
            </form>
          </div>
        </motion.div>

        {/* Change Password */}
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.25 }}
          className="rounded-2xl overflow-hidden" style={glass}>
          <div className="px-5 py-4 border-b flex items-center gap-2" style={{ borderColor:'rgba(255,255,255,0.06)' }}>
            <span>🔒</span><h2 className="font-semibold text-white">Change Password</h2>
          </div>
          <div className="p-5">
            {!pwMode && (
              <div className="space-y-3">
                <p className="text-sm text-slate-500">How do you want to change your password?</p>
                {[
                  { mode:'old', icon:'🔑', title:'I know my old password', desc:'Enter old then set new' },
                  { mode:'otp', icon:'📧', title:'I forgot my password',   desc:'Get OTP on email to reset' },
                ].map(opt => (
                  <motion.button key={opt.mode} whileHover={{ scale:1.01, x:2 }} whileTap={{ scale:0.98 }}
                    onClick={() => setPwMode(opt.mode)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition"
                    style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)' }}>
                    <span className="text-2xl">{opt.icon}</span>
                    <div>
                      <p className="text-sm font-medium text-slate-200">{opt.title}</p>
                      <p className="text-xs text-slate-500">{opt.desc}</p>
                    </div>
                    <span className="ml-auto text-slate-600">→</span>
                  </motion.button>
                ))}
              </div>
            )}

            {/* Old password method */}
            <AnimatePresence>
              {pwMode === 'old' && (
                <motion.form initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
                  onSubmit={handleChangeWithOld} className="space-y-3">
                  {[
                    { label:'Old Password', key:'oldPw', placeholder:'Current password' },
                    { label:'New Password', key:'newPw', placeholder:'Min 6 characters' },
                    { label:'Confirm',      key:'confirm', placeholder:'Repeat new password' },
                  ].map(f => (
                    <div key={f.key} className="relative">
                      <label className="text-xs text-slate-500 mb-1 block">{f.label}</label>
                      <input type={pwForm.show ? 'text' : 'password'} value={pwForm[f.key]}
                        onChange={e => setPwForm({...pwForm,[f.key]:e.target.value})}
                        placeholder={f.placeholder} className={`${inputCls} pr-8`} style={inputStyle} />
                      {f.key === 'oldPw' && (
                        <button type="button" onClick={() => setPwForm({...pwForm,show:!pwForm.show})}
                          className="absolute right-2 bottom-2 text-slate-500 text-xs">{pwForm.show?'🙈':'👁️'}</button>
                      )}
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <motion.button type="submit" disabled={pwLoading} whileHover={{ scale:1.01 }} whileTap={{ scale:0.97 }}
                      className="flex-1 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
                      style={{ background:'linear-gradient(135deg,#6366f1,#4f46e5)' }}>
                      {pwLoading ? '⏳...' : '✅ Change'}
                    </motion.button>
                    <button type="button" onClick={() => setPwMode(null)}
                      className="px-3 py-2 rounded-xl text-sm text-slate-500 transition"
                      style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)' }}>
                      Cancel
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            {/* OTP method */}
            <AnimatePresence>
              {pwMode === 'otp' && (
                <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
                  className="space-y-3">
                  {otpStep === 1 ? (
                    <>
                      <p className="text-sm text-slate-500">OTP will be sent to your email. Valid for <strong>10 minutes</strong>.</p>
                      <div>
                        <label className="text-xs text-slate-500 mb-1 block">Email</label>
                        <input type="email" value={otpEmail} onChange={e => setOtpEmail(e.target.value)}
                          className={inputCls} style={inputStyle} />
                      </div>
                      <div className="flex gap-2">
                        <motion.button whileHover={{ scale:1.01 }} whileTap={{ scale:0.97 }}
                          onClick={handleSendOTP} disabled={otpLoading}
                          className="flex-1 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
                          style={{ background:'linear-gradient(135deg,#f59e0b,#d97706)' }}>
                          {otpLoading ? '⏳ Sending...' : '📧 Send OTP'}
                        </motion.button>
                        <button onClick={() => setPwMode(null)}
                          className="px-3 py-2 rounded-xl text-sm text-slate-500"
                          style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)' }}>
                          Cancel
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* OTP expiry countdown */}
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-emerald-400">✅ OTP sent to {otpEmail}</p>
                        {otpExpiry > 0 ? (
                          <span className="text-xs font-mono px-2 py-1 rounded-lg"
                            style={{
                              background: otpExpiry < 60 ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.1)',
                              color:      otpExpiry < 60 ? '#f87171' : '#6ee7b7',
                              border:     `1px solid ${otpExpiry < 60 ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.2)'}`,
                            }}>
                            ⏱ {Math.floor(otpExpiry / 60)}:{String(otpExpiry % 60).padStart(2,'0')}
                          </span>
                        ) : (
                          <span className="text-xs text-red-400 font-medium">⚠️ OTP expired</span>
                        )}
                      </div>

                      <div>
                        <label className="text-xs text-slate-500 mb-1 block">6-digit OTP</label>
                        <input type="text" maxLength={6} value={otpValue}
                          onChange={e => setOtpValue(e.target.value.replace(/\D/g,''))}
                          placeholder="_ _ _ _ _ _"
                          className={`${inputCls} text-center tracking-widest text-lg font-bold`} style={inputStyle} />
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 mb-1 block">New Password</label>
                        <input type="password" value={otpNewPw} onChange={e => setOtpNewPw(e.target.value)}
                          placeholder="Min 6 characters" className={inputCls} style={inputStyle} />
                      </div>

                      {/* Resend cooldown */}
                      <div className="flex items-center justify-between">
                        <button
                          onClick={handleResendOTP}
                          disabled={resendCooldown > 0 || otpLoading}
                          className="text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{ color: resendCooldown > 0 ? '#475569' : '#f59e0b', background:'none', border:'none', cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer' }}>
                          {resendCooldown > 0
                            ? `🔄 Resend in ${resendCooldown}s`
                            : '🔄 Resend OTP'}
                        </button>
                        <button onClick={() => { setOtpStep(1); setOtpValue(''); setOtpNewPw(''); setOtpExpiry(0); setResendCooldown(0); }}
                          className="text-xs text-slate-500"
                          style={{ background:'none', border:'none', cursor:'pointer' }}>
                          ← Change email
                        </button>
                      </div>

                      <div className="flex gap-2">
                        <motion.button whileHover={{ scale:1.01 }} whileTap={{ scale:0.97 }}
                          onClick={handleResetWithOTP} disabled={otpLoading || otpExpiry === 0}
                          className="flex-1 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
                          style={{ background:'linear-gradient(135deg,#6366f1,#4f46e5)' }}>
                          {otpLoading ? '⏳...' : '✅ Reset Password'}
                        </motion.button>
                        <button onClick={() => { setOtpStep(1); setOtpValue(''); setOtpNewPw(''); }}
                          className="px-3 py-2 rounded-xl text-sm text-slate-500"
                          style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)' }}>
                          Back
                        </button>
                      </div>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
