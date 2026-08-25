import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../utils/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/daily-logs');
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.outerCanvas}>
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={styles.mobilePhoneCard}
      >
        {/* Header Illustration Vector (Orange Clipboard, Clock, Calendar) */}
        <div style={styles.illustrationWrapper}>
          <svg width="150" height="135" viewBox="0 0 200 180" fill="none">
            {/* Clipboard background */}
            <rect x="50" y="30" width="100" height="130" rx="12" fill="#fff7ed" stroke="#fed7aa" strokeWidth="3" />
            <rect x="75" y="20" width="50" height="16" rx="6" fill="#ff7a00" />
            
            {/* Clock circle */}
            <circle cx="50" cy="50" r="22" fill="#fff" stroke="#ff7a00" strokeWidth="4" />
            <path d="M50 38 V50 H58" stroke="#ff7a00" strokeWidth="4" strokeLinecap="round" />
            
            {/* Calendar widget */}
            <rect x="125" y="55" width="45" height="45" rx="8" fill="#ff7a00" />
            <circle cx="137" cy="70" r="3" fill="#fff" />
            <circle cx="148" cy="70" r="3" fill="#fff" />
            <circle cx="159" cy="70" r="3" fill="#fff" />
            <circle cx="137" cy="85" r="3" fill="#fff" />
            <circle cx="148" cy="85" r="3" fill="#fff" />
            <circle cx="159" cy="85" r="3" fill="#fff" />
            
            {/* Pencil */}
            <path d="M40 140 L70 110 L80 120 L50 150 Z" fill="#ff7a00" />
            
            {/* Checklist lines */}
            <line x1="70" y1="70" x2="115" y2="70" stroke="#ff7a00" strokeWidth="4" strokeLinecap="round" />
            <line x1="70" y1="95" x2="115" y2="95" stroke="#ff7a00" strokeWidth="4" strokeLinecap="round" />
            <line x1="70" y1="120" x2="115" y2="120" stroke="#ff7a00" strokeWidth="4" strokeLinecap="round" />
          </svg>
        </div>

        {/* Title */}
        <h2 style={styles.welcomeHeading}>Welcome</h2>

        {error && <div style={styles.errorAlert}>{error}</div>}

        {/* Sign In Form */}
        <form onSubmit={handleSubmit} style={styles.formGroup}>
          <div style={styles.inputWrapper}>
            <span style={styles.inputIcon}>👤</span>
            <input
              type="email"
              required
              placeholder="Username or Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.inputField}
            />
          </div>

          <div style={styles.inputWrapper}>
            <span style={styles.inputIcon}>🔒</span>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.inputField}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={styles.eyeBtn}
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              👁️
            </button>
          </div>

          <div style={{ textAlign: 'right', width: '100%', marginTop: '2px' }}>
            <span
              onClick={() => alert('Please contact administrator to reset password.')}
              style={styles.forgotPassText}
            >
              Forgot Password?
            </span>
          </div>

          <button type="submit" disabled={loading} style={styles.signInBtn}>
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        {/* Sign Up Navigation link */}
        <div style={{ margin: '0.75rem 0', textAlign: 'center' }}>
          <span style={{ fontSize: '0.82rem', color: '#64748b' }}>Don't have an account? </span>
          <Link to="/register" style={styles.signUpLink}>
            Create Account
          </Link>
        </div>

        {/* Footer info matching screenshot */}
        <div style={styles.footerInfoBox}>
          <span style={styles.footerVersion}>Version 1.0.0</span>
          <span style={styles.footerDevBy}>Developed By</span>
          <strong style={styles.footerBrand}>Logic Research Labs</strong>
        </div>
      </motion.div>
    </div>
  );
}

const styles = {
  outerCanvas: {
    minHeight: '100vh',
    backgroundColor: '#fffcf7',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '1.5rem',
    fontFamily: "'Outfit', 'Inter', system-ui, sans-serif",
    boxSizing: 'border-box',
    color: '#1e293b',
  },
  mobilePhoneCard: {
    width: '100%',
    maxWidth: '380px',
    backgroundColor: '#ffffff',
    borderRadius: '32px',
    padding: '2.25rem 1.75rem 1.75rem 1.75rem',
    boxShadow: '0 20px 40px rgba(255, 122, 0, 0.1), 0 4px 12px rgba(0,0,0,0.03)',
    border: '2px solid #ffedd5',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  illustrationWrapper: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '0.5rem',
  },
  welcomeHeading: {
    margin: '0.25rem 0 1.25rem 0',
    fontSize: '2rem',
    fontWeight: '900',
    color: '#431407',
    textAlign: 'center',
    letterSpacing: '-0.5px',
  },
  errorAlert: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
    padding: '0.65rem 0.85rem',
    borderRadius: '12px',
    fontSize: '0.8rem',
    fontWeight: '700',
    textAlign: 'center',
    width: '100%',
    boxSizing: 'border-box',
    marginBottom: '0.75rem',
  },
  formGroup: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.85rem',
    alignItems: 'center',
  },
  inputWrapper: {
    width: '100%',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    boxSizing: 'border-box',
  },
  inputIcon: {
    position: 'absolute',
    left: '14px',
    fontSize: '1rem',
    color: '#64748b',
    pointerEvents: 'none',
  },
  inputField: {
    width: '100%',
    padding: '0.75rem 2.4rem 0.75rem 2.6rem',
    borderRadius: '14px',
    border: '1.5px solid #d1d5db',
    fontSize: '0.9rem',
    fontWeight: '600',
    color: '#1e293b',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s ease',
    backgroundColor: '#ffffff',
  },
  eyeBtn: {
    position: 'absolute',
    right: '12px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.9rem',
    opacity: 0.7,
  },
  forgotPassText: {
    fontSize: '0.75rem',
    color: '#525252',
    cursor: 'pointer',
    fontWeight: '600',
    textDecoration: 'none',
  },
  signInBtn: {
    width: '100%',
    backgroundColor: '#ff7a00',
    color: '#ffffff',
    border: 'none',
    padding: '0.85rem',
    borderRadius: '14px',
    fontWeight: '900',
    fontSize: '1rem',
    cursor: 'pointer',
    marginTop: '0.5rem',
    boxShadow: '0 6px 18px rgba(255, 122, 0, 0.35)',
    transition: 'transform 0.15s ease, background-color 0.2s ease',
  },
  signUpLink: {
    color: '#ff7a00',
    fontWeight: '900',
    fontSize: '0.85rem',
    textDecoration: 'none',
  },
  footerInfoBox: {
    marginTop: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px',
  },
  footerVersion: {
    fontSize: '0.7rem',
    color: '#737373',
    fontWeight: '600',
  },
  footerDevBy: {
    fontSize: '0.68rem',
    color: '#a3a3a3',
    fontWeight: '500',
  },
  footerBrand: {
    fontSize: '0.78rem',
    color: '#404040',
    fontWeight: '900',
  },
};
