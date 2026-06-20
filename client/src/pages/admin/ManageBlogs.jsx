import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext.jsx';

const STORAGE_KEY = 'voteapp_blogs';

const defaultBlogs = [
  {
    id: 1,
    emoji: '🗳️',
    category: 'Voting',
    title: 'Why Online Voting is the Future of Democracy',
    summary: 'Digital voting systems are transforming how communities make decisions — making participation easier, faster, and more transparent than ever before.',
    content: `Online voting removes the barriers of physical presence, long queues, and geographic restrictions. With proper authentication and blockchain-backed transparency, digital elections can be more secure than traditional paper-based systems.\n\nModern online voting platforms use end-to-end encryption, OTP verification, and immutable audit trails to ensure every vote counts and cannot be tampered with.`,
    author: 'VoteApp Team',
    date: 'June 10, 2026',
    readTime: '4 min read',
  },
  {
    id: 2,
    emoji: '🔗',
    category: 'Blockchain',
    title: 'How Blockchain Makes Voting Tamper-Proof',
    summary: 'Blockchain technology creates an immutable ledger of every vote cast — ensuring complete transparency and eliminating any possibility of fraud.',
    content: `Each vote is recorded as a block in a chain, cryptographically linked to the previous one. Once a vote is cast and added to the chain, it cannot be altered or deleted without detection.\n\nThis means every voter, observer, and auditor can independently verify the election results.`,
    author: 'Tech Team',
    date: 'June 5, 2026',
    readTime: '5 min read',
  },
  {
    id: 3,
    emoji: '🔒',
    category: 'Security',
    title: 'Top 5 Security Features in Modern Voting Systems',
    summary: 'From OTP verification to JWT authentication, here are the key security layers that protect your vote.',
    content: `1. OTP Email Verification\n2. JWT Authentication\n3. Blockchain Audit Trail\n4. Admin Approval Flow\n5. Rate Limiting`,
    author: 'Security Team',
    date: 'May 28, 2026',
    readTime: '6 min read',
  },
];

const categories = ['Voting', 'Blockchain', 'Security', 'Results', 'Guide', 'Accessibility', 'General'];

const emptyForm = { emoji: '📝', category: 'General', title: '', summary: '', content: '', author: 'VoteApp Team', date: '', readTime: '3 min read' };

export default function ManageBlogs() {
  const { darkMode } = useTheme();
  const [blogs, setBlogs] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || defaultBlogs; } catch { return defaultBlogs; }
  });
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteId, setDeleteId] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(blogs)); }, [blogs]);

  const save = () => {
    if (!form.title.trim() || !form.summary.trim()) return;
    if (editId !== null) {
      setBlogs(b => b.map(x => x.id === editId ? { ...form, id: editId } : x));
    } else {
      setBlogs(b => [...b, { ...form, id: Date.now() }]);
    }
    setShowForm(false);
    setEditId(null);
    setForm(emptyForm);
  };

  const startEdit = (blog) => {
    setForm({ ...blog });
    setEditId(blog.id);
    setShowForm(true);
  };

  const confirmDelete = () => {
    setBlogs(b => b.filter(x => x.id !== deleteId));
    setDeleteId(null);
  };

  const filtered = blogs.filter(b =>
    b.title.toLowerCase().includes(search.toLowerCase()) ||
    b.category.toLowerCase().includes(search.toLowerCase())
  );

  const card = `rounded-2xl border p-5 ${darkMode ? 'bg-gray-800/60 border-white/10' : 'bg-white border-gray-200'}`;
  const input = `w-full px-3 py-2 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition ${darkMode ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200 text-gray-900'}`;

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>📝 Manage Blogs</h1>
          <p className={`text-sm mt-0.5 ${darkMode ? 'text-slate-500' : 'text-gray-500'}`}>{blogs.length} articles · stored locally</p>
        </div>
        <button
          onClick={() => { setForm({ ...emptyForm, date: new Date().toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' }) }); setEditId(null); setShowForm(true); }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition"
        >
          + New Blog
        </button>
      </div>

      {/* Search */}
      <div className={card}>
        <input
          type="text"
          placeholder="🔍 Search blogs by title or category..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className={input}
        />
      </div>

      {/* Blog List */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <AnimatePresence>
          {filtered.map((blog, i) => (
            <motion.div
              key={blog.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: i * 0.05 }}
              className={`${card} flex flex-col gap-3`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{blog.emoji}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${darkMode ? 'bg-indigo-900/60 text-indigo-300' : 'bg-indigo-100 text-indigo-600'}`}>
                    {blog.category}
                  </span>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => startEdit(blog)} className="p-1.5 rounded-lg text-sm hover:bg-indigo-500/10 text-indigo-400 transition">✏️</button>
                  <button onClick={() => setDeleteId(blog.id)} className="p-1.5 rounded-lg text-sm hover:bg-red-500/10 text-red-400 transition">🗑️</button>
                </div>
              </div>
              <h3 className={`text-sm font-bold leading-snug ${darkMode ? 'text-white' : 'text-gray-900'}`}>{blog.title}</h3>
              <p className={`text-xs leading-relaxed line-clamp-2 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>{blog.summary}</p>
              <div className={`flex items-center justify-between text-xs pt-2 border-t ${darkMode ? 'border-white/5 text-slate-500' : 'border-gray-100 text-gray-400'}`}>
                <span>✍️ {blog.author}</span>
                <span>{blog.readTime}</span>
              </div>
              <p className={`text-xs ${darkMode ? 'text-slate-600' : 'text-gray-400'}`}>{blog.date}</p>
            </motion.div>
          ))}
        </AnimatePresence>

        {filtered.length === 0 && (
          <div className={`col-span-3 text-center py-16 ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>
            <p className="text-4xl mb-3">📭</p>
            <p>No blogs found</p>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
            onClick={() => setShowForm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              className={`w-full max-w-2xl rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto ${darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}
            >
              <h2 className="text-lg font-bold mb-5">{editId ? '✏️ Edit Blog' : '➕ New Blog'}</h2>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={`text-xs font-medium mb-1 block ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Emoji</label>
                    <input className={input} value={form.emoji} onChange={e => setForm(f => ({...f, emoji: e.target.value}))} placeholder="🗳️" />
                  </div>
                  <div>
                    <label className={`text-xs font-medium mb-1 block ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Category</label>
                    <select className={input} value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value}))}>
                      {categories.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className={`text-xs font-medium mb-1 block ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Title *</label>
                  <input className={input} value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} placeholder="Blog title..." />
                </div>
                <div>
                  <label className={`text-xs font-medium mb-1 block ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Summary *</label>
                  <textarea rows={2} className={input} value={form.summary} onChange={e => setForm(f => ({...f, summary: e.target.value}))} placeholder="Short description..." />
                </div>
                <div>
                  <label className={`text-xs font-medium mb-1 block ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Content</label>
                  <textarea rows={6} className={input} value={form.content} onChange={e => setForm(f => ({...f, content: e.target.value}))} placeholder="Full article content..." />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className={`text-xs font-medium mb-1 block ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Author</label>
                    <input className={input} value={form.author} onChange={e => setForm(f => ({...f, author: e.target.value}))} />
                  </div>
                  <div>
                    <label className={`text-xs font-medium mb-1 block ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Date</label>
                    <input className={input} value={form.date} onChange={e => setForm(f => ({...f, date: e.target.value}))} placeholder="June 20, 2026" />
                  </div>
                  <div>
                    <label className={`text-xs font-medium mb-1 block ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Read Time</label>
                    <input className={input} value={form.readTime} onChange={e => setForm(f => ({...f, readTime: e.target.value}))} placeholder="5 min read" />
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={save} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl font-semibold text-sm transition">
                  {editId ? '💾 Save Changes' : '➕ Add Blog'}
                </button>
                <button onClick={() => setShowForm(false)} className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition ${darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirm Modal */}
      <AnimatePresence>
        {deleteId && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className={`w-full max-w-sm rounded-2xl p-6 shadow-2xl text-center ${darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}
            >
              <p className="text-4xl mb-3">🗑️</p>
              <h3 className="text-lg font-bold mb-2">Delete Blog?</h3>
              <p className={`text-sm mb-6 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>This action cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={confirmDelete} className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-xl font-semibold text-sm transition">Delete</button>
                <button onClick={() => setDeleteId(null)} className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition ${darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>Cancel</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
