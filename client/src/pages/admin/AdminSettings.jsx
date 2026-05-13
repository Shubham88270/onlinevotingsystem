import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';
import api from '../../api/axios.jsx';
import toast from 'react-hot-toast';
import Avatar from '../../components/Avatar.jsx';

const glass = { background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.08)' };
const inputCls = "w-full rounded-xl px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition";
const inputStyle = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' };
const sectionHeaderStyle = { borderBottom: '1px solid rgba(255,255,255,0.06)' };

// Toggle Switch component
function Toggle({ value, onChange, color = '#3b82f6' }) {
  return (
    <motion.button whileTap={{ scale: 0.95 }}
      onClick={() => onChange(!value)}
      className="relative w-12 h-6 rounded-full transition-colors flex-shrink-0"
      style={{ background: value ? color : 'rgba(255,255,255,0.15)' }}>
      <motion.span
        animate={{ x: value ? 24 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md"
        style={{ left: 0 }}
      />
    </motion.button>
  );
}

// Accordion Section component
function AccordionSection({ icon, title, subtitle, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl overflow-hidden relative"
      style={{
        background: 'rgba(255,255,255,0.03)',
        backdropFilter: 'blur(20px)',
        border: open ? '1px solid rgba(99,102,241,0.3)' : '1px solid rgba(255,255,255,0.07)',
        boxShadow: open ? '0 0 30px rgba(99,102,241,0.08)' : 'none',
        transition: 'border 0.3s ease, box-shadow 0.3s ease',
      }}>

      {/* Glow top line when open */}
      {open && (
        <div style={{
          position: 'absolute', top: 0, left: '10%', right: '10%', height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.6), transparent)',
          pointerEvents: 'none',
        }} />
      )}

      {/* Header */}
      <motion.button
        onClick={() => setOpen(p => !p)}
        whileHover={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
        className="w-full px-5 py-4 flex items-center justify-between gap-4 text-left transition-colors rounded-2xl"
        style={{ cursor: 'pointer' }}>
        <div className="flex items-center gap-3">
          {/* Icon box */}
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
            style={{
              background: open ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.06)',
              border: open ? '1px solid rgba(99,102,241,0.4)' : '1px solid rgba(255,255,255,0.08)',
              transition: 'all 0.3s ease',
            }}>
            {icon}
          </div>
          <div>
            <p className="text-sm font-semibold text-white leading-tight">{title}</p>
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
        </div>

        {/* Arrow */}
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{
            background: open ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.05)',
            border: open ? '1px solid rgba(99,102,241,0.3)' : '1px solid rgba(255,255,255,0.08)',
            color: open ? '#a5b4fc' : '#475569',
            transition: 'background 0.3s, border 0.3s, color 0.3s',
          }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </motion.div>
      </motion.button>

      {/* Content */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            style={{ overflow: 'hidden' }}>
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <motion.div
                initial={{ y: -8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -8, opacity: 0 }}
                transition={{ duration: 0.25, delay: 0.05 }}
                className="p-5">
                {children}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Setting Row component
function SettingRow({ icon, title, desc, children }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3"
      style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <span className="text-lg flex-shrink-0">{icon}</span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-200">{title}</p>
          {desc && <p className="text-xs text-slate-500 mt-0.5">{desc}</p>}
        </div>
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

// File → base64
const toBase64 = (file) => new Promise((res, rej) => {
  const r = new FileReader();
  r.onload = () => res(r.result);
  r.onerror = rej;
  r.readAsDataURL(file);
});

export default function AdminSettings() {
  const { user, refreshUser } = useAuth();
  const {
    theme, setTheme, themes,
    fontSize, setFontSize, fontSizes,
    fontFamily, setFontFamily, fontFamilies,
    darkMode, setDarkMode,
  } = useTheme();

  const photoRef = useRef(null);
  const [photoSaving, setPhotoSaving] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: user?.name || '', email: user?.email || '' });
  const [saving, setSaving] = useState(false);
  const [pwForm, setPwForm] = useState({ oldPw: '', newPw: '', confirm: '', show: false });
  const [pwLoading, setPwLoading] = useState(false);

  // ── Election & Security settings (localStorage persisted) ──
  const [electionSettings, setElectionSettings] = useState(() => {
    try { return JSON.parse(localStorage.getItem('electionSettings')) || {
      otpRequired:       true,
      hideResultsLive:   true,
      autoCloseElection: true,
      allowRevote:       false,
      showCandidatePhoto: true,
    }; } catch { return {
      otpRequired: true, hideResultsLive: true,
      autoCloseElection: true, allowRevote: false, showCandidatePhoto: true,
    }; }
  });

  const updateElectionSetting = (key, val) => {
    const updated = { ...electionSettings, [key]: val };
    setElectionSettings(updated);
    localStorage.setItem('electionSettings', JSON.stringify(updated));
    toast.success('Setting saved!');
  };

  // ── Photo upload ──
  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return toast.error('Max photo size is 2MB');
    setPhotoSaving(true);
    try {
      const b64 = await toBase64(file);
      await api.patch('/auth/profile', { photo: b64 });
      await refreshUser();
      toast.success('✅ Profile photo updated!');
    } catch { toast.error('Failed to upload photo'); }
    finally { setPhotoSaving(false); }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    if (!profileForm.name.trim()) return toast.error('Name required');
    setSaving(true);
    try {
      await api.patch('/auth/profile', { name: profileForm.name });
      await refreshUser();
      toast.success('✅ Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally { setSaving(false); }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    if (!pwForm.oldPw) return toast.error('Enter current password');
    if (pwForm.newPw.length < 6) return toast.error('Min 6 characters');
    if (pwForm.newPw !== pwForm.confirm) return toast.error('Passwords do not match');
    setPwLoading(true);
    try {
      const { data } = await api.post('/auth/change-password', { oldPassword: pwForm.oldPw, newPassword: pwForm.newPw });
      toast.success(data.message);
      setPwForm({ oldPw: '', newPw: '', confirm: '', show: false });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally { setPwLoading(false); }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }} className="space-y-6">

      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-slate-400 text-sm mt-1">Manage your preferences and account</p>
      </div>

      {/* ── APPEARANCE ─────────────────────────────── */}
      <div style={glass} className="rounded-2xl overflow-hidden">
        <div className="px-6 py-4 flex items-center gap-2" style={sectionHeaderStyle}>
          <span className="text-lg">🎨</span>
          <h2 className="font-semibold text-white">Appearance</h2>
        </div>
        <div className="p-6 space-y-6">
          {/* Color Theme */}
          <div>
            <label className="text-sm font-medium text-slate-300 mb-3 block">Color Theme</label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {Object.entries(themes).map(([key, t]) => (
                <button key={key} onClick={() => setTheme(key)}
                  className="relative flex flex-col items-center gap-2 p-3 rounded-xl transition-all"
                  style={theme === key
                    ? { border: `2px solid ${t.primary}`, background: `${t.primary}15` }
                    : { border: '2px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }}>
                  <div className="flex gap-1">
                    <div className="w-4 h-4 rounded-full" style={{ background: t.primary }} />
                    <div className="w-4 h-4 rounded-full" style={{ background: t.secondary }} />
                    <div className="w-4 h-4 rounded-full" style={{ background: t.accent }} />
                  </div>
                  <span className="text-xs font-medium text-slate-400">{t.name}</span>
                  {theme === key && <span className="absolute top-1.5 right-1.5 text-xs" style={{ color: t.primary }}>✓</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Font Size */}
          <div>
            <label className="text-sm font-medium text-slate-300 mb-3 block">Font Size</label>
            <div className="flex gap-3 flex-wrap">
              {Object.entries(fontSizes).map(([key, f]) => (
                <button key={key} onClick={() => setFontSize(key)}
                  className="px-4 py-2 rounded-xl transition-all font-medium"
                  style={fontSize === key
                    ? { border: '2px solid #3b82f6', background: 'rgba(59,130,246,0.1)', color: '#93c5fd', fontSize: f.base }
                    : { border: '2px solid rgba(255,255,255,0.08)', color: '#94a3b8', background: 'rgba(255,255,255,0.03)', fontSize: f.base }}>
                  {f.name} <span className="text-xs text-slate-500 ml-1">({f.base})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Font Family */}
          <div>
            <label className="text-sm font-medium text-slate-300 mb-3 block">Font Family</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Object.entries(fontFamilies).map(([key, f]) => (
                <button key={key} onClick={() => setFontFamily(key)}
                  className="px-4 py-3 rounded-xl transition-all text-left"
                  style={fontFamily === key
                    ? { border: '2px solid #3b82f6', background: 'rgba(59,130,246,0.1)' }
                    : { border: '2px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }}>
                  <p className="text-sm font-semibold text-slate-200" style={{ fontFamily: f.value }}>{f.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5" style={{ fontFamily: f.value }}>Aa Bb Cc</p>
                  {fontFamily === key && <span className="text-blue-400 text-xs">✓ Active</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Dark Mode */}
          <SettingRow icon="🌙" title="Dark Mode" desc="Toggle dark/light interface">
            <Toggle value={darkMode} onChange={setDarkMode} />
          </SettingRow>

          <button onClick={() => { setTheme('indigo'); setFontSize('md'); setFontFamily('inter'); setDarkMode(true); }}
            className="text-sm text-slate-500 hover:text-slate-300 transition underline">
            Reset to defaults
          </button>
        </div>
      </div>

      {/* ── ELECTION SETTINGS ──────────────────────── */}
      <div style={glass} className="rounded-2xl overflow-hidden">
        <div className="px-6 py-4 flex items-center gap-2" style={sectionHeaderStyle}>
          <span className="text-lg">🗳️</span>
          <h2 className="font-semibold text-white">Election Settings</h2>
          <span className="text-xs px-2 py-0.5 rounded-full ml-auto"
            style={{ background:'rgba(16,185,129,0.1)', color:'#6ee7b7', border:'1px solid rgba(16,185,129,0.2)' }}>
            Auto-saved
          </span>
        </div>
        <div className="px-6 py-2">
          <SettingRow icon="🔐" title="OTP Verification Required"
            desc="Users must verify OTP before account is activated">
            <Toggle value={electionSettings.otpRequired}
              onChange={v => updateElectionSetting('otpRequired', v)} color="#10b981" />
          </SettingRow>
          <SettingRow icon="🔒" title="Hide Results During Voting"
            desc="Winner is revealed only after election closes">
            <Toggle value={electionSettings.hideResultsLive}
              onChange={v => updateElectionSetting('hideResultsLive', v)} color="#6366f1" />
          </SettingRow>
          <SettingRow icon="⏰" title="Auto-Close Election"
            desc="Election closes automatically when end date is reached">
            <Toggle value={electionSettings.autoCloseElection}
              onChange={v => updateElectionSetting('autoCloseElection', v)} color="#3b82f6" />
          </SettingRow>
          <SettingRow icon="🔄" title="Allow Re-vote"
            desc="Users can change their vote before election closes">
            <Toggle value={electionSettings.allowRevote}
              onChange={v => updateElectionSetting('allowRevote', v)} color="#f59e0b" />
          </SettingRow>
          <SettingRow icon="📷" title="Show Candidate Photos"
            desc="Display candidate profile photos on voting page">
            <Toggle value={electionSettings.showCandidatePhoto}
              onChange={v => updateElectionSetting('showCandidatePhoto', v)} color="#8b5cf6" />
          </SettingRow>
        </div>
      </div>

      {/* ── SYSTEM INFO ────────────────────────────── */}
      <div style={glass} className="rounded-2xl overflow-hidden">
        <div className="px-6 py-4 flex items-center gap-2" style={sectionHeaderStyle}>
          <span className="text-lg">⚙️</span>
          <h2 className="font-semibold text-white">System Info</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon:'🌐', label:'Frontend', value:'Vercel', status:'Online', color:'#10b981' },
              { icon:'🖥️', label:'Backend',  value:'Railway', status:'Online', color:'#10b981' },
              { icon:'🗄️', label:'Database', value:'MongoDB Atlas', status:'Connected', color:'#10b981' },
            ].map(s => (
              <div key={s.label} className="rounded-xl p-4"
                style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{s.icon}</span>
                  <span className="text-xs text-slate-500">{s.label}</span>
                </div>
                <p className="text-sm font-semibold text-slate-200">{s.value}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: s.color }} />
                  <span className="text-xs" style={{ color: s.color }}>{s.status}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 p-4 rounded-xl"
            style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.05)' }}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              {[
                { label:'Email Service', value:'Brevo API' },
                { label:'Auth',          value:'JWT + OTP' },
                { label:'Blockchain',    value:'SHA-256 PoW' },
                { label:'Real-time',     value:'Socket.io' },
              ].map(i => (
                <div key={i.label}>
                  <p className="text-xs text-slate-500">{i.label}</p>
                  <p className="text-sm font-semibold text-slate-300 mt-0.5">{i.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── PROFILE + PASSWORD ─────────────────────── */}
      <div className="space-y-3">
        {/* Profile Accordion */}
        <AccordionSection icon="👤" title="Profile Info" subtitle="Update your name and photo">
          <div className="flex items-center gap-5 mb-6">
            <div className="relative flex-shrink-0">
              <motion.div whileHover={{ scale: 1.05 }} onClick={() => photoRef.current?.click()}
                className="w-20 h-20 rounded-2xl overflow-hidden cursor-pointer relative"
                style={{ border: '2px solid rgba(59,130,246,0.4)', boxShadow: '0 4px 20px rgba(59,130,246,0.25)' }}>
                <Avatar user={user} size={80} style={{ borderRadius: 14, width: '100%', height: '100%' }} />
                <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl">
                  <span className="text-white text-xs font-medium">📷 Change</span>
                </div>
              </motion.div>
              {photoSaving && (
                <div className="absolute inset-0 rounded-2xl bg-black/60 flex items-center justify-center">
                  <svg className="animate-spin w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                </div>
              )}
              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                onClick={() => photoRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center text-sm shadow-lg"
                style={{ background: 'linear-gradient(135deg,#3b82f6,#1e40af)', border: '2px solid rgba(15,23,42,1)' }}>
                📷
              </motion.button>
              <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
            </div>
            <div>
              <p className="font-semibold text-white text-base">{user?.name}</p>
              <p className="text-sm text-slate-400">{user?.email}</p>
              <span className="text-xs px-2 py-0.5 rounded-full font-medium mt-1.5 inline-block"
                style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.2)' }}>
                👑 Admin
              </span>
            </div>
          </div>
          <form onSubmit={handleProfileSave} className="space-y-3">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Full Name</label>
              <input value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                className={inputCls} style={inputStyle} />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Email (cannot change)</label>
              <input value={profileForm.email} disabled
                className="w-full rounded-xl px-3 py-2 text-sm text-slate-500 cursor-not-allowed"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }} />
            </div>
            <button type="submit" disabled={saving}
              className="w-full text-white py-2 rounded-xl text-sm font-semibold transition disabled:opacity-60 hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #1e40af)', boxShadow: '0 4px 15px rgba(59,130,246,0.3)' }}>
              {saving ? '⏳ Saving...' : 'Save Changes'}
            </button>
          </form>
        </AccordionSection>

        {/* Password Accordion */}
        <AccordionSection icon="🔒" title="Change Password" subtitle="Update your account password">
          <form onSubmit={handlePasswordSave} className="space-y-3">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Current Password</label>
              <div className="relative">
                <input type={pwForm.show ? 'text' : 'password'} value={pwForm.oldPw}
                  onChange={(e) => setPwForm({ ...pwForm, oldPw: e.target.value })}
                  placeholder="Your current password" className={`${inputCls} pr-8`} style={inputStyle} />
                <button type="button" onClick={() => setPwForm({ ...pwForm, show: !pwForm.show })}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                  {pwForm.show ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">New Password</label>
              <input type={pwForm.show ? 'text' : 'password'} value={pwForm.newPw}
                onChange={(e) => setPwForm({ ...pwForm, newPw: e.target.value })}
                placeholder="Min 6 characters" className={inputCls} style={inputStyle} />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Confirm Password</label>
              <input type="password" value={pwForm.confirm}
                onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })}
                placeholder="Repeat new password" className={inputCls} style={inputStyle} />
            </div>
            {pwForm.newPw && (
              <div className="flex gap-1">
                {[1,2,3,4].map(i => (
                  <div key={i} className="h-1 flex-1 rounded-full transition-all"
                    style={{ background: pwForm.newPw.length >= i*3
                      ? i<=1?'#f87171':i<=2?'#fbbf24':i<=3?'#60a5fa':'#34d399'
                      : 'rgba(255,255,255,0.08)' }} />
                ))}
              </div>
            )}
            <button type="submit" disabled={pwLoading}
              className="w-full text-white py-2 rounded-xl text-sm font-semibold transition hover:opacity-90 disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #1e40af)', boxShadow: '0 4px 15px rgba(59,130,246,0.3)' }}>
              {pwLoading ? '⏳ Updating...' : 'Update Password'}
            </button>
          </form>
        </AccordionSection>
      </div>
    </motion.div>
  );
}

