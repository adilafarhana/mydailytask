import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CountdownTimerWidget from './CountdownTimerWidget';
import UnifiedTaskManager from './UnifiedTaskManager';
import MonthlyCalendarView from './MonthlyCalendarView';
import apiClient from '../utils/apiClient';

const INSPIRATIONAL_QUOTES = [
  { text: "Consistency is what transforms average into excellence.", author: "Anonymous" },
  { text: "Small daily improvements over time lead to stunning results.", author: "Robin Sharma" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
  { text: "Focus on being productive instead of busy.", author: "Tim Ferriss" },
];

export default function DailyLogDashboard() {
  const [user, setUser] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('All');
  
  // Shared global calendar date state (defaults to Today)
  const todayIsoStr = new Date().toISOString().split('T')[0];
  const [selectedDateStr, setSelectedDateStr] = useState(todayIsoStr);
  const [filterBySelectedDate, setFilterBySelectedDate] = useState(true);

  const [quoteIndex, setQuoteIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Modal Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLog, setEditingLog] = useState(null);
  const [formData, setFormData] = useState({
    log_date: new Date().toISOString().split('T')[0],
    hours_coding: 3.5,
    hours_dsa: 1.5,
    hours_interview: 1.0,
    hours_content: 1.0,
    confidence_score: 5,
    journal_text: '',
  });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const nextQuote = () => {
    setQuoteIndex((prev) => (prev + 1) % INSPIRATIONAL_QUOTES.length);
  };

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      try {
        const userRes = await apiClient.get('/user-profile');
        if (userRes.data.user) setUser(userRes.data.user);
      } catch (e1) {}

      let logsRes;
      try {
        logsRes = await apiClient.get('/daily-tasks');
      } catch (e1) {}
      const logsData = logsRes?.data || { data: [] };
      if (logsData.data && Array.isArray(logsData.data)) {
        setLogs(logsData.data);
      }
    } catch (err) {
      console.error('API Load Error:', err);
      setError('Could not connect to backend server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleOpenModal = (log = null) => {
    if (log) {
      setEditingLog(log);
      setFormData({
        log_date: log.log_date ? log.log_date.split('T')[0] : new Date().toISOString().split('T')[0],
        hours_coding: log.hours_coding || 0,
        hours_dsa: log.hours_dsa || 0,
        hours_interview: log.hours_interview || 0,
        hours_content: log.hours_content || 0,
        confidence_score: log.confidence_score || 5,
        journal_text: log.journal_text || log.journal_notes || '',
      });
    } else {
      setEditingLog(null);
      setFormData({
        log_date: selectedDateStr || new Date().toISOString().split('T')[0],
        hours_coding: 3.5,
        hours_dsa: 1.5,
        hours_interview: 1.0,
        hours_content: 1.0,
        confidence_score: 5,
        journal_text: '',
      });
    }
    setFormError('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingLog(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');

    try {
      let res;
      if (editingLog) {
        res = await apiClient.put(`/daily-tasks/${editingLog.id}`, formData);
      } else {
        res = await apiClient.post('/daily-tasks', formData);
      }

      const data = res.data;
      if (data.data) {
        if (editingLog) {
          setLogs((prev) => prev.map((l) => (l.id === editingLog.id ? data.data : l)));
        } else {
          setLogs((prev) => [data.data, ...prev]);
        }
        handleCloseModal();
      } else {
        setFormError(data.message || 'Failed to save log.');
      }
    } catch (err) {
      console.error('Error submitting form:', err);
      setFormError('Network error connecting to backend.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this activity log?')) return;

    setLogs((prev) => prev.filter((l) => l.id !== id));

    try {
      await apiClient.delete(`/daily-tasks/${id}`);
    } catch (err) {
      console.warn('Log deleted.');
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (filterBySelectedDate && selectedDateStr) {
      const logDateStr = log.log_date ? log.log_date.split('T')[0] : '';
      if (logDateStr !== selectedDateStr) return false;
    }
    if (activeCategoryFilter === 'Coding') return (log.hours_coding || 0) > 0;
    if (activeCategoryFilter === 'DSA') return (log.hours_dsa || 0) > 0;
    if (activeCategoryFilter === 'Interview') return (log.hours_interview || 0) > 0;
    return true;
  });

  const formattedDate = currentTime.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const formattedTime = currentTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const userRole = user?.role || 'Software Engineer';
  const currentQuote = INSPIRATIONAL_QUOTES[quoteIndex];

  return (
    <div style={styles.outerCanvas}>
      <div style={styles.fullScreenContainer}>
        {/* Aesthetic Navbar */}
        <header style={styles.navbar}>
          <div style={styles.brandGroup}>
            <span style={styles.brandIcon}>⚡</span>
            <div>
              <h1 style={styles.appTitle}>Portfolio & Daily Routine Tracker</h1>
              <p style={styles.appSubtitle}>Welcome back, {user ? user.name : 'User'} ({userRole})</p>
            </div>
          </div>

          <div style={styles.userActionsGroup}>
            <div style={styles.userBadge}>
              <div style={styles.userAvatar}>
                {user ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div style={styles.userTextGroup}>
                <span style={styles.userName}>{user ? user.name : 'User'}</span>
                <span style={styles.userRoleTag}>{userRole}</span>
              </div>
            </div>

            <button style={styles.logoutBtn} onClick={() => window.location.reload()}>
              Logout
            </button>
          </div>
        </header>

        {/* Aesthetic Welcome Banner Card */}
        <div style={styles.welcomeBannerCard}>
          <div style={styles.welcomeLeftCol}>
            <span style={styles.welcomeTag}>✨ DAILY PRODUCTIVITY SUITE</span>
            <h2 style={styles.welcomeHeading}>
              Welcome Home, {user ? user.name : 'Professional'}! 👋
            </h2>
            <p style={styles.welcomeSubtext}>
              Track your daily routine, master CV competencies, and level up your software engineering skills.
            </p>

            <div style={styles.quoteBox}>
              <p style={styles.quoteText}>"{currentQuote.text}"</p>
              <span style={styles.quoteAuthor}>— {currentQuote.author}</span>
            </div>
          </div>

          <div style={styles.quoteRightCol}>
            <button onClick={nextQuote} style={styles.nextQuoteBtn}>
              💡 Next Quote
            </button>
          </div>
        </div>

        {/* Medium Live Countdown Timer (Start Date: 24-08-2026) */}
        <CountdownTimerWidget />

        {/* Simple Interactive Monthly Calendar View */}
        <section style={styles.sectionContainer}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h3 style={styles.sectionTitle}>📅 Daily Task Calendar</h3>
            <span style={{ fontSize: '0.8rem', fontWeight: '800', color: '#4338ca', backgroundColor: '#e0e7ff', padding: '0.3rem 0.75rem', borderRadius: '12px' }}>
              Selected Date: {selectedDateStr}
            </span>
          </div>
          <MonthlyCalendarView
            selectedDateStr={selectedDateStr}
            onSelectDate={(date) => {
              setSelectedDateStr(date);
              setFilterBySelectedDate(true);
            }}
            dailyTasks={logs}
          />
        </section>

        {/* Single Unified Task & Skill Manager for the Selected Date */}
        <UnifiedTaskManager
          selectedDateStr={selectedDateStr}
          onSelectDate={(date) => setSelectedDateStr(date)}
        />

        {/* Daily Activity Logs Timeline */}
        <section style={styles.sectionContainer}>
          <div style={styles.reportHeaderRow}>
            <div>
              <h3 style={styles.sectionTitle}>Activity Logs & Work History</h3>
              <div style={styles.dateTimeBadgeRow}>
                <span style={styles.dateBadgePill}>📅 {formattedDate}</span>
                <span style={styles.timeBadgePill}>⏰ {formattedTime}</span>
              </div>
            </div>

            <div style={styles.reportActionRow}>
              <button
                onClick={() => handleOpenModal()}
                style={styles.createTaskBtn}
              >
                + Log Daily Activity
              </button>
            </div>
          </div>

          {/* Activity Category Filter Pills */}
          <div style={styles.categoryFilterRow}>
            <span style={styles.filterLabel}>Filter View:</span>
            
            <button
              onClick={() => setFilterBySelectedDate(!filterBySelectedDate)}
              style={{
                ...styles.categoryFilterPill,
                backgroundColor: filterBySelectedDate ? '#4338ca' : '#f1f5f9',
                color: filterBySelectedDate ? '#ffffff' : '#475569',
                border: filterBySelectedDate ? 'none' : '1px solid #cbd5e1',
                fontWeight: '900',
              }}
              title="Toggle date filter"
            >
              📅 {filterBySelectedDate ? `Filtered: ${selectedDateStr}` : 'All Dates'}
            </button>

            {['All', 'Coding', 'DSA', 'Interview'].map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategoryFilter(cat)}
                style={{
                  ...styles.categoryFilterPill,
                  backgroundColor: activeCategoryFilter === cat ? '#818cf8' : '#ffffff',
                  color: activeCategoryFilter === cat ? '#ffffff' : '#475569',
                  border: activeCategoryFilter === cat ? 'none' : '1px solid #e2e8f0',
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Activity Entries List */}
          {loading ? (
            <div style={styles.loadingBox}>Loading daily reports...</div>
          ) : error ? (
            <div style={styles.errorBox}>{error}</div>
          ) : filteredLogs.length === 0 ? (
            <div style={styles.emptyBox}>
              <p style={{ margin: 0, fontWeight: '700', color: '#1e293b' }}>No Activity Reports Found</p>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                Click "+ Log Daily Activity" to add your daily work!
              </p>
            </div>
          ) : (
            <div style={styles.timelineList}>
              {filteredLogs.map((log) => (
                <motion.div
                  key={log.id}
                  whileHover={{ x: 4 }}
                  style={styles.timelineCard}
                >
                  <div style={styles.timelineHeader}>
                    <div style={styles.timelineDateGroup}>
                      <span style={styles.timelineDate}>{log.log_date}</span>
                      <span style={styles.timelineStars}>
                        {'★'.repeat(log.confidence_score)}{'☆'.repeat(5 - log.confidence_score)}
                      </span>
                    </div>

                    <div style={styles.timelineActions}>
                      <button style={styles.iconActionBtn} onClick={() => handleOpenModal(log)} title="Edit Entry">
                        ✏️
                      </button>
                      <button style={styles.iconActionBtn} onClick={() => handleDelete(log.id)} title="Delete Entry">
                        🗑️
                      </button>
                    </div>
                  </div>

                  <div style={styles.hoursPillsRow}>
                    {log.hours_coding > 0 && (
                      <span style={{ ...styles.hourTag, backgroundColor: '#d1fae5', color: '#047857' }}>
                        💻 Coding: {log.hours_coding}h
                      </span>
                    )}
                    {log.hours_dsa > 0 && (
                      <span style={{ ...styles.hourTag, backgroundColor: '#e0e7ff', color: '#4338ca' }}>
                        🧠 DSA/Design: {log.hours_dsa}h
                      </span>
                    )}
                    {log.hours_interview > 0 && (
                      <span style={{ ...styles.hourTag, backgroundColor: '#ffedd5', color: '#c2410c' }}>
                        🎯 Interview: {log.hours_interview}h
                      </span>
                    )}
                    {log.hours_content > 0 && (
                      <span style={{ ...styles.hourTag, backgroundColor: '#fef3c7', color: '#b45309' }}>
                        📚 Study: {log.hours_content}h
                      </span>
                    )}
                  </div>

                  {(log.journal_text || log.journal_notes) && (
                    <p style={styles.timelineNoteText}>{log.journal_text || log.journal_notes}</p>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Log Activity Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div style={styles.modalOverlay}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              style={styles.modalContent}
            >
              <div style={styles.modalHeader}>
                <h3 style={{ margin: 0, color: '#1e293b', fontSize: '1.25rem', fontWeight: '800' }}>
                  {editingLog ? 'Edit Task Log' : 'Log Daily Activity'}
                </h3>
                <button style={styles.closeModalBtn} onClick={handleCloseModal}>×</button>
              </div>

              {formError && <div style={styles.modalError}>{formError}</div>}

              <form onSubmit={handleSubmit} style={styles.modalForm}>
                <div style={styles.modalGroup}>
                  <label style={styles.modalLabel}>Log Date *</label>
                  <input
                    type="date"
                    required
                    name="log_date"
                    value={formData.log_date}
                    onChange={handleInputChange}
                    style={styles.modalInput}
                  />
                </div>

                <div style={styles.modalRow}>
                  <div style={styles.modalGroup}>
                    <label style={styles.modalLabel}>Coding Hours</label>
                    <input
                      type="number"
                      step="0.5"
                      name="hours_coding"
                      value={formData.hours_coding}
                      onChange={handleInputChange}
                      style={styles.modalInput}
                    />
                  </div>
                  <div style={styles.modalGroup}>
                    <label style={styles.modalLabel}>DSA / Design Hours</label>
                    <input
                      type="number"
                      step="0.5"
                      name="hours_dsa"
                      value={formData.hours_dsa}
                      onChange={handleInputChange}
                      style={styles.modalInput}
                    />
                  </div>
                </div>

                <div style={styles.modalRow}>
                  <div style={styles.modalGroup}>
                    <label style={styles.modalLabel}>Interview Hours</label>
                    <input
                      type="number"
                      step="0.5"
                      name="hours_interview"
                      value={formData.hours_interview}
                      onChange={handleInputChange}
                      style={styles.modalInput}
                    />
                  </div>
                  <div style={styles.modalGroup}>
                    <label style={styles.modalLabel}>Study / Reading Hours</label>
                    <input
                      type="number"
                      step="0.5"
                      name="hours_content"
                      value={formData.hours_content}
                      onChange={handleInputChange}
                      style={styles.modalInput}
                    />
                  </div>
                </div>

                <div style={styles.modalGroup}>
                  <label style={styles.modalLabel}>Confidence Score (1-5)</label>
                  <div style={styles.starsSelect}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setFormData((prev) => ({ ...prev, confidence_score: star }))}
                        style={{
                          background: 'none',
                          border: 'none',
                          fontSize: '1.5rem',
                          cursor: 'pointer',
                          color: star <= formData.confidence_score ? '#f59e0b' : '#cbd5e1',
                        }}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>

                <div style={styles.modalGroup}>
                  <label style={styles.modalLabel}>Journal Notes</label>
                  <textarea
                    name="journal_text"
                    rows="3"
                    placeholder="Describe tasks completed, designs created, or features built..."
                    value={formData.journal_text}
                    onChange={handleInputChange}
                    style={styles.modalTextarea}
                  />
                </div>

                <div style={styles.modalFooter}>
                  <button type="button" style={styles.cancelModalBtn} onClick={handleCloseModal}>
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting} style={styles.saveModalBtn}>
                    {submitting ? 'Saving...' : 'Save Activity'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

const styles = {
  outerCanvas: {
    minHeight: '100vh',
    backgroundColor: '#f4effa',
    padding: '2rem 2.5rem',
    fontFamily: "'Outfit', 'Inter', system-ui, sans-serif",
    boxSizing: 'border-box',
    color: '#1e293b',
  },
  fullScreenContainer: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem',
  },
  navbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: '1.25rem 2rem',
    borderRadius: '24px',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.04)',
    border: '1px solid #f1f5f9',
  },
  brandGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  brandIcon: {
    fontSize: '2rem',
    backgroundColor: '#eff6ff',
    padding: '0.6rem',
    borderRadius: '18px',
  },
  appTitle: {
    fontSize: '1.4rem',
    fontWeight: '900',
    color: '#1e293b',
    margin: 0,
  },
  appSubtitle: {
    fontSize: '0.85rem',
    color: '#64748b',
    margin: 0,
  },
  userActionsGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.25rem',
  },
  userBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    backgroundColor: '#f8fafc',
    padding: '0.5rem 1rem',
    borderRadius: '20px',
    border: '1px solid #e2e8f0',
  },
  userAvatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    backgroundColor: '#6366f1',
    color: '#ffffff',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontWeight: '900',
  },
  userTextGroup: {
    display: 'flex',
    flexDirection: 'column',
  },
  userName: {
    fontSize: '0.9rem',
    fontWeight: '800',
    color: '#1e293b',
  },
  userRoleTag: {
    fontSize: '0.7rem',
    color: '#6366f1',
    fontWeight: '800',
  },
  logoutBtn: {
    backgroundColor: '#fee2e2',
    color: '#ef4444',
    border: 'none',
    padding: '0.6rem 1.1rem',
    borderRadius: '14px',
    fontWeight: '800',
    fontSize: '0.85rem',
    cursor: 'pointer',
  },
  welcomeBannerCard: {
    backgroundColor: '#ffffff',
    borderRadius: '28px',
    padding: '2.5rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 15px 35px rgba(0, 0, 0, 0.03)',
    border: '1px solid #f1f5f9',
    gap: '2rem',
  },
  welcomeLeftCol: {
    flex: 1,
  },
  welcomeTag: {
    fontSize: '0.75rem',
    fontWeight: '900',
    color: '#6366f1',
    backgroundColor: '#e0e7ff',
    padding: '0.35rem 0.85rem',
    borderRadius: '12px',
    letterSpacing: '0.5px',
  },
  welcomeHeading: {
    fontSize: '2rem',
    fontWeight: '900',
    color: '#1e293b',
    margin: '1rem 0 0.5rem 0',
  },
  welcomeSubtext: {
    fontSize: '0.95rem',
    color: '#64748b',
    margin: '0 0 1.5rem 0',
  },
  quoteBox: {
    backgroundColor: '#f8fafc',
    padding: '1rem 1.25rem',
    borderRadius: '18px',
    borderLeft: '4px solid #6366f1',
  },
  quoteText: {
    fontSize: '0.9rem',
    fontStyle: 'italic',
    color: '#334155',
    margin: 0,
  },
  quoteAuthor: {
    fontSize: '0.75rem',
    fontWeight: '800',
    color: '#64748b',
    marginTop: '0.35rem',
    display: 'block',
  },
  quoteRightCol: {
    display: 'flex',
    alignItems: 'center',
  },
  nextQuoteBtn: {
    backgroundColor: '#f1f5f9',
    color: '#475569',
    border: '1px solid #cbd5e1',
    padding: '0.65rem 1.2rem',
    borderRadius: '14px',
    fontWeight: '800',
    fontSize: '0.85rem',
    cursor: 'pointer',
  },
  sectionContainer: {
    backgroundColor: '#ffffff',
    borderRadius: '28px',
    padding: '2rem',
    boxShadow: '0 15px 35px rgba(0, 0, 0, 0.03)',
    border: '1px solid #f1f5f9',
  },
  sectionTitle: {
    fontSize: '1.25rem',
    fontWeight: '900',
    color: '#1e293b',
    margin: 0,
  },
  reportHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.25rem',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  dateTimeBadgeRow: {
    display: 'flex',
    gap: '0.5rem',
    marginTop: '0.35rem',
  },
  dateBadgePill: {
    fontSize: '0.75rem',
    fontWeight: '800',
    backgroundColor: '#e0e7ff',
    color: '#4338ca',
    padding: '0.25rem 0.65rem',
    borderRadius: '10px',
  },
  timeBadgePill: {
    fontSize: '0.75rem',
    fontWeight: '800',
    backgroundColor: '#ecfdf5',
    color: '#047857',
    padding: '0.25rem 0.65rem',
    borderRadius: '10px',
  },
  reportActionRow: {
    display: 'flex',
    gap: '0.5rem',
  },
  createTaskBtn: {
    backgroundColor: '#10b981',
    color: '#ffffff',
    border: 'none',
    padding: '0.65rem 1.25rem',
    borderRadius: '14px',
    fontWeight: '900',
    fontSize: '0.9rem',
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
  },
  categoryFilterRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '1.5rem',
    flexWrap: 'wrap',
  },
  filterLabel: {
    fontSize: '0.85rem',
    fontWeight: '800',
    color: '#64748b',
    marginRight: '0.25rem',
  },
  categoryFilterPill: {
    padding: '0.4rem 0.9rem',
    borderRadius: '12px',
    fontSize: '0.8rem',
    fontWeight: '800',
    cursor: 'pointer',
  },
  loadingBox: {
    padding: '2rem',
    textAlign: 'center',
    color: '#64748b',
    fontWeight: '700',
  },
  errorBox: {
    padding: '1.5rem',
    backgroundColor: '#fff0f0',
    color: '#dc2626',
    borderRadius: '16px',
    textAlign: 'center',
    fontWeight: '700',
  },
  emptyBox: {
    padding: '3rem 2rem',
    textAlign: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: '20px',
    border: '2px dashed #e2e8f0',
  },
  timelineList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  timelineCard: {
    backgroundColor: '#f8fafc',
    borderRadius: '20px',
    padding: '1.25rem',
    border: '1px solid #e2e8f0',
  },
  timelineHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.75rem',
  },
  timelineDateGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  timelineDate: {
    fontSize: '0.95rem',
    fontWeight: '900',
    color: '#1e293b',
  },
  timelineStars: {
    color: '#f59e0b',
    fontSize: '1rem',
  },
  timelineActions: {
    display: 'flex',
    gap: '0.35rem',
  },
  iconActionBtn: {
    background: 'none',
    border: 'none',
    fontSize: '1.1rem',
    cursor: 'pointer',
  },
  hoursPillsRow: {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap',
    marginBottom: '0.75rem',
  },
  hourTag: {
    padding: '0.3rem 0.75rem',
    borderRadius: '10px',
    fontSize: '0.78rem',
    fontWeight: '800',
  },
  timelineNoteText: {
    fontSize: '0.9rem',
    color: '#475569',
    lineHeight: '1.5',
    margin: 0,
    backgroundColor: '#ffffff',
    padding: '0.75rem 1rem',
    borderRadius: '12px',
    border: '1px solid #f1f5f9',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000,
    padding: '1rem',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: '28px',
    padding: '2rem',
    width: '100%',
    maxWidth: '480px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.25rem',
  },
  closeModalBtn: {
    background: 'none',
    border: 'none',
    fontSize: '1.75rem',
    cursor: 'pointer',
    color: '#64748b',
  },
  modalError: {
    backgroundColor: '#fff0f0',
    color: '#dc2626',
    padding: '0.65rem 0.85rem',
    borderRadius: '12px',
    fontSize: '0.85rem',
    fontWeight: '700',
    marginBottom: '1rem',
  },
  modalForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  modalGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem',
  },
  modalRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem',
  },
  modalLabel: {
    fontSize: '0.8rem',
    fontWeight: '800',
    color: '#1e293b',
  },
  modalInput: {
    padding: '0.75rem 1rem',
    borderRadius: '14px',
    border: '1px solid #cbd5e1',
    fontSize: '0.9rem',
    fontWeight: '600',
    outline: 'none',
  },
  starsSelect: {
    display: 'flex',
    gap: '0.25rem',
  },
  modalTextarea: {
    padding: '0.75rem 1rem',
    borderRadius: '14px',
    border: '1px solid #cbd5e1',
    fontSize: '0.9rem',
    fontWeight: '600',
    outline: 'none',
  },
  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '0.75rem',
    marginTop: '0.5rem',
  },
  cancelModalBtn: {
    padding: '0.65rem 1.25rem',
    borderRadius: '14px',
    border: '1px solid #cbd5e1',
    backgroundColor: '#f8fafc',
    color: '#475569',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontWeight: '800',
  },
  saveModalBtn: {
    padding: '0.65rem 1.25rem',
    borderRadius: '14px',
    border: 'none',
    backgroundColor: '#6366f1',
    color: '#ffffff',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontWeight: '900',
    boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)',
  },
};
