import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import DarkModeToggle from './DarkModeToggle.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { darkMode, setDarkMode } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setProfileOpen(false);
    setMenuOpen(false);
    navigate('/');
  };

  // Active link highlight
  const linkClass = (path) =>
    `px-3 py-1.5 rounded-lg text-sm font-medium transition ${
      location.pathname === path
        ? 'bg-white text-indigo-700'
        : 'text-white hover:bg-indigo-600'
    }`;

  // User initials avatar
  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '';

  return (
    <nav className="bg-indigo-700 shadow-md">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 text-white font-bold text-xl">
          <span className="text-2xl">🗳️</span>
          <span className="tracking-wide">VoteApp</span>
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center gap-1">
          <Link to="/" className={linkClass('/')}>Home</Link>

          {/* Normal user: Vote + Results */}
          {(!user || !user.isAdmin) && (
            <>
              <Link to="/dashboard" className={linkClass('/dashboard')}>Vote</Link>
              <Link to="/dashboard" className={linkClass('/results')}>Results</Link>
            </>
          )}

          {/* Admin: Admin Panel link */}
          {user?.isAdmin && (
            <Link to="/admin" className={linkClass('/admin')}>⚙️ Admin Panel</Link>
          )}
        </div>

        {/* Right Side — Desktop */}
        <div className="hidden md:flex items-center gap-3">

          {/* Dark/Light Mode Toggle */}
          <DarkModeToggle size="sm" />
          {user ? (
            <div className="relative">
              {/* Profile Button */}
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg transition"
              >
                <span className="w-7 h-7 rounded-full bg-white text-indigo-700 font-bold text-xs flex items-center justify-center">
                  {initials}
                </span>
                <span className="text-sm font-medium">{user.name}</span>
                <svg className={`w-4 h-4 transition-transform ${profileOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown */}
              {profileOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg py-1 z-50 border border-gray-100">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-800">{user.name}</p>
                    <p className="text-xs text-gray-400">{user.email}</p>
                    {user.isAdmin && (
                      <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full font-medium">Admin</span>
                    )}
                  </div>

                  {/* Normal user dropdown items */}
                  {!user.isAdmin && (
                    <Link
                      to="/dashboard"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 transition"
                    >
                      <span>🗳️</span> My Votes
                    </Link>
                  )}

                  {/* Admin dropdown items */}
                  {user.isAdmin && (
                    <Link
                      to="/admin"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 transition"
                    >
                      <span>⚙️</span> Admin Panel
                    </Link>
                  )}

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition"
                  >
                    <span>🚪</span> Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/auth"
              className="bg-white text-indigo-700 px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-indigo-100 transition"
            >
              Login / Register
            </Link>
          )}
        </div>

        {/* Mobile Hamburger */}
        <button
          className="md:hidden text-white focus:outline-none"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {menuOpen
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            }
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-indigo-800 px-4 pb-4 space-y-1">
          <Link to="/" onClick={() => setMenuOpen(false)} className="block text-white py-2 px-3 rounded-lg hover:bg-indigo-600 text-sm">
            🏠 Home
          </Link>

          {/* Normal user mobile links */}
          {(!user || !user.isAdmin) && (
            <>
              <Link to="/dashboard" onClick={() => setMenuOpen(false)} className="block text-white py-2 px-3 rounded-lg hover:bg-indigo-600 text-sm">
                🗳️ Vote
              </Link>
              <Link to="/dashboard" onClick={() => setMenuOpen(false)} className="block text-white py-2 px-3 rounded-lg hover:bg-indigo-600 text-sm">
                📊 Results
              </Link>
            </>
          )}

          {/* Admin mobile links */}
          {user?.isAdmin && (
            <Link to="/admin" onClick={() => setMenuOpen(false)} className="block text-white py-2 px-3 rounded-lg hover:bg-indigo-600 text-sm">
              ⚙️ Admin Panel
            </Link>
          )}

          {/* Auth section */}
          {user ? (
            <div className="border-t border-indigo-600 pt-2 mt-2">
              <p className="text-indigo-300 text-xs px-3 mb-2">{user.name} · {user.email}</p>
              {/* Dark mode toggle mobile */}
              <div className="flex items-center gap-2 py-2 px-3">
                <span className="text-white text-sm">{darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}</span>
                <DarkModeToggle size="sm" />
              </div>
              <button
                onClick={handleLogout}
                className="w-full text-left text-red-300 py-2 px-3 rounded-lg hover:bg-indigo-600 text-sm"
              >
                🚪 Logout
              </button>
            </div>
          ) : (
            <>
              {/* Dark mode toggle mobile (logged out) */}
              <div className="flex items-center gap-2 py-2 px-3">
                <span className="text-white text-sm">{darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}</span>
                <DarkModeToggle size="sm" />
              </div>
              <Link
                to="/auth"
                onClick={() => setMenuOpen(false)}
                className="block bg-white text-indigo-700 py-2 px-3 rounded-lg text-sm font-semibold text-center mt-2"
              >
                Login / Register
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
