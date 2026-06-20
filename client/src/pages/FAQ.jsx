import React, { useState } from 'react';
import Navbar from '../components/Navbar.jsx';
import { useTheme } from '../context/ThemeContext.jsx';

const faqs = [
  {
    category: 'General',
    items: [
      {
        q: 'What is VoteApp?',
        a: 'VoteApp is a secure online voting platform designed for colleges, organizations, and communities. It allows admins to create elections and voters to cast ballots digitally — with full transparency and blockchain-backed audit trails.',
      },
      {
        q: 'Is VoteApp free to use?',
        a: 'Yes, VoteApp is free for educational and organizational use. The platform is hosted on Vercel and uses MongoDB Atlas for data storage.',
      },
      {
        q: 'Who can use VoteApp?',
        a: 'Any organization, college, or community that needs a secure and transparent voting system. Admins manage elections and voters; eligible voters are registered and approved by the admin.',
      },
    ],
  },
  {
    category: 'Voting',
    items: [
      {
        q: 'How do I cast my vote?',
        a: 'Log in with your registered credentials, go to the Vote section, select the active election, choose your candidate, and confirm your vote. You will receive a confirmation once your vote is recorded.',
      },
      {
        q: 'Can I change my vote after submitting?',
        a: 'No. Once a vote is cast and recorded on the blockchain, it is final and cannot be changed or deleted. This ensures the integrity of the election.',
      },
      {
        q: 'Can I vote more than once?',
        a: 'No. The system ensures each voter can only vote once per election. Any attempt to vote again will be blocked automatically.',
      },
      {
        q: 'What happens if I miss the voting deadline?',
        a: 'Elections close automatically at the set end date and time. Votes cannot be cast after the deadline. Make sure to vote before the election ends.',
      },
    ],
  },
  {
    category: 'Account & Registration',
    items: [
      {
        q: 'How do I create an account?',
        a: 'Self-registration is disabled for security reasons. Your account must be created by an admin. You will receive an OTP on your email to verify your identity before you can log in.',
      },
      {
        q: 'I forgot my password. What should I do?',
        a: 'Click "Forgot Password" on the login page, enter your registered email, and you will receive an OTP. Use the OTP to reset your password.',
      },
      {
        q: 'Why is my account pending approval?',
        a: 'All new voter accounts require admin approval before access is granted. This ensures only eligible voters participate. Contact your administrator if approval is taking too long.',
      },
      {
        q: 'I did not receive the OTP email. What should I do?',
        a: 'Check your spam/junk folder first. If it is not there, use the "Resend OTP" option. Make sure the email address you registered with is correct.',
      },
    ],
  },
  {
    category: 'Security & Privacy',
    items: [
      {
        q: 'Is my vote anonymous?',
        a: 'Your vote is securely recorded and linked to your voter ID for audit purposes. Admins can verify that you voted, but the specific candidate you chose is kept confidential in the results display.',
      },
      {
        q: 'How is the platform secured against fraud?',
        a: 'VoteApp uses multiple security layers: OTP email verification, JWT authentication, admin approval workflow, blockchain audit trails, and rate limiting on all API endpoints.',
      },
      {
        q: 'Can the admin change votes?',
        a: 'No. Once a vote is recorded on the blockchain, it is immutable — not even the admin can alter it. The blockchain explorer is publicly visible for full transparency.',
      },
      {
        q: 'Is my personal data safe?',
        a: 'Yes. Passwords are hashed using bcrypt and never stored in plain text. All API communication uses HTTPS. Personal data is only used for authentication and election management.',
      },
    ],
  },
  {
    category: 'Results & Transparency',
    items: [
      {
        q: 'When are results available?',
        a: 'Results are available in real time as votes are cast. You can view live vote counts from the Results section. Final results are confirmed once the election closes.',
      },
      {
        q: 'How can I verify the election results?',
        a: 'Use the Blockchain Explorer to view the complete audit trail of all votes. Each vote is recorded as an immutable block, giving you full transparency to verify the outcome independently.',
      },
      {
        q: 'What is the Blockchain Explorer?',
        a: 'The Blockchain Explorer is a built-in tool that shows the complete chain of all recorded votes. Each block contains a hash, timestamp, and vote data — proving the election has not been tampered with.',
      },
    ],
  },
  {
    category: 'Technical',
    items: [
      {
        q: 'Which browsers are supported?',
        a: 'VoteApp works on all modern browsers — Chrome, Firefox, Edge, Safari, and mobile browsers. We recommend using the latest version for the best experience.',
      },
      {
        q: 'Does VoteApp work on mobile?',
        a: 'Yes. VoteApp is fully responsive and works smoothly on smartphones and tablets. You can vote from any device with an internet connection.',
      },
      {
        q: 'What technology powers VoteApp?',
        a: 'VoteApp is built with React (frontend), Node.js + Express (backend), MongoDB (database), Socket.io (real-time updates), and a custom blockchain implementation for vote integrity.',
      },
    ],
  },
];

export default function FAQ() {
  const { darkMode } = useTheme();
  const [openIndex, setOpenIndex] = useState(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');

  const categories = ['All', ...faqs.map(f => f.category)];

  const toggle = (key) => setOpenIndex(openIndex === key ? null : key);

  const filteredFaqs = faqs
    .filter(section => activeCategory === 'All' || section.category === activeCategory)
    .map(section => ({
      ...section,
      items: section.items.filter(
        item =>
          search === '' ||
          item.q.toLowerCase().includes(search.toLowerCase()) ||
          item.a.toLowerCase().includes(search.toLowerCase())
      ),
    }))
    .filter(section => section.items.length > 0);

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <Navbar />

      {/* Hero */}
      <div className="bg-indigo-700 text-white py-16 px-4 text-center">
        <h1 className="text-4xl font-bold mb-3">❓ Frequently Asked Questions</h1>
        <p className="text-indigo-200 text-lg max-w-xl mx-auto">
          Everything you need to know about VoteApp — voting, security, accounts, and more.
        </p>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10">

        {/* Search */}
        <div className="relative mb-6">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          <input
            type="text"
            placeholder="Search questions..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-indigo-400 transition ${
              darkMode
                ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
            }`}
          />
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-8">
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

        {/* FAQ Sections */}
        {filteredFaqs.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-5xl mb-4">🤔</p>
            <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              No results found for "{search}"
            </p>
          </div>
        ) : (
          filteredFaqs.map((section) => (
            <div key={section.category} className="mb-8">
              <h2 className={`text-sm font-bold uppercase tracking-widest mb-3 ${
                darkMode ? 'text-indigo-400' : 'text-indigo-600'
              }`}>
                {section.category}
              </h2>
              <div className="space-y-2">
                {section.items.map((item, idx) => {
                  const key = `${section.category}-${idx}`;
                  const isOpen = openIndex === key;
                  return (
                    <div
                      key={key}
                      className={`rounded-xl overflow-hidden border transition-all ${
                        darkMode
                          ? isOpen ? 'border-indigo-500 bg-gray-800' : 'border-gray-700 bg-gray-800'
                          : isOpen ? 'border-indigo-300 bg-white' : 'border-gray-200 bg-white'
                      }`}
                    >
                      <button
                        onClick={() => toggle(key)}
                        className="w-full flex items-center justify-between px-5 py-4 text-left"
                      >
                        <span className="text-sm font-semibold pr-4">{item.q}</span>
                        <span className={`text-xl transition-transform flex-shrink-0 ${isOpen ? 'rotate-45' : ''}`}>
                          +
                        </span>
                      </button>
                      {isOpen && (
                        <div className={`px-5 pb-5 text-sm leading-relaxed ${
                          darkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {item.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}

        {/* Contact CTA */}
        <div className={`mt-12 rounded-2xl p-8 text-center ${
          darkMode ? 'bg-gray-800' : 'bg-indigo-50'
        }`}>
          <p className="text-3xl mb-3">💬</p>
          <h3 className="text-lg font-bold mb-2">Still have questions?</h3>
          <p className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Can't find what you're looking for? Reach out to your administrator or contact us.
          </p>
          <a
            href="mailto:dashrathprasadpatel3@gmail.com"
            className="inline-block bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition"
          >
            📧 Contact Support
          </a>
        </div>
      </div>
    </div>
  );
}
