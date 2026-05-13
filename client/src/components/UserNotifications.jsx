import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axios.jsx';
import socket from '../socket.js';
import { useAuth } from '../context/AuthContext.jsx';

const TYPE_STYLES = {
  success: { bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.25)', dot: '#10b981' },
  error:   { bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.25)',  dot: '#ef4444' },
  warning: { bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.25)', dot: '#f59e0b' },
  info:    { bg: 'rgba(59,130,246,0.1)',  border: 'rgba(59,130,246,0.25)', dot: '#3b82f6' },
};

function timeAgo(date) {
  const diff = Date.now() - new Date(date).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return 'just now';
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export default function UserNotifications() {
  const { user } = useAuth();
  const [open,    setOpen]    = useState(false);
  const [notifs,  setNotifs]  = useState([]);
  const [loading, setLoading] = useState(false);
  const dropRef = useRef(null);

  const unread = notifs.filter(n => !n.isRead).length;

  const fetchNotifs = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data } = await api.get('/notifications');
      setNotifs(data);
    } catch {}
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => {
    fetchNotifs();

    // Join personal socket room
    if (user?._id) {
      socket.connect();
      socket.emit('joinUser', user._id);
    }

    // Real-time notification
    socket.on('notification', (notif) => {
      setNotifs(prev => [notif, ...prev]);
    });

    return () => { socket.off('notification'); };
  }, [user, fetchNotifs]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifs(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifs(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch {}
  };

  const deleteNotif = async (id, e) => {
    e.stopPropagation();
    try {
      await api.delete(`/notifications/${id}`);
      setNotifs(prev => prev.filter(n => n._id !== id));
    } catch {}
  };

  const clearAll = async () => {
    try {
      await api.delete('/notifications');
      setNotifs([]);
    } catch {}
  };

  return (
    <div className="relative" ref={dropRef}>
      {/* Bell Button */}
      <motion.button
        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
        onClick={() => { setOpen(p => !p); if (!open) fetchNotifs(); }}
        className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
        style={{
          background: open ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.05)',
          border: open ? '1px solid rgba(99,102,241,0.4)' : '1px solid rgba(255,255,255,0.1)',
          color: '#94a3b8',
        }}>
        🔔
        {unread > 0 && (
          <motion.span
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center font-bold"
            style={{ fontSize: 10 }}>
            {unread > 9 ? '9+' : unread}
          </motion.span>
        )}
      </motion.button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-80 rounded-2xl overflow-hidden z-50"
            style={{
              background: 'rgba(10,15,30,0.97)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
            }}>

            {/* Header */}
            <div className="px-4 py-3 flex items-center justify-between"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white">Notifications</span>
                {unread > 0 && (
                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-red-500 text-white font-bold">{unread}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unread > 0 && (
                  <button onClick={markAllRead}
                    className="text-xs text-indigo-400 hover:text-indigo-300 transition">
                    Mark all read
                  </button>
                )}
                {notifs.length > 0 && (
                  <button onClick={clearAll}
                    className="text-xs text-slate-500 hover:text-red-400 transition">
                    Clear all
                  </button>
                )}
              </div>
            </div>

            {/* List */}
            <div className="overflow-y-auto" style={{ maxHeight: 360 }}>
              {loading ? (
                <div className="p-4 space-y-3">
                  {[1,2,3].map(i => (
                    <div key={i} className="h-14 rounded-xl animate-pulse"
                      style={{ background: 'rgba(255,255,255,0.05)' }} />
                  ))}
                </div>
              ) : notifs.length === 0 ? (
                <div className="py-12 text-center text-slate-600">
                  <p className="text-3xl mb-2">🔔</p>
                  <p className="text-sm">No notifications yet</p>
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {notifs.map((n) => {
                    const s = TYPE_STYLES[n.type] || TYPE_STYLES.info;
                    return (
                      <motion.div key={n._id}
                        initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                        onClick={() => !n.isRead && markRead(n._id)}
                        className="flex items-start gap-3 p-3 rounded-xl cursor-pointer group transition-all"
                        style={{
                          background: n.isRead ? 'transparent' : s.bg,
                          border: `1px solid ${n.isRead ? 'transparent' : s.border}`,
                        }}
                        whileHover={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                        {/* Icon */}
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                          style={{ background: s.bg, border: `1px solid ${s.border}` }}>
                          {n.icon || '🔔'}
                        </div>
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={`text-xs font-semibold truncate ${n.isRead ? 'text-slate-400' : 'text-white'}`}>
                              {n.title}
                            </p>
                            <button onClick={(e) => deleteNotif(n._id, e)}
                              className="text-slate-700 hover:text-red-400 transition opacity-0 group-hover:opacity-100 flex-shrink-0 text-xs">
                              ✕
                            </button>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-slate-600">{timeAgo(n.createdAt)}</span>
                            {!n.isRead && (
                              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                style={{ background: s.dot }} />
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
