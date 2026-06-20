import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { validateLogin } from '../utils/validators.js';

export default function Auth() {
  const [form,        setForm]        = useState({ email: '', password: '' });
  const [errors,      setErrors]      = useState({});
  const [loading,     setLoading]     = useState(false);
  const [serverError, setServerError] = useState('');
  const [successMsg,  setSuccessMsg]  = useState('');
  const [showPw,      setShowPw]      = useState(false);
  const [touched,     setTouched]     = useState({});

  const { login }  = useAuth();
  const navigate   = useNavigate();
  const location   = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('verified') === 'true')
      setSuccessMsg('✅ Email verified! You can now login.');
  }, [location]);

  const handleBlur = (field) => {
    setTouched(p => ({ ...p, [field]: true }));
    setErrors(validateLogin(form));
  };

  const handleChange = (field, value) => {
    setForm(p => ({ ...p, [field]: value }));
    if (touched[field]) setErrors(validateLogin({ ...form, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    const errs = validateLogin(form);
    setTouched({ email: true, password: true });
    if (Object.keys(errs).length) return setErrors(errs);
    setLoading(true);
    try {
      const result = await login(form.email, form.password);
      navigate(result.isAdmin ? '/admin' : '/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Invalid credentials';
      if (err.code === 'ECONNABORTED' || !err.response) {
        setServerError('⚠️ Server unreachable. Please check your connection and try again.');
      } else {
        setServerError(err.response?.status === 429 ? '⏳ Too many attempts. Please wait.' : msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0d1117 0%, #161b22 40%, #0d1117 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>

      {/* Subtle background glow */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: '20%', left: '30%',
          width: '400px', height: '400px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.08), transparent 70%)',
          filter: 'blur(40px)',
        }} />
        <div style={{
          position: 'absolute', bottom: '20%', right: '25%',
          width: '300px', height: '300px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139,92,246,0.06), transparent 70%)',
          filter: 'blur(40px)',
        }} />
      </div>

      <div style={{ width: '100%', maxWidth: '380px', position: 'relative', zIndex: 1 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '16px',
            background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '26px', margin: '0 auto 0.75rem',
            boxShadow: '0 8px 32px rgba(99,102,241,0.35)',
          }}>🗳️</div>
          <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>Online Voting System</p>
        </div>

        {/* Form card — Uiverse style */}
        <form onSubmit={handleSubmit} noValidate style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          paddingLeft: '2em',
          paddingRight: '2em',
          paddingBottom: '0.4em',
          backgroundColor: '#1e2433',
          borderRadius: '25px',
          transition: '0.4s ease-in-out',
          boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(99,102,241,0.1)',
          border: '1px solid transparent',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'scale(1.03)';
          e.currentTarget.style.border = '1px solid rgba(99,102,241,0.3)';
          e.currentTarget.style.boxShadow = '0 24px 70px rgba(0,0,0,0.7), 0 0 30px rgba(99,102,241,0.1)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.border = '1px solid transparent';
          e.currentTarget.style.boxShadow = '0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(99,102,241,0.1)';
        }}>

          {/* Heading */}
          <div id="heading" style={{
            textAlign: 'center',
            margin: '2em 0 0.5em',
            color: '#ffffff',
            fontSize: '1.3em',
            fontWeight: 700,
            letterSpacing: '-0.02em',
          }}>
            Welcome Back
            <p style={{ fontSize: '0.6em', color: '#64748b', fontWeight: 400, marginTop: '4px' }}>
              Sign in to cast your vote
            </p>
          </div>

          {/* Success */}
          {successMsg && (
            <div style={{
              padding: '0.6em 1em', borderRadius: '12px', fontSize: '12px',
              background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)',
              color: '#6ee7b7', textAlign: 'center',
            }}>{successMsg}</div>
          )}

          {/* Server error */}
          {serverError && (
            <div style={{
              padding: '0.6em 1em', borderRadius: '12px', fontSize: '12px',
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
              color: '#fca5a5', textAlign: 'center',
            }}>⚠️ {serverError}</div>
          )}

          {/* Email field */}
          <div className="field" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5em',
            borderRadius: '25px',
            padding: '0.6em',
            border: touched.email && errors.email ? '1px solid rgba(239,68,68,0.4)' : 'none',
            outline: 'none',
            color: 'white',
            backgroundColor: '#141922',
            boxShadow: 'inset 2px 5px 10px rgb(5,5,5)',
          }}>
            <svg className="input-icon" style={{ height:'1.3em', width:'1.3em', fill:'white', flexShrink:0 }}
              viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
            </svg>
            <input
              type="email"
              placeholder="Email address"
              value={form.email}
              onChange={e => handleChange('email', e.target.value)}
              onBlur={() => handleBlur('email')}
              style={{
                background: 'none', border: 'none', outline: 'none',
                width: '100%', color: '#d3d3d3', fontSize: '14px',
              }}
            />
          </div>
          {touched.email && errors.email && (
            <p style={{ color:'#f87171', fontSize:'11px', margin:'-4px 0 0 12px' }}>⚠ {errors.email}</p>
          )}

          {/* Password field */}
          <div className="field" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5em',
            borderRadius: '25px',
            padding: '0.6em',
            border: touched.password && errors.password ? '1px solid rgba(239,68,68,0.4)' : 'none',
            outline: 'none',
            color: 'white',
            backgroundColor: '#141922',
            boxShadow: 'inset 2px 5px 10px rgb(5,5,5)',
          }}>
            <svg className="input-icon" style={{ height:'1.3em', width:'1.3em', fill:'white', flexShrink:0 }}
              viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
            </svg>
            <input
              type={showPw ? 'text' : 'password'}
              placeholder="Password"
              value={form.password}
              onChange={e => handleChange('password', e.target.value)}
              onBlur={() => handleBlur('password')}
              style={{
                background: 'none', border: 'none', outline: 'none',
                width: '100%', color: '#d3d3d3', fontSize: '14px',
              }}
            />
            <button type="button" onClick={() => setShowPw(!showPw)}
              style={{ background:'none', border:'none', cursor:'pointer', color:'#64748b', fontSize:'12px', padding:'0 4px' }}>
              {showPw ? '🙈' : '👁️'}
            </button>
          </div>
          {touched.password && errors.password && (
            <p style={{ color:'#f87171', fontSize:'11px', margin:'-4px 0 0 12px' }}>⚠ {errors.password}</p>
          )}

          {/* Buttons */}
          <div className="btn" style={{
            display: 'flex',
            justifyContent: 'center',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px',
            marginTop: '2em',
          }}>
            {/* Login button */}
            <button type="submit" disabled={loading}
              style={{
                width: '100%',
                padding: '0.65em',
                borderRadius: '25px',
                border: 'none',
                outline: 'none',
                transition: '0.4s ease-in-out',
                backgroundColor: loading ? '#1e1e1e' : '#252525',
                color: 'white',
                fontSize: '14px',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 15px rgba(99,102,241,0.2)',
                letterSpacing: '0.02em',
                transform: 'scale(1)',
              }}
              onMouseEnter={e => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = '#6366f1';
                  e.currentTarget.style.transform = 'scale(1.06)';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(99,102,241,0.45)';
                }
              }}
              onMouseLeave={e => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = '#252525';
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(99,102,241,0.2)';
                }
              }}
              onMouseDown={e => {
                if (!loading) {
                  e.currentTarget.style.transform = 'scale(0.96)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(99,102,241,0.3)';
                }
              }}
              onMouseUp={e => {
                if (!loading) {
                  e.currentTarget.style.transform = 'scale(1.06)';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(99,102,241,0.45)';
                }
              }}>
              {loading ? '⏳ Signing in...' : '🔐 Sign In'}
            </button>

            {/* Divider */}
            <div style={{ display:'flex', alignItems:'center', gap:'8px', width:'100%', margin:'4px 0' }}>
              <div style={{ flex:1, height:'1px', background:'rgba(255,255,255,0.06)' }} />
              <span style={{ color:'#374151', fontSize:'11px' }}>or</span>
              <div style={{ flex:1, height:'1px', background:'rgba(255,255,255,0.06)' }} />
            </div>

            {/* Back to home */}
            <Link to="/"
              style={{
                width: '100%',
                padding: '0.5em',
                borderRadius: '25px',
                border: 'none',
                outline: 'none',
                transition: '0.4s ease-in-out',
                backgroundColor: '#252525',
                color: '#94a3b8',
                fontSize: '13px',
                cursor: 'pointer',
                textAlign: 'center',
                textDecoration: 'none',
                display: 'block',
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#1a1a1a'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = '#252525'}>
              ← Back to Home
            </Link>
          </div>

          {/* Footer note */}
          <div style={{
            textAlign: 'center',
            padding: '1.5em 0 1em',
            color: '#374151',
            fontSize: '11px',
            lineHeight: '1.5',
          }}>
            Don't have an account?<br />
            <span style={{ color: '#6366f1' }}>Contact your administrator</span>
          </div>
        </form>
      </div>
    </div>
  );
}
