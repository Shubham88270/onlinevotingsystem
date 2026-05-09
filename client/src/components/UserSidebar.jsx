import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import Avatar from './Avatar.jsx';

const menuItems = [
  { path: '/dashboard',          icon: '🏠', label: 'Dashboard'  },
  { path: '/dashboard/vote',     icon: '🗳️', label: 'Vote'       },
  { path: '/dashboard/results',  icon: '📊', label: 'Results'    },
  { path: '/dashboard/profile',  icon: '👤', label: 'Profile'    },
  { path: '/dashboard/settings', icon: '⚙️', label: 'Settings'   },
];

export default function UserSidebar() {
  const { user, logout } = useAuth();
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => { logout(); navigate('/'); };

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="h-screen flex flex-col overflow-hidden flex-shrink-0 sidebar-3d"
      style={{
        background:   darkMode
          ? 'linear-gradient(180deg, #0f172a 0%, #1a1040 50%, #0f172a 100%)'
          : 'linear-gradient(180deg, #ffffff 0%, #f0f4ff 50%, #ffffff 100%)',
        borderRight:  darkMode ? '1px solid rgba(99,102,241,0.15)' : '1px solid rgba(99,102,241,0.2)',
        transition:   'background 0.4s ease',
      }}>

      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-white/5">
        <AnimatePresence>
          {!collapsed && (
            <motion.div initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-10 }}
              className="flex items-center gap-2.5">
              <motion.div whileHover={{ rotate: 10, scale: 1.1 }}
                className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-sm shadow-lg shadow-indigo-500/30">
                🗳️
              </motion.div>
              <div>
                <p className="font-bold text-sm" style={{ color: darkMode ? '#fff' : '#1e1b4b' }}>VoteApp</p>
                <p className="text-xs" style={{ color: darkMode ? '#475569' : '#6366f1' }}>Voter Panel</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <motion.button whileHover={{ scale:1.1 }} whileTap={{ scale:0.9 }}
          onClick={() => setCollapsed(!collapsed)}
          className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 flex-shrink-0">
          <motion.span animate={{ rotate: collapsed ? 180 : 0 }} transition={{ duration:0.3 }}>◀</motion.span>
        </motion.button>
      </div>

      {/* User card */}
      <div className={`px-3 py-3 border-b border-white/5 ${collapsed ? 'flex justify-center' : ''}`}>
        <div className="flex items-center gap-3">
          <motion.div whileHover={{ scale:1.08 }} className="flex-shrink-0">
            <Avatar user={user} size={36}
              style={{ borderRadius:12, boxShadow:'0 4px 12px rgba(99,102,241,0.3)', border:'2px solid rgba(99,102,241,0.4)' }} />
          </motion.div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-10 }}
                className="overflow-hidden">
                <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-xs font-mono text-indigo-400">{user?.voterId}</span>
                  {user?.isApproved && <span className="text-xs text-emerald-400">✓</span>}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {menuItems.map((item, i) => (
          <NavLink key={item.path} to={item.path} end={item.path === '/dashboard'}>
            {({ isActive }) => (
              <motion.div
                initial={{ opacity:0, x:-16 }}
                animate={{ opacity:1, x:0 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ x: collapsed ? 0 : 4, scale: 1.01 }}
                whileTap={{ scale: 0.97 }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all relative overflow-hidden cursor-pointer ${
                  isActive ? '' : 'hover:bg-white/5'
                }`}
                style={isActive ? {
                  background: darkMode
                    ? 'linear-gradient(90deg, rgba(99,102,241,0.2), rgba(99,102,241,0.05))'
                    : 'linear-gradient(90deg, rgba(99,102,241,0.15), rgba(99,102,241,0.03))',
                  borderLeft: '2px solid #6366f1',
                  boxShadow:  'inset 0 0 20px rgba(99,102,241,0.08)',
                  color: darkMode ? '#fff' : '#4338ca',
                } : { color: darkMode ? '#94a3b8' : '#64748b' }}>

                {isActive && (
                  <motion.div layoutId="userActiveGlow" className="absolute inset-0 rounded-xl"
                    style={{ background:'radial-gradient(circle at 20% 50%, rgba(99,102,241,0.15), transparent 70%)' }} />
                )}

                <motion.span
                  animate={isActive ? { scale:[1,1.2,1] } : {}}
                  transition={{ duration:0.3 }}
                  className="text-base flex-shrink-0 relative z-10">
                  {item.icon}
                </motion.span>

                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity:0, width:0 }}
                      animate={{ opacity:1, width:'auto' }}
                      exit={{ opacity:0, width:0 }}
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
          whileHover={{ x: collapsed ? 0 : 3, backgroundColor:'rgba(239,68,68,0.1)' }}
          whileTap={{ scale:0.97 }}
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-400 hover:text-red-300 transition-colors">
          <span className="text-base flex-shrink-0">🚪</span>
          <AnimatePresence>
            {!collapsed && (
              <motion.span initial={{ opacity:0, width:0 }} animate={{ opacity:1, width:'auto' }} exit={{ opacity:0, width:0 }}
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
