import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext.jsx';

const STORAGE_KEY = 'voteapp_faqs';

const defaultFAQs = [
  { id: 1, category: 'General',   question: 'What is VoteApp?',                           answer: 'VoteApp is a secure online voting platform designed for colleges, organizations, and communities.' },
  { id: 2, category: 'Voting',    question: 'How do I cast my vote?',                      answer: 'Log in, go to Vote section, select the active election, choose your candidate, and confirm.' },
  { id: 3, category: 'Voting',    question: 'Can I change my vote after submitting?',       answer: 'No. Once a vote is cast and recorded on the blockchain, it is final and cannot be changed.' },
  { id: 4, category: 'Account',   question: 'How do I create an account?',                 answer: 'Self-registration is disabled. Your account must be created by an admin. You will receive an OTP to verify.' },
  { id: 5, category: 'Account',   question: 'I forgot my password. What should I do?',     answer: 'Click "Forgot Password", enter your email, and you will receive an OTP to reset your password.' },
  { id: 6, category: 'Security',  question: 'Is my vote anonymous?',                       answer: 'Your vote is securely recorded. Admins can verify that you voted, but the specific candidate is kept confidential.' },
  { id: 7, category: 'Security',  question: 'Can the admin change votes?',                 answer: 'No. Once recorded on the blockchain, it is immutable — not even the admin can alter it.' },
  { id: 8, category: 'Results',   question: 'When are results available?',                 answer: 'Results are available in real time as votes are cast. Final results are confirmed once the election closes.' },
  { id: 9, category: 'Technical', question: 'Does VoteApp work on mobile?',                answer: 'Yes. VoteApp is fully responsive and works on smartphones, tablets, and desktops.' },
];

const categories = ['General', 'Voting', 'Account', 'Security', 'Results', 'Technical'];
const emptyForm = { category: 'General', question: '', answer: '' };

export default function ManageFAQ() {
  const { darkMode } = useTheme();
  const [faqs, setFaqs] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || defaultFAQs; } catch { return defaultFAQs; }
  });
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteId, setDeleteId] = useState(null);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('All');
  const [expanded, setExpanded] = useState(null);

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(faqs)); }, [faqs]);

  const save = () => {
    if (!form.question.trim() || !form.answer.trim()) return;
    if (editId !== null) {
      setFaqs(f => f.map(x => x.id === editId ? { ...form, id: editId } : x));
    } else {
      setFaqs(f => [...f, { ...form, id: Date.now() }]);
    }
    setShowForm(false);
    setEditId(null);
    setForm(emptyForm);
  };

  const startEdit = (faq) => { setForm({ ...faq }); setEditId(faq.id); setShowForm(true); };
  const confirmDelete = () => { setFaqs(f => f.filter(x => x.id !== deleteId)); setDeleteId(null); };

  const filtered = faqs.filter(f => {
    const matchCat = filterCat === 'All' || f.category === filterCat;
    const matchSearch = f.question.toLowerCase().includes(search.toLowerCase()) || f.answer.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  // Group by category
  const grouped = categories.reduce((acc, cat) => {
    const items = filtered.filter(f => f.category === cat);
    if (items.length) acc[cat] = items;
    return acc;
  }, {});

  const card = `rounded-2xl border ${darkMode ? 'bg-gray-800/60 border-white/10' : 'bg-white border-gray-200'}`;
  const input = `w-full px-3 py-2 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition ${darkMode ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200 text-gray-900'}`;

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>❓ Manage FAQ</h1>
          <p className={`text-sm mt-0.5 ${darkMode ? 'text-slate-500' : 'text-gray-500'}`}>{faqs.length} questions · stored locally</p>
        </div>
        <button
          onClick={() => { setForm(emptyForm); setEditId(null); setShowForm(true); }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition"
        >
          + New Question
        </button>
      </div>

      {/* Filters */}
      <div className={`${card} p-4 space-y-3`}>
        <input type="text" placeholder="🔍 Search questions..." value={search} onChange={e => setSearch(e.target.value)} className={input} />
        <div className="flex flex-wrap gap-2">
          {['All', ...categories].map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCat(cat)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                filterCat === cat
                  ? 'bg-indigo-600 text-white'
                  : darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-indigo-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* FAQ grouped list */}
      {Object.entries(grouped).map(([cat, items]) => (
        <div key={cat} className="space-y-2">
          <p className={`text-xs font-bold uppercase tracking-widest px-1 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>{cat}</p>
          <AnimatePresence>
            {items.map((faq, i) => (
              <motion.div
                key={faq.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ delay: i * 0.04 }}
                className={`${card} overflow-hidden`}
              >
                <div
                  className="flex items-center justify-between px-5 py-4 cursor-pointer"
                  onClick={() => setExpanded(expanded === faq.id ? null : faq.id)}
                >
                  <span className={`text-sm font-semibold pr-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{faq.question}</span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={e => { e.stopPropagation(); startEdit(faq); }} className="p-1.5 rounded-lg hover:bg-indigo-500/10 text-indigo-400 transition text-sm">✏️</button>
                    <button onClick={e => { e.stopPropagation(); setDeleteId(faq.id); }} className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-400 transition text-sm">🗑️</button>
                    <span className={`text-lg transition-transform ${expanded === faq.id ? 'rotate-45' : ''}`}>+</span>
                  </div>
                </div>
                <AnimatePresence>
                  {expanded === faq.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className={`px-5 pb-4 text-sm leading-relaxed ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}
                    >
                      {faq.answer}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ))}

      {filtered.length === 0 && (
        <div className={`text-center py-16 ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>
          <p className="text-4xl mb-3">🤔</p>
          <p>No questions found</p>
        </div>
      )}

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
              className={`w-full max-w-lg rounded-2xl p-6 shadow-2xl ${darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}
            >
              <h2 className="text-lg font-bold mb-5">{editId ? '✏️ Edit Question' : '➕ New Question'}</h2>
              <div className="space-y-3">
                <div>
                  <label className={`text-xs font-medium mb-1 block ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Category</label>
                  <select className={input} value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value}))}>
                    {categories.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className={`text-xs font-medium mb-1 block ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Question *</label>
                  <input className={input} value={form.question} onChange={e => setForm(f => ({...f, question: e.target.value}))} placeholder="Enter the question..." />
                </div>
                <div>
                  <label className={`text-xs font-medium mb-1 block ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Answer *</label>
                  <textarea rows={4} className={input} value={form.answer} onChange={e => setForm(f => ({...f, answer: e.target.value}))} placeholder="Enter the answer..." />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={save} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl font-semibold text-sm transition">
                  {editId ? '💾 Save Changes' : '➕ Add Question'}
                </button>
                <button onClick={() => setShowForm(false)} className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition ${darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirm */}
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
              <h3 className="text-lg font-bold mb-2">Delete Question?</h3>
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
