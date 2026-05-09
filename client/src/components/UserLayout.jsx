import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import UserSidebar from './UserSidebar.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import DarkModeToggle from './DarkModeToggle.jsx';
import Avatar from './Avatar.jsx';

export default function UserLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate  = useNavigate();
  const { darkMode } = useTheme();
  const { user }  = useAuth();

  const navBg     = darkMode ? 'rgba(15,23,42,0.85)'   : 'rgba(255,255,255,0.85)';
  const navBorder = darkMode ? 'rgba(99,102,241,0.1)'  : 'rgba(99,102,241,0.15)';
  const searchBg  = darkMode ? 'rgba(255,255,255,0.05)': 'rgba(99,102,241,0.06)';
  const searchBdr = darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(99,102,241,0.15)';
  const textColor = darkMode ? '#cbd5e1'               : '#374151';
  const mutedColor= darkMode ? '#475569'               : '#94a3b8';

  return (
    <div className="flex h-screen overflow-hidden"
      style={{
        background: darkMode
          ? 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)'
          : 'linear-gradient(135deg, #f0f4ff 0%, #e8eeff 50%, #f5f0ff 100%)',
        transition: 'background 0.4s ease',
      }}>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex flex-shrink-0">
        <UserSidebar />
      </div>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)} />
            <motion.div
              initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 bottom-0 z-50 md:hidden">
              <UserSidebar />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* ── Top Navbar (same style as Admin) ── */}
        <div className="flex-shrink-0 flex items-center justify-between px-5 py-3 border-b"
          style={{
            background:     navBg,
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderColor:    navBorder,
            transition:     'background 0.4s ease',
          }}>

          {/* Left */}
          <div className="flex items-center gap-3">
            {/* Mobile hamburger */}
            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => setSidebarOpen(true)}
              className="md:hidden w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: searchBg, color: mutedColor }}>
              ☰
            </motion.button>

            {/* Search bar */}
            <div className="hidden sm:flex items-center gap-2 rounded-xl px-3 py-2 w-56"
              style={{ background: searchBg, border: `1px solid ${searchBdr}` }}>
              <span className="text-sm" style={{ color: mutedColor }}>🔍</span>
              <input
                placeholder="Search..."
                className="bg-transparent text-sm focus:outline-none w-full"
                style={{ color: textColor }}
              />
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-2">

            {/* Dark/Light toggle */}
            <DarkModeToggle size="sm" />

            {/* Profile button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/dashboard/profile')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-colors"
              style={{
                background:  searchBg,
                borderColor: searchBdr,
              }}>
              <Avatar user={user} size={28}
                style={{ borderRadius: 8, border: '1px solid rgba(99,102,241,0.4)' }} />
              <span className="text-sm hidden sm:block" style={{ color: textColor }}>
                {user?.name}
              </span>
            </motion.button>
          </div>
        </div>

        {/* Page content with route transition */}
        <main className="flex-1 overflow-y-auto p-5">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}>
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
}
