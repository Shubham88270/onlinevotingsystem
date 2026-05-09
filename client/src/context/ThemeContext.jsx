import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const themes = {
  indigo: {
    name: 'Indigo',
    primary:   '#6366f1',
    secondary: '#8b5cf6',
    accent:    '#06b6d4',
    bg:        'from-slate-950 via-indigo-950 to-slate-900',
    sidebar:   'bg-indigo-900',
    badge:     'bg-indigo-600',
  },
  violet: {
    name: 'Violet',
    primary:   '#7c3aed',
    secondary: '#a855f7',
    accent:    '#ec4899',
    bg:        'from-slate-950 via-violet-950 to-slate-900',
    sidebar:   'bg-violet-900',
    badge:     'bg-violet-600',
  },
  cyan: {
    name: 'Cyan',
    primary:   '#0891b2',
    secondary: '#06b6d4',
    accent:    '#10b981',
    bg:        'from-slate-950 via-cyan-950 to-slate-900',
    sidebar:   'bg-cyan-900',
    badge:     'bg-cyan-600',
  },
  rose: {
    name: 'Rose',
    primary:   '#e11d48',
    secondary: '#f43f5e',
    accent:    '#f97316',
    bg:        'from-slate-950 via-rose-950 to-slate-900',
    sidebar:   'bg-rose-900',
    badge:     'bg-rose-600',
  },
  emerald: {
    name: 'Emerald',
    primary:   '#059669',
    secondary: '#10b981',
    accent:    '#06b6d4',
    bg:        'from-slate-950 via-emerald-950 to-slate-900',
    sidebar:   'bg-emerald-900',
    badge:     'bg-emerald-600',
  },
  amber: {
    name: 'Amber',
    primary:   '#d97706',
    secondary: '#f59e0b',
    accent:    '#ef4444',
    bg:        'from-slate-950 via-amber-950 to-slate-900',
    sidebar:   'bg-amber-900',
    badge:     'bg-amber-600',
  },
};

export const fontSizes = {
  sm:  { name: 'Small',   base: '13px', label: 'text-xs' },
  md:  { name: 'Medium',  base: '15px', label: 'text-sm' },
  lg:  { name: 'Large',   base: '17px', label: 'text-base' },
  xl:  { name: 'X-Large', base: '19px', label: 'text-lg' },
};

export const fontFamilies = {
  inter:   { name: 'Inter',    value: "'Inter', sans-serif" },
  poppins: { name: 'Poppins',  value: "'Poppins', sans-serif" },
  mono:    { name: 'Mono',     value: "'JetBrains Mono', monospace" },
  system:  { name: 'System',   value: "system-ui, sans-serif" },
};

export const ThemeProvider = ({ children }) => {
  const [theme,      setTheme]      = useState(() => {
    const saved = localStorage.getItem('theme');
    return (saved && themes[saved]) ? saved : 'indigo';
  });
  const [fontSize,   setFontSize]   = useState(() => {
    const saved = localStorage.getItem('fontSize');
    return (saved && fontSizes[saved]) ? saved : 'md';
  });
  const [fontFamily, setFontFamily] = useState(() => {
    const saved = localStorage.getItem('fontFamily');
    return (saved && fontFamilies[saved]) ? saved : 'inter';
  });
  const [darkMode,   setDarkMode]   = useState(() => localStorage.getItem('darkMode') !== 'false');

  // Apply CSS variables + dark/light mode class
  useEffect(() => {
    const t = themes[theme] || themes['indigo'];
    const r = document.documentElement;

    // Theme colors
    r.style.setProperty('--color-primary',   t.primary);
    r.style.setProperty('--color-secondary', t.secondary);
    r.style.setProperty('--color-accent',    t.accent);
    r.style.setProperty('--font-size-base',  fontSizes[fontSize].base);
    r.style.setProperty('--font-family',     fontFamilies[fontFamily].value);

    // Dark / Light mode CSS variables
    if (darkMode) {
      r.classList.add('dark');
      r.classList.remove('light');
      r.style.background = 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)';
      r.style.setProperty('--bg-primary',    '#0f172a');
      r.style.setProperty('--bg-secondary',  '#1e293b');
      r.style.setProperty('--bg-card',       'rgba(255,255,255,0.04)');
      r.style.setProperty('--bg-sidebar',    'rgba(15,23,42,0.95)');
      r.style.setProperty('--text-primary',  '#f1f5f9');
      r.style.setProperty('--text-secondary','#94a3b8');
      r.style.setProperty('--text-muted',    '#475569');
      r.style.setProperty('--border-color',  'rgba(255,255,255,0.08)');
      r.style.setProperty('--shadow-color',  'rgba(0,0,0,0.4)');
      r.style.setProperty('--glass-bg',      'rgba(255,255,255,0.04)');
      r.style.setProperty('--glass-border',  'rgba(255,255,255,0.08)');
      document.body.style.background = 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)';
      document.body.style.color      = '#f1f5f9';
    } else {
      r.classList.add('light');
      r.classList.remove('dark');
      r.style.background = 'linear-gradient(135deg, #f0f4ff 0%, #e8eeff 50%, #f5f0ff 100%)';
      r.style.setProperty('--bg-primary',    '#f8fafc');
      r.style.setProperty('--bg-secondary',  '#ffffff');
      r.style.setProperty('--bg-card',       'rgba(255,255,255,0.85)');
      r.style.setProperty('--bg-sidebar',    'rgba(248,250,252,0.98)');
      r.style.setProperty('--text-primary',  '#0f172a');
      r.style.setProperty('--text-secondary','#475569');
      r.style.setProperty('--text-muted',    '#94a3b8');
      r.style.setProperty('--border-color',  'rgba(0,0,0,0.08)');
      r.style.setProperty('--shadow-color',  'rgba(0,0,0,0.1)');
      r.style.setProperty('--glass-bg',      'rgba(255,255,255,0.7)');
      r.style.setProperty('--glass-border',  'rgba(99,102,241,0.15)');
      document.body.style.background = 'linear-gradient(135deg, #f0f4ff 0%, #e8eeff 50%, #f5f0ff 100%)';
      document.body.style.color      = '#0f172a';
    }

    document.body.style.fontSize   = fontSizes[fontSize].base;
    document.body.style.fontFamily = fontFamilies[fontFamily].value;
    document.body.style.transition = 'background 0.4s ease, color 0.4s ease';

    localStorage.setItem('theme',      theme);
    localStorage.setItem('fontSize',   fontSize);
    localStorage.setItem('fontFamily', fontFamily);
    localStorage.setItem('darkMode',   darkMode);
  }, [theme, fontSize, fontFamily, darkMode]);

  return (
    <ThemeContext.Provider value={{
      theme, setTheme, themes,
      fontSize, setFontSize, fontSizes,
      fontFamily, setFontFamily, fontFamilies,
      darkMode, setDarkMode,
      currentTheme: themes[theme],
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
