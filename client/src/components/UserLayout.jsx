import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import UserSidebar from './UserSidebar.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import DarkModeToggle from './DarkModeToggle.jsx';

export default function UserLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { darkMode, setDarkMode } = useTheme();

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

        {/* Mobile topbar */}
        <div className="md:hidden flex-shrink-0 flex items-center gap-3 px-4 py-3 border-b"
          style={{
            background: darkMode ? 'rgba(15,23,42,0.8)' : 'rgba(255,255,255,0.8)',
            backdropFilter: 'blur(20px)',
            borderColor: darkMode ? 'rgba(99,102,241,0.1)' : 'rgba(99,102,241,0.15)',
            transition: 'background 0.4s ease',
          }}>
          <motion.button whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
            onClick={() => setSidebarOpen(true)}
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(99,102,241,0.1)', color: darkMode ? '#94a3b8' : '#6366f1' }}>
            ☰
          </motion.button>
          <span className="font-bold flex-1" style={{ color: darkMode ? '#fff' : '#1e1b4b' }}>🗳️ VoteApp</span>
          {/* Dark/Light toggle */}
          <DarkModeToggle size="sm" />
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
