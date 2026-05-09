import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import AdminSidebar from './AdminSidebar.jsx';
import NotificationDropdown from './NotificationDropdown.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import Avatar from './Avatar.jsx';
import DarkModeToggle from './DarkModeToggle.jsx';
import socket from '../socket.js';

// Seed notifications shown on first load
const SEED_NOTIFICATIONS = [
  { id: 1, icon: '👤', title: 'New voter pending approval',    desc: 'A new voter registered and needs approval.',     time: '2m ago',  unread: true  },
  { id: 2, icon: '🗳️', title: 'Vote cast in active election',  desc: 'Vote recorded in "Student Council 2026".',       time: '5m ago',  unread: true  },
  { id: 3, icon: '⛓️', title: 'Blockchain integrity verified', desc: 'All vote blocks passed integrity check.',         time: '10m ago', unread: false },
  { id: 4, icon: '✅', title: 'Admin approved 2 voters',       desc: 'ranjan@gmail.com and rahul@gmail.com approved.', time: '15m ago', unread: false },
];

let nextId = SEED_NOTIFICATIONS.length + 1;

const timeAgo = () => 'just now';

export default function AdminLayout() {
  const [sidebarOpen,   setSidebarOpen]   = useState(false);
  const [notifOpen,     setNotifOpen]     = useState(false);
  const [notifications, setNotifications] = useState(SEED_NOTIFICATIONS);
  const bellRef = useRef(null);
  const { user } = useAuth();
  const { darkMode, setDarkMode } = useTheme();
  const navigate = useNavigate();

  const unreadCount = notifications.filter(n => n.unread).length;

  // Mark a single notification as read
  const handleMarkRead = useCallback((id) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, unread: false } : n)
    );
  }, []);

  // Mark all as read
  const handleMarkAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  }, []);

  // Connect socket and listen for real admin notifications
  useEffect(() => {
    socket.connect();
    socket.emit('joinAdmin');

    const handleIncoming = ({ icon, title, desc }) => {
      setNotifications(prev => [{
        id:     nextId++,
        icon,
        title,
        desc,
        time:   timeAgo(),
        unread: true,
      }, ...prev]);
    };

    socket.on('adminNotification', handleIncoming);

    return () => {
      socket.off('adminNotification', handleIncoming);
      socket.emit('leaveAdmin');
      socket.disconnect();
    };
  }, []);

  return (
    <div className="flex h-screen overflow-hidden"
      style={{
        background: darkMode
          ? 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)'
          : 'linear-gradient(135deg, #f0f4ff 0%, #e8eeff 50%, #f5f0ff 100%)',
        transition: 'background 0.4s ease',
      }}>

      {/* Notification Portal */}
      <NotificationDropdown
        open={notifOpen}
        onClose={() => setNotifOpen(false)}
        anchorRef={bellRef}
        notifications={notifications}
        onMarkRead={handleMarkRead}
        onMarkAllRead={handleMarkAllRead}
      />

      {/* Desktop Sidebar */}
      <div className="hidden md:flex flex-shrink-0">
        <AdminSidebar />
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
              <AdminSidebar />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top Navbar */}
        <div className="flex-shrink-0 flex items-center justify-between px-5 py-3 border-b"
          style={{
            background:     darkMode ? 'rgba(15,23,42,0.8)' : 'rgba(255,255,255,0.8)',
            backdropFilter: 'blur(20px)',
            borderColor:    darkMode ? 'rgba(99,102,241,0.1)' : 'rgba(99,102,241,0.15)',
            transition:     'background 0.4s ease',
          }}>

          {/* Left */}
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => setSidebarOpen(true)}
              className="md:hidden w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-400">
              ☰
            </motion.button>

            {/* Search */}
            <div className="hidden sm:flex items-center gap-2 rounded-xl px-3 py-2 w-56"
              style={{
                background:   darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(99,102,241,0.06)',
                border:       darkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(99,102,241,0.15)',
              }}>
              <span className="text-sm" style={{ color: darkMode ? '#475569' : '#94a3b8' }}>🔍</span>
              <input placeholder="Search..."
                className="bg-transparent text-sm focus:outline-none w-full"
                style={{ color: darkMode ? '#cbd5e1' : '#374151' }} />
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-2">

            {/* Dark/Light Mode Toggle */}
            <DarkModeToggle size="sm" />

            {/* Notification Bell */}
            <div className="relative">
              <motion.button
                ref={bellRef}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                animate={unreadCount > 0 ? { rotate: [0, -8, 8, -8, 8, 0] } : {}}
                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 4 }}
                onClick={() => setNotifOpen(p => !p)}
                onMouseEnter={() => setNotifOpen(true)}
                className="relative w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-slate-300 transition-colors">
                🔔
                {unreadCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center font-bold">
                    {unreadCount}
                  </motion.span>
                )}
              </motion.button>
            </div>

            {/* Admin profile */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/admin/settings')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors">
              <Avatar user={user} size={28}
                style={{ borderRadius:8, border:'1px solid rgba(59,130,246,0.4)' }} />
              <span className="text-sm text-slate-300 hidden sm:block">{user?.name}</span>
            </motion.button>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-5">
          <motion.div
            key={window.location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}>
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
}
