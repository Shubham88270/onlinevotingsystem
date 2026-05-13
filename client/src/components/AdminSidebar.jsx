import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import Avatar from './Avatar.jsx';

const menuItems = [
  { path: '/admin',            icon: '🏠', label: 'Dashboard'          },
  { path: '/admin/elections',  icon: '🗳️', label: 'Manage Elections'   },
  { path: '/admin/users',      icon: '👥', label: 'Manage Users'       },
  { path: '/admin/monitoring', icon: '📡', label: 'Votes Monitoring'   },
  { path: '/admin/results',    icon: '📊', label: 'Results'            },
  { path: '/admin/blockchain', icon: '⛓️', label: 'Blockchain Explorer'},
  { path: '/admin/audit',      icon: '📋', label: 'Audit Logs'         },
  { path: '/admin/settings',   icon: '⚙️', label: 'Settings'           },
];

export default function AdminSidebar() {
  const { user, logout } = useAuth();
  const { darkMode, currentTheme } = useTheme();
  const navigate = useNavigate();
  const [pinned, setPinned]   = useState(false); // manually pinned open
  const [hovered, setHovered] = useState(false);
  const collapsed = !pinned && !hovered;          // collapsed when not pinned and not hovered

  const handleLogout = () => { logout(); navigate('/'); };

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'A';

  return (
    <motion.aside
      animate={{ width: collapsed ? 68 : 240 }}
      transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="h-screen flex flex-col overflow-hidden flex-shrink-0"
      style={{
        background:  darkMode
          ? `linear-gradient(180deg, #0f172a 0%, ${currentTheme?.primary}22 50%, #0f172a 100%)`
          : 'linear-gradient(180deg, #ffffff 0%, #f0f4ff 50%, #ffffff 100%)',
        borderRight: darkMode ? `1px solid ${currentTheme?.primary}30` : '1px solid rgba(99,102,241,0.2)',
        transition:  'background 0.4s ease',
      }}>

      {/* Logo + pin toggle */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-white/5">
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-sm shadow-lg shadow-blue-500/30">
                🗳️
              </div>
              <div>
                <p className="font-bold text-sm leading-tight" style={{ color: darkMode ? '#fff' : '#1e1b4b' }}>VoteApp</p>
                <p className="text-xs" style={{ color: darkMode ? '#475569' : '#6366f1' }}>Admin Panel</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Pin button — only visible when expanded */}
        <AnimatePresence>
          {!collapsed && (
            <motion.button
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
              onClick={() => setPinned(p => !p)}
              title={pinned ? 'Unpin sidebar' : 'Pin sidebar open'}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-colors flex-shrink-0"
              style={{
                background: pinned ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.05)',
                border: pinned ? '1px solid rgba(99,102,241,0.4)' : '1px solid rgba(255,255,255,0.08)',
                color: pinned ? '#a5b4fc' : '#64748b',
              }}>
              {pinned ? '📌' : '📍'}
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* User info */}
      <div className={`px-3 py-3 border-b border-white/5 ${collapsed ? 'flex justify-center' : ''}`}>
        <div className={`flex items-center gap-3`}>
          <motion.div whileHover={{ scale: 1.05 }} className="flex-shrink-0">
            <Avatar user={user} size={36}
              style={{ borderRadius:12, boxShadow:'0 4px 12px rgba(59,130,246,0.3)', border:'2px solid rgba(59,130,246,0.4)' }} />
          </motion.div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="overflow-hidden">
                <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
                <p className="text-xs text-slate-500 truncate">{user?.email}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {menuItems.map((item, i) => (
          <NavLink key={item.path} to={item.path} end={item.path === '/admin'}>
            {({ isActive }) => (
              <motion.div
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                whileHover={{
                  x: collapsed ? 0 : 3,
                  backgroundColor: 'rgba(239,68,68,0.12)',
                  borderLeft: '2px solid #ef4444',
                  color: '#fca5a5',
                }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all relative overflow-hidden`}
                style={isActive ? {
                  background: darkMode
                    ? `linear-gradient(90deg, ${currentTheme?.primary}33, ${currentTheme?.primary}0a)`
                    : `linear-gradient(90deg, ${currentTheme?.primary}20, ${currentTheme?.primary}05)`,
                  borderLeft: `2px solid ${currentTheme?.primary}`,
                  boxShadow:  `inset 0 0 20px ${currentTheme?.primary}15`,
                  color: darkMode ? '#fff' : '#1d4ed8',
                } : { color: darkMode ? '#94a3b8' : '#64748b' }}>

                {/* Active glow */}
                {isActive && (
                  <motion.div
                    layoutId="activeGlow"
                    className="absolute inset-0 rounded-xl"
                    style={{ background: 'radial-gradient(circle at 20% 50%, rgba(59,130,246,0.15), transparent 70%)' }}
                  />
                )}

                <span className="text-base flex-shrink-0 relative z-10">{item.icon}</span>
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      className="text-sm font-medium whitespace-nowrap overflow-hidden relative z-10">
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-2 py-3 border-t border-white/5">
        <motion.button
          whileHover={{ x: collapsed ? 0 : 3, backgroundColor: 'rgba(239,68,68,0.1)' }}
          whileTap={{ scale: 0.97 }}
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-400 hover:text-red-300 transition-colors">
          <span className="text-base flex-shrink-0">🚪</span>
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="text-sm font-medium whitespace-nowrap overflow-hidden">
                Logout
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </motion.aside>
  );
}
