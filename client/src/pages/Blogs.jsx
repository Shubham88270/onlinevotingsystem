import React, { useState } from 'react';
import Navbar from '../components/Navbar.jsx';
import { useTheme } from '../context/ThemeContext.jsx';

const blogs = [
  {
    id: 1,
    emoji: '🗳️',
    category: 'Voting',
    title: 'Why Online Voting is the Future of Democracy',
    summary:
      'Digital voting systems are transforming how communities make decisions — making participation easier, faster, and more transparent than ever before.',
    content: `Online voting removes the barriers of physical presence, long queues, and geographic restrictions. With proper authentication and blockchain-backed transparency, digital elections can be more secure than traditional paper-based systems.\n\nModern online voting platforms use end-to-end encryption, OTP verification, and immutable audit trails to ensure every vote counts and cannot be tampered with. This makes it ideal for college elections, community polls, and organizational decision-making.`,
    author: 'VoteApp Team',
    date: 'June 10, 2026',
    readTime: '4 min read',
  },
  {
    id: 2,
    emoji: '🔗',
    category: 'Blockchain',
    title: 'How Blockchain Makes Voting Tamper-Proof',
    summary:
      'Blockchain technology creates an immutable ledger of every vote cast — ensuring complete transparency and eliminating any possibility of fraud.',
    content: `Each vote is recorded as a block in a chain, cryptographically linked to the previous one. Once a vote is cast and added to the chain, it cannot be altered or deleted without detection.\n\nThis means every voter, observer, and auditor can independently verify the election results. The decentralized nature of blockchain ensures no single party has control over the outcome — making it the gold standard for trustworthy elections.`,
    author: 'Tech Team',
    date: 'June 5, 2026',
    readTime: '5 min read',
  },
  {
    id: 3,
    emoji: '🔒',
    category: 'Security',
    title: 'Top 5 Security Features in Modern Voting Systems',
    summary:
      'From OTP verification to JWT authentication, here are the key security layers that protect your vote from start to finish.',
    content: `1. **OTP Email Verification** — Every voter must verify their identity via a one-time password sent to their registered email before they can cast a vote.\n\n2. **JWT Authentication** — Secure, time-limited tokens ensure that only authenticated users can access voting endpoints.\n\n3. **Blockchain Audit Trail** — Every action is logged immutably, making post-election audits straightforward.\n\n4. **Admin Approval Flow** — New voters require admin approval before gaining access, preventing unauthorized participation.\n\n5. **Rate Limiting** — API rate limits prevent brute-force attacks and spam voting attempts.`,
    author: 'Security Team',
    date: 'May 28, 2026',
    readTime: '6 min read',
  },
  {
    id: 4,
    emoji: '📊',
    category: 'Results',
    title: 'Real-Time Election Results with Socket.io',
    summary:
      'Live vote counts update instantly as ballots are cast — no need to refresh the page. Here is how we built it.',
    content: `Using Socket.io, our platform pushes live vote updates to all connected clients the moment a vote is recorded. This means candidates, observers, and administrators see results update in real time without any manual refresh.\n\nThe server emits events on each vote, and the client listens and updates the chart data dynamically using Chart.js. This creates an engaging and transparent election experience.`,
    author: 'Dev Team',
    date: 'May 20, 2026',
    readTime: '3 min read',
  },
  {
    id: 5,
    emoji: '🎓',
    category: 'Guide',
    title: 'How to Set Up Your First Election in VoteApp',
    summary:
      'A step-by-step guide for administrators to create elections, add candidates, and manage voters on the platform.',
    content: `**Step 1** — Log in with your admin credentials and navigate to the Admin Panel.\n\n**Step 2** — Go to "Manage Elections" and click "Create Election". Fill in the title, description, start date, and end date.\n\n**Step 3** — Add candidates to the election with their names, photos, and party/position details.\n\n**Step 4** — Register voters under "Manage Users". Each voter will receive an OTP to verify their identity.\n\n**Step 5** — Activate the election. Voters can now log in and cast their ballots. Monitor live results from the dashboard.`,
    author: 'VoteApp Team',
    date: 'May 15, 2026',
    readTime: '5 min read',
  },
  {
    id: 6,
    emoji: '🌐',
    category: 'Accessibility',
    title: 'Making Voting Accessible for Everyone',
    summary:
      'Inclusive design principles that ensure every eligible voter can participate regardless of their device or ability.',
    content: `VoteApp is designed with accessibility at its core. The platform works seamlessly on mobile phones, tablets, and desktops — so voters can cast their ballot from any device.\n\nDark mode support reduces eye strain for users in low-light environments. Large, clearly labeled buttons and high-contrast text ensure readability. Future updates will include screen reader support and multiple language options to reach even more voters.`,
    author: 'Design Team',
    date: 'May 8, 2026',
    readTime: '4 min read',
  },
];

const categories = ['All', 'Voting', 'Blockchain', 'Security', 'Results', 'Guide', 'Accessibility'];

export default function Blogs() {
  const { darkMode } = useTheme();
  const [selected, setSelected] = useState(null);
  const [activeCategory, setActiveCategory] = useState('All');

  const filtered = activeCategory === 'All'
    ? blogs
    : blogs.filter(b => b.category === activeCategory);

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <Navbar />

      {/* Hero */}
      <div className="bg-indigo-700 text-white py-16 px-4 text-center">
        <h1 className="text-4xl font-bold mb-3">📝 VoteApp Blog</h1>
        <p className="text-indigo-200 text-lg max-w-xl mx-auto">
          Insights on digital voting, blockchain security, and election technology.
        </p>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10">

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-8 justify-center">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
                activeCategory === cat
                  ? 'bg-indigo-600 text-white'
                  : darkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-white text-gray-600 hover:bg-indigo-50 border border-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Blog Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(blog => (
            <div
              key={blog.id}
              onClick={() => setSelected(blog)}
              className={`cursor-pointer rounded-2xl p-6 shadow-md hover:shadow-xl transition-all hover:-translate-y-1 ${
                darkMode ? 'bg-gray-800 hover:bg-gray-750' : 'bg-white hover:bg-indigo-50'
              }`}
            >
              <div className="text-4xl mb-3">{blog.emoji}</div>
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                darkMode ? 'bg-indigo-900 text-indigo-300' : 'bg-indigo-100 text-indigo-600'
              }`}>
                {blog.category}
              </span>
              <h2 className="text-lg font-bold mt-3 mb-2 leading-snug">{blog.title}</h2>
              <p className={`text-sm leading-relaxed mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {blog.summary}
              </p>
              <div className={`flex items-center justify-between text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                <span>✍️ {blog.author}</span>
                <span>{blog.readTime}</span>
              </div>
              <p className={`text-xs mt-1 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>{blog.date}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Blog Detail Modal */}
      {selected && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className={`max-w-2xl w-full rounded-2xl p-8 shadow-2xl max-h-[85vh] overflow-y-auto ${
              darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
            }`}
            onClick={e => e.stopPropagation()}
          >
            <div className="text-5xl mb-4 text-center">{selected.emoji}</div>
            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
              darkMode ? 'bg-indigo-900 text-indigo-300' : 'bg-indigo-100 text-indigo-600'
            }`}>
              {selected.category}
            </span>
            <h2 className="text-2xl font-bold mt-3 mb-2">{selected.title}</h2>
            <div className={`flex gap-4 text-xs mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              <span>✍️ {selected.author}</span>
              <span>📅 {selected.date}</span>
              <span>⏱ {selected.readTime}</span>
            </div>
            <div className={`text-sm leading-7 whitespace-pre-line ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              {selected.content}
            </div>
            <button
              onClick={() => setSelected(null)}
              className="mt-8 w-full bg-indigo-600 text-white py-2.5 rounded-xl font-semibold hover:bg-indigo-700 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
