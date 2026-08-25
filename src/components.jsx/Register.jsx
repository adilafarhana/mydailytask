import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../utils/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [designation, setDesignation] = useState('Developer');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== passwordConfirmation) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      await register(name, email, password, passwordConfirmation, designation);
      navigate('/daily-logs');
    } catch (err) {
      console.error('Registration error:', err);
      let msg = 'Failed to create account. Please check your inputs.';
      if (err.response?.data?.errors) {
        msg = Object.values(err.response.data.errors).flat().join(', ');
      } else if (err.response?.data?.message) {
        msg = err.response.data.message;
      }
      setError(msg);
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
          <svg width="130" height="115" viewBox="0 0 200 180" fill="none">
            <rect x="50" y="30" width="100" height="130" rx="12" fill="#fff7ed" stroke="#fed7aa" strokeWidth="3" />
            <rect x="75" y="20" width="50" height="16" rx="6" fill="#ff7a00" />
            <circle cx="50" cy="50" r="22" fill="#fff" stroke="#ff7a00" strokeWidth="4" />
            <path d="M50 38 V50 H58" stroke="#ff7a00" strokeWidth="4" strokeLinecap="round" />
            <rect x="125" y="55" width="45" height="45" rx="8" fill="#ff7a00" />
            <circle cx="137" cy="70" r="3" fill="#fff" />
            <circle cx="148" cy="70" r="3" fill="#fff" />
            <circle cx="159" cy="70" r="3" fill="#fff" />
            <circle cx="137" cy="85" r="3" fill="#fff" />
            <circle cx="148" cy="85" r="3" fill="#fff" />
            <circle cx="159" cy="85" r="3" fill="#fff" />
            <path d="M40 140 L70 110 L80 120 L50 150 Z" fill="#ff7a00" />
            <line x1="70" y1="70" x2="115" y2="70" stroke="#ff7a00" strokeWidth="4" strokeLinecap="round" />
            <line x1="70" y1="95" x2="115" y2="95" stroke="#ff7a00" strokeWidth="4" strokeLinecap="round" />
            <line x1="70" y1="120" x2="115" y2="120" stroke="#ff7a00" strokeWidth="4" strokeLinecap="round" />
          </svg>
        </div>

        {/* Title */}
        <h2 style={styles.welcomeHeading}>Create Account</h2>

        {error && <div style={styles.errorAlert}>{error}</div>}

        {/* Register Form */}
        <form onSubmit={handleSubmit} style={styles.formGroup}>
          <div style={styles.inputWrapper}>
            <span style={styles.inputIcon}>👤</span>
            <input
              type="text"
              required
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={styles.inputField}
            />
          </div>

          <div style={styles.inputWrapper}>
            <span style={styles.inputIcon}>✉️</span>
            <input
              type="email"
              required
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.inputField}
            />
          </div>

          <div style={styles.inputWrapper}>
            <span style={styles.inputIcon}>💼</span>
            <select
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
              style={styles.selectField}
            >
              <option value="Developer">Software Developer</option>
              <option value="Designer">UI/UX Designer</option>
              <option value="Engineer">Software Engineer</option>
              <option value="Frontend Developer">Frontend Developer</option>
              <option value="Backend Developer">Backend Developer</option>
              <option value="Full Stack Developer">Full Stack Developer</option>
              <option value="Product Engineer">Product Engineer</option>
            </select>
          </div>

          <div style={styles.inputWrapper}>
            <span style={styles.inputIcon}>🔒</span>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              placeholder="Password (Min 6 chars)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.inputField}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={styles.eyeBtn}
            >
              👁️
            </button>
          </div>

          <div style={styles.inputWrapper}>
            <span style={styles.inputIcon}>🔒</span>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              placeholder="Confirm Password"
              value={passwordConfirmation}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
              style={styles.inputField}
            />
          </div>

          <button type="submit" disabled={loading} style={styles.signInBtn}>
            {loading ? 'Creating Account...' : 'Register Account'}
          </button>
        </form>

        {/* Sign In Navigation link */}
        <div style={{ margin: '0.75rem 0', textAlign: 'center' }}>
          <span style={{ fontSize: '0.82rem', color: '#64748b' }}>Already have an account? </span>
          <Link to="/login" style={styles.signUpLink}>
            Sign In
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
    maxWidth: '400px',
    backgroundColor: '#ffffff',
    borderRadius: '32px',
    padding: '2rem 1.75rem 1.5rem 1.75rem',
    boxShadow: '0 20px 40px rgba(255, 122, 0, 0.1), 0 4px 12px rgba(0,0,0,0.03)',
    border: '2px solid #ffedd5',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  illustrationWrapper: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '0.25rem',
  },
  welcomeHeading: {
    margin: '0.25rem 0 1rem 0',
    fontSize: '1.8rem',
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
    gap: '0.75rem',
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
    fontSize: '0.95rem',
    color: '#64748b',
    pointerEvents: 'none',
  },
  inputField: {
    width: '100%',
    padding: '0.7rem 2.4rem 0.7rem 2.5rem',
    borderRadius: '14px',
    border: '1.5px solid #d1d5db',
    fontSize: '0.88rem',
    fontWeight: '600',
    color: '#1e293b',
    outline: 'none',
    boxSizing: 'border-box',
    backgroundColor: '#ffffff',
  },
  selectField: {
    width: '100%',
    padding: '0.7rem 1rem 0.7rem 2.5rem',
    borderRadius: '14px',
    border: '1.5px solid #d1d5db',
    fontSize: '0.88rem',
    fontWeight: '700',
    color: '#1e293b',
    outline: 'none',
    boxSizing: 'border-box',
    backgroundColor: '#ffffff',
    cursor: 'pointer',
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
  signInBtn: {
    width: '100%',
    backgroundColor: '#ff7a00',
    color: '#ffffff',
    border: 'none',
    padding: '0.8rem',
    borderRadius: '14px',
    fontWeight: '900',
    fontSize: '0.98rem',
    cursor: 'pointer',
    marginTop: '0.5rem',
    boxShadow: '0 6px 18px rgba(255, 122, 0, 0.35)',
  },
  signUpLink: {
    color: '#ff7a00',
    fontWeight: '900',
    fontSize: '0.85rem',
    textDecoration: 'none',
  },
  footerInfoBox: {
    marginTop: '1.25rem',
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
