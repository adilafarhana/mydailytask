import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import UnifiedTaskManager from './UnifiedTaskManager';

const API_BASE = 'http://127.0.0.1:8000/api';

export default function Welcome() {
  // State for Yesterday's Tasks & Skills (Defaulted to Mon, 24 Aug tasks from database)
  const [yesterdayPlannerTasks, setYesterdayPlannerTasks] = useState([
    {
      id: 'proj-1',
      title: 'new project',
      category: 'BACKEND',
      status: 'Completed',
      projectUrl: '#',
    },
  ]);

  const [yesterdaySkills, setYesterdaySkills] = useState([
    {
      id: 'skill-1',
      name: 'DevOps & Containerization',
      category: 'DevOps',
      icon: '🚀',
    },
  ]);

  useEffect(() => {
    fetchYesterdayData();
  }, []);

  const fetchYesterdayData = async () => {
    const yesterdayDate = '2026-08-24';
    try {
      // Try fetching yesterday's skills from backend
      const resSkills = await fetch(`${API_BASE}/new-skills`);
      const dataSkills = await resSkills.json();
      if (dataSkills.skills && Array.isArray(dataSkills.skills)) {
        const matching = dataSkills.skills.filter((s) => {
          const sDate = s.target_date ? s.target_date.split('T')[0] : '';
          return sDate === yesterdayDate;
        });
        if (matching.length > 0) {
          setYesterdaySkills(matching.map((s) => ({
            id: s.id,
            name: s.skill_name || 'DevOps & Containerization',
            category: s.category || 'DevOps',
            icon: '🚀',
          })));
        }
      }
    } catch (err) {
      console.warn('Using yesterday tasks fallback.');
    }
  };

  return (
    <div style={styles.outerCanvas}>
      <div style={styles.container}>
        {/* Navigation Bar */}
        <header style={styles.navbar}>
          <div style={styles.brandGroup}>
            <div style={styles.brandIcon}>💻</div>
            <span style={styles.brandName}>Daily Task Management</span>
          </div>

          <div style={styles.navActions}>
            <Link to="/daily-logs" style={styles.dashboardNavBtn}>
              ⚡ Go to Today's Dashboard
            </Link>
            <Link to="/login" style={styles.loginBtn}>
              Sign In
            </Link>
            <Link to="/register" style={styles.registerBtn}>
              Get Started
            </Link>
          </div>
        </header>

        {/* Hero & Personalized Greeting */}
        <main style={styles.mainContent}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={styles.heroCard}
          >
            <div style={styles.greetingBadge}>✨ PERSONALIZED TASK MANAGEMENT</div>

            <h1 style={styles.mainGreetingHeading}>
              Hi Adila! Welcome to your Task Management 👋
            </h1>

            <p style={styles.greetingSubtext}>
              Review your yesterday's completed tasks, track your skill growth, and stay 100% focused on execution.
            </p>

            {/* Daily Task Add & Get Section */}
            <div style={{ marginBottom: '2rem' }}>
              <UnifiedTaskManager />
            </div>

            {/* Yesterday's Completed Works Section */}
            <div style={styles.yesterdayCardBox}>
              <div style={styles.yesterdayHeaderRow}>
                <div style={styles.yesterdayTitleGroup}>
                  <span style={styles.historyIcon}>📋</span>
                  <div>
                    <h3 style={styles.yesterdayTitle}>Yesterday's Completed Works</h3>
                    <span style={styles.yesterdayDateTag}>Scheduled for Mon, 24 Aug (Yesterday)</span>
                  </div>
                </div>

                <span style={styles.completedBadge}>✅ Completed Base</span>
              </div>

              {/* 1. Yesterday's Scheduled Planner Task (new project - BACKEND - Completed) */}
              <div style={styles.subSectionBox}>
                <span style={styles.subSectionTag}>📌 SCHEDULED TASK (Mon, 24 Aug)</span>
                
                <div style={styles.plannerTasksGrid}>
                  {yesterdayPlannerTasks.map((task) => (
                    <div key={task.id} style={styles.plannerTaskCard}>
                      <div style={styles.checkIconBox}>✓</div>
                      <div style={styles.taskInfoCol}>
                        <h4 style={styles.taskTitleLineThrough}>{task.title}</h4>
                        <span style={styles.categoryPill}>{task.category}</span>
                      </div>

                      <div style={styles.actionButtonsCol}>
                        <button style={styles.viewProjectBtn}>
                          🔗 View Project
                        </button>
                        <span style={styles.completedTagPill}>
                          ✓ Completed
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. Yesterday's Tech Upgrades & Skill Expansion (DevOps & Containerization) */}
              <div style={styles.subSectionBox}>
                <div style={styles.skillHeaderRow}>
                  <span style={styles.skillSectionTitle}>
                    💡 TECH UPGRADES & SKILL EXPANSION (Date: 2026-08-24)
                  </span>
                </div>

                <div style={styles.skillsGrid}>
                  {yesterdaySkills.map((skill) => (
                    <div key={skill.id} style={styles.skillCardItem}>
                      <div style={styles.skillIconCircle}>🚀</div>
                      <div style={styles.skillTextCol}>
                        <h4 style={styles.skillNameText}>{skill.name}</h4>
                        <span style={styles.skillCategoryBadge}>{skill.category}</span>
                      </div>

                      <button style={styles.viewDetailsBtn}>
                        👁️ View Details
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
}

const styles = {
  outerCanvas: {
    minHeight: '100vh',
    backgroundColor: '#f8fafc',
    padding: '2rem 1.5rem',
    fontFamily: "'Outfit', 'Plus Jakarta Sans', 'Inter', system-ui, sans-serif",
    boxSizing: 'border-box',
    color: '#0f172a',
  },
  container: {
    maxWidth: '1150px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '2.5rem',
  },
  navbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: '1.1rem 2rem',
    borderRadius: '24px',
    boxShadow: '0 8px 25px rgba(0, 0, 0, 0.03)',
    border: '1px solid #e2e8f0',
  },
  brandGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  brandIcon: {
    fontSize: '1.75rem',
  },
  brandName: {
    fontSize: '1.25rem',
    fontWeight: '900',
    color: '#0f172a',
  },
  navActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  dashboardNavBtn: {
    backgroundColor: '#ecfdf5',
    color: '#059669',
    textDecoration: 'none',
    fontWeight: '900',
    fontSize: '0.88rem',
    padding: '0.55rem 1.1rem',
    borderRadius: '16px',
    border: '1px solid #a7f3d0',
  },
  loginBtn: {
    color: '#334155',
    textDecoration: 'none',
    fontWeight: '800',
    fontSize: '0.9rem',
    padding: '0.5rem 1rem',
  },
  registerBtn: {
    backgroundColor: '#2563eb',
    color: '#ffffff',
    textDecoration: 'none',
    padding: '0.65rem 1.35rem',
    borderRadius: '20px',
    fontWeight: '800',
    fontSize: '0.9rem',
    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
  },
  mainContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2.5rem',
  },
  heroCard: {
    backgroundColor: '#ffffff',
    borderRadius: '28px',
    padding: '2.5rem',
    boxShadow: '0 12px 35px rgba(0, 0, 0, 0.04)',
    border: '1px solid #e2e8f0',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.75rem',
  },
  greetingBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#eff6ff',
    color: '#2563eb',
    padding: '0.4rem 1rem',
    borderRadius: '20px',
    fontSize: '0.78rem',
    fontWeight: '900',
    letterSpacing: '0.5px',
  },
  mainGreetingHeading: {
    fontSize: '2.5rem',
    fontWeight: '900',
    color: '#0f172a',
    margin: 0,
    lineHeight: '1.2',
  },
  greetingSubtext: {
    fontSize: '1.05rem',
    color: '#64748b',
    margin: 0,
    lineHeight: '1.5',
    fontWeight: '600',
  },
  yesterdayCardBox: {
    backgroundColor: '#f8fafc',
    borderRadius: '24px',
    padding: '1.75rem',
    border: '1.5px solid #e2e8f0',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  yesterdayHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '0.75rem',
  },
  yesterdayTitleGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  historyIcon: {
    fontSize: '1.6rem',
  },
  yesterdayTitle: {
    fontSize: '1.25rem',
    fontWeight: '900',
    color: '#0f172a',
    margin: 0,
  },
  yesterdayDateTag: {
    fontSize: '0.85rem',
    fontWeight: '800',
    color: '#6366f1',
  },
  completedBadge: {
    backgroundColor: '#d1fae5',
    color: '#047857',
    border: '1px solid #a7f3d0',
    padding: '0.35rem 0.85rem',
    borderRadius: '16px',
    fontSize: '0.82rem',
    fontWeight: '900',
  },
  subSectionBox: {
    backgroundColor: '#ffffff',
    borderRadius: '20px',
    padding: '1.25rem',
    border: '1px solid #e2e8f0',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  subSectionTag: {
    fontSize: '0.75rem',
    fontWeight: '900',
    color: '#64748b',
    letterSpacing: '0.5px',
  },
  plannerTasksGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  plannerTaskCard: {
    backgroundColor: '#dcfce7', // Soft green background matching screenshot
    border: '1.5px solid #86efac',
    borderRadius: '18px',
    padding: '1rem 1.25rem',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    flexWrap: 'wrap',
  },
  checkIconBox: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    backgroundColor: '#10b981',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '900',
    fontSize: '0.9rem',
  },
  taskInfoCol: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.2rem',
  },
  taskTitleLineThrough: {
    fontSize: '1.1rem',
    fontWeight: '900',
    color: '#166534',
    textDecoration: 'line-through',
    margin: 0,
  },
  categoryPill: {
    alignSelf: 'flex-start',
    fontSize: '0.72rem',
    fontWeight: '900',
    color: '#15803d',
    backgroundColor: 'rgba(255,255,255,0.7)',
    padding: '0.15rem 0.5rem',
    borderRadius: '8px',
  },
  actionButtonsCol: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  viewProjectBtn: {
    backgroundColor: '#eff6ff',
    border: '1px solid #bfdbfe',
    color: '#2563eb',
    padding: '0.45rem 0.85rem',
    borderRadius: '12px',
    fontSize: '0.8rem',
    fontWeight: '800',
    cursor: 'pointer',
  },
  completedTagPill: {
    backgroundColor: '#a7f3d0',
    border: '1px solid #6ee7b7',
    color: '#065f46',
    padding: '0.45rem 0.85rem',
    borderRadius: '12px',
    fontSize: '0.8rem',
    fontWeight: '900',
  },
  skillHeaderRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  skillSectionTitle: {
    fontSize: '0.8rem',
    fontWeight: '900',
    color: '#4f46e5',
    letterSpacing: '0.5px',
  },
  skillsGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  skillCardItem: {
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '18px',
    padding: '1rem 1.25rem',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    flexWrap: 'wrap',
  },
  skillIconCircle: {
    width: '42px',
    height: '42px',
    borderRadius: '14px',
    backgroundColor: '#f1f5f9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.2rem',
  },
  skillTextCol: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.2rem',
  },
  skillNameText: {
    fontSize: '1.05rem',
    fontWeight: '900',
    color: '#0f172a',
    margin: 0,
  },
  skillCategoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#e0e7ff',
    color: '#4338ca',
    padding: '0.15rem 0.5rem',
    borderRadius: '8px',
    fontSize: '0.72rem',
    fontWeight: '800',
  },
  viewDetailsBtn: {
    backgroundColor: '#ffffff',
    border: '1px solid #cbd5e1',
    color: '#334155',
    padding: '0.45rem 0.85rem',
    borderRadius: '12px',
    fontSize: '0.8rem',
    fontWeight: '800',
    cursor: 'pointer',
  },
  urgencyCtaBanner: {
    backgroundColor: '#1e293b',
    color: '#ffffff',
    borderRadius: '24px',
    padding: '1.75rem 2rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '1.5rem',
    boxShadow: '0 10px 30px rgba(30, 41, 59, 0.2)',
  },
  urgencyTextGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    flex: 1,
  },
  fireIcon: {
    fontSize: '2rem',
  },
  urgencyTitle: {
    fontSize: '1.3rem',
    fontWeight: '900',
    margin: 0,
    color: '#ffffff',
  },
  urgencySubtext: {
    fontSize: '0.9rem',
    color: '#cbd5e1',
    margin: '0.2rem 0 0 0',
    fontWeight: '600',
  },
  mainMoveCtaBtn: {
    backgroundColor: '#10b981',
    color: '#ffffff',
    textDecoration: 'none',
    padding: '0.9rem 1.75rem',
    borderRadius: '20px',
    fontWeight: '900',
    fontSize: '0.98rem',
    boxShadow: '0 6px 20px rgba(16, 185, 129, 0.35)',
    whiteSpace: 'nowrap',
  },
  featuresGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '1.5rem',
  },
  featureCard: {
    backgroundColor: '#ffffff',
    borderRadius: '24px',
    padding: '2rem 1.5rem',
    textAlign: 'left',
    border: '1px solid #e2e8f0',
    boxShadow: '0 8px 25px rgba(0, 0, 0, 0.03)',
  },
  featureIconBox: {
    fontSize: '2rem',
    marginBottom: '0.85rem',
  },
  featureTitle: {
    fontSize: '1.15rem',
    fontWeight: '900',
    color: '#0f172a',
    margin: '0 0 0.4rem 0',
  },
  featureSubtext: {
    fontSize: '0.88rem',
    color: '#64748b',
    margin: 0,
    lineHeight: '1.5',
    fontWeight: '600',
  },
};
