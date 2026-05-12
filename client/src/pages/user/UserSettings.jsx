import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext.jsx';
import toast from 'react-hot-toast';

const glass = { background:'rgba(255,255,255,0.04)', backdropFilter:'blur(16px)', border:'1px solid rgba(255,255,255,0.08)' };
const inputStyle = { background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)' };

export default function UserSettings() {
  const {
    theme, setTheme, themes,
    fontSize, setFontSize, fontSizes,
    fontFamily, setFontFamily, fontFamilies,
    darkMode, setDarkMode,
  } = useTheme();

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }}>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-slate-500 text-sm mt-1">Customize your experience</p>
      </motion.div>

      {/* ── Appearance ── */}
      <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }}
        className="rounded-2xl overflow-hidden" style={glass}>
        <div className="px-6 py-4 flex items-center gap-2"
          style={{ borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
          <span className="text-lg">🎨</span>
          <h2 className="font-semibold text-white">Appearance</h2>
        </div>
        <div className="p-6 space-y-6">

          {/* Color Theme */}
          <div>
            <label className="text-sm font-medium text-slate-300 mb-3 block">Color Theme</label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {Object.entries(themes).map(([key, t]) => (
                <motion.button key={key}
                  whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
                  onClick={() => { setTheme(key); toast.success(`${t.name} theme applied!`); }}
                  className="relative flex flex-col items-center gap-2 p-3 rounded-xl transition-all"
                  style={theme === key
                    ? { border:`2px solid ${t.primary}`, background:`${t.primary}15` }
                    : { border:'2px solid rgba(255,255,255,0.08)', background:'rgba(255,255,255,0.03)' }}>
                  <div className="flex gap-1">
                    <div className="w-4 h-4 rounded-full shadow-sm" style={{ background: t.primary }} />
                    <div className="w-4 h-4 rounded-full shadow-sm" style={{ background: t.secondary }} />
                    <div className="w-4 h-4 rounded-full shadow-sm" style={{ background: t.accent }} />
                  </div>
                  <span className="text-xs font-medium text-slate-400">{t.name}</span>
                  {theme === key && (
                    <span className="absolute top-1.5 right-1.5 text-xs" style={{ color: t.primary }}>✓</span>
                  )}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Font Size */}
          <div>
            <label className="text-sm font-medium text-slate-300 mb-3 block">Font Size</label>
            <div className="flex gap-3 flex-wrap">
              {Object.entries(fontSizes).map(([key, f]) => (
                <motion.button key={key}
                  whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
                  onClick={() => setFontSize(key)}
                  className="px-4 py-2 rounded-xl transition-all font-medium"
                  style={fontSize === key
                    ? { border:'2px solid #6366f1', background:'rgba(99,102,241,0.15)', color:'#a5b4fc', fontSize: f.base }
                    : { border:'2px solid rgba(255,255,255,0.08)', color:'#94a3b8', background:'rgba(255,255,255,0.03)', fontSize: f.base }}>
                  {f.name}
                </motion.button>
              ))}
            </div>
            {/* Preview */}
            <div className="mt-3 p-4 rounded-xl" style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-slate-500 text-xs mb-1">Preview:</p>
              <p className="text-slate-200 font-medium" style={{ fontSize: fontSizes[fontSize].base }}>
                The quick brown fox jumps over the lazy dog.
              </p>
            </div>
          </div>

          {/* Font Family */}
          <div>
            <label className="text-sm font-medium text-slate-300 mb-3 block">Font Family</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Object.entries(fontFamilies).map(([key, f]) => (
                <motion.button key={key}
                  whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }}
                  onClick={() => setFontFamily(key)}
                  className="px-4 py-3 rounded-xl transition-all text-left"
                  style={fontFamily === key
                    ? { border:'2px solid #6366f1', background:'rgba(99,102,241,0.15)' }
                    : { border:'2px solid rgba(255,255,255,0.08)', background:'rgba(255,255,255,0.03)' }}>
                  <p className="text-sm font-semibold text-slate-200" style={{ fontFamily: f.value }}>{f.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5" style={{ fontFamily: f.value }}>Aa Bb Cc</p>
                  {fontFamily === key && <span className="text-indigo-400 text-xs">✓ Active</span>}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Dark Mode */}
          <div className="flex items-center justify-between p-4 rounded-xl"
            style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)' }}>
            <div>
              <p className="text-sm font-medium text-slate-200">Dark Mode</p>
              <p className="text-xs text-slate-500 mt-0.5">Toggle dark/light interface</p>
            </div>
            <motion.button whileTap={{ scale:0.95 }}
              onClick={() => setDarkMode(!darkMode)}
              className={`relative w-12 h-6 rounded-full transition-colors ${darkMode ? 'bg-indigo-500' : 'bg-white/20'}`}>
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${darkMode ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </motion.button>
          </div>

          {/* Reset */}
          <button
            onClick={() => { setTheme('indigo'); setFontSize('md'); setFontFamily('inter'); setDarkMode(true); toast.success('Reset to defaults!'); }}
            className="text-sm text-slate-500 hover:text-slate-300 transition underline">
            Reset to defaults
          </button>
        </div>
      </motion.div>
    </div>
  );
}
