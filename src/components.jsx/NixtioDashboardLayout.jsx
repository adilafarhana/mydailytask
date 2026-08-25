import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function NixtioDashboardLayout({
  selectedDateStr,
  onSelectDate,
  childrenLeft,
  childrenMiddle,
  childrenRight,
  summaryData = {},
}) {
  // Live Timer State
  const [timerSeconds, setTimerSeconds] = useState(8581); // 2:23:01
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerMode, setTimerMode] = useState('Work time'); // 'Work time' | 'Break time' | 'List view'

  useEffect(() => {
    let interval = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const formatTime = (totalSec) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Weekday selector (1..7)
  const days = [
    { num: 1, day: 'M', dateStr: '2026-08-24' },
    { num: 2, day: 'T', dateStr: '2026-08-25' },
    { num: 3, day: 'W', dateStr: '2026-08-26' },
    { num: 4, day: 'T', dateStr: '2026-08-27' },
    { num: 5, day: 'F', dateStr: '2026-08-28' },
    { num: 6, day: 'S', dateStr: '2026-08-29' },
    { num: 7, day: 'S', dateStr: '2026-08-30' },
  ];

  return (
    <div style={styles.fullScreenWrapper}>
      {/* 3-Column Nixtio Dashboard Grid */}
      <div style={styles.dashboardGrid}>
        
        {/* COLUMN 1: Task Management & Schedule */}
        <div style={styles.columnCard}>
          <div style={styles.columnHeader}>
            <span style={styles.menuIcon}>☰</span>
            <div style={styles.headerTitleGroup}>
              <span style={styles.columnBadge}>TASK MANAGEMENT</span>
              <h2 style={styles.columnTitle}>Task Schedule</h2>
            </div>
            <div style={styles.iconControls}>
              <span style={styles.circleIcon}>⊕</span>
              <span style={styles.circleIcon}>⚙</span>
            </div>
          </div>

          {/* Weekday Number Pills (1 2 3 4 5 6 7) */}
          <div style={styles.weekNumberRow}>
            {days.map((d) => {
              const isSelected = selectedDateStr === d.dateStr || d.num === 1;
              return (
                <button
                  key={d.num}
                  onClick={() => onSelectDate && onSelectDate(d.dateStr)}
                  style={{
                    ...styles.dayPillBtn,
                    backgroundColor: isSelected ? '#6366f1' : '#f1f5f9',
                    color: isSelected ? '#ffffff' : '#475569',
                  }}
                >
                  <span style={styles.dayNumber}>{d.num}</span>
                  <span style={styles.dayLetter}>{d.day}</span>
                </button>
              );
            })}
          </div>

          {/* Time Block Timeline Cards */}
          <div style={styles.timeBlockContainer}>
            <div style={styles.timeRow}>
              <span style={styles.timeLabel}>09:00</span>
              <div style={styles.purpleTimeCard}>
                <div style={styles.cardHeaderRow}>
                  <span style={styles.cardTimeTag}>⏰ 9:00 AM</span>
                  <div style={styles.avatarGroup}>
                    <span style={styles.avatarCircle}>👨‍💻</span>
                    <span style={styles.avatarCircle}>🎨</span>
                  </div>
                </div>
                <h4 style={styles.cardTitleText}>Builds seamless digital experiences</h4>
              </div>
            </div>

            <div style={styles.timeRow}>
              <span style={styles.timeLabel}>10:00</span>
              <div style={styles.indigoTimeCard}>
                <div style={styles.cardHeaderRow}>
                  <span style={styles.cardTimeTag}>⏰ 10:00 AM</span>
                  <div style={styles.avatarGroup}>
                    <span style={styles.avatarCircle}>⚡</span>
                  </div>
                </div>
                <h4 style={styles.cardTitleText}>Creating a seamless mobile & web application flow</h4>
              </div>
            </div>
          </div>

          {/* Render Left Column Children (Daily Task List & Planner) */}
          <div style={styles.childrenWrapper}>
            {childrenLeft}
          </div>
        </div>

        {/* COLUMN 2: Reports & Hours Tracker */}
        <div style={styles.columnCard}>
          <div style={styles.columnHeader}>
            <span style={styles.menuIcon}>☰</span>
            <div style={styles.headerTitleGroup}>
              <span style={styles.columnBadge}>ANALYTICS & METRICS</span>
              <h2 style={styles.columnTitle}>Reports</h2>
            </div>
            <span style={styles.circleIcon}>📊</span>
          </div>

          {/* Date Navigator Bar */}
          <div style={styles.dateNavCard}>
            <button style={styles.navArrowBtn}>◄</button>
            <span style={styles.dateRangeText}>May 01 - May 07, 2026</span>
            <button style={styles.navArrowBtn}>►</button>
          </div>

          {/* Tracker Hours Summary */}
          <div style={styles.trackerHoursCard}>
            <div style={styles.hoursRow}>
              <div>
                <span style={styles.hoursLabel}>Tracker Hours</span>
                <h2 style={styles.bigHoursText}>
                  {summaryData.total_hours ? `${summaryData.total_hours}:32:01` : '87:32:01'}
                </h2>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={styles.hoursLabel}>🟣 Development</span>
                <h3 style={styles.mediumHoursText}>
                  {summaryData.total_hours_coding ? `${summaryData.total_hours_coding}:21:31` : '20:21:31'}
                </h3>
              </div>
            </div>

            {/* Weekday Horizontal Progress Bar Chart */}
            <div style={styles.weeklyBarsContainer}>
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => {
                const widths = ['85%', '65%', '90%', '75%', '95%', '40%', '30%'];
                const colors = ['#6366f1', '#ec4899', '#3b82f6', '#10b981', '#a855f7', '#f59e0b', '#64748b'];

                return (
                  <div key={idx} style={styles.barRow}>
                    <span style={styles.barDayLabel}>{day}</span>
                    <div style={styles.barTrack}>
                      <div
                        style={{
                          ...styles.barFill,
                          width: widths[idx],
                          backgroundColor: colors[idx],
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Grouped By Project */}
          <div style={styles.groupedProjectCard}>
            <div style={styles.cardHeaderRow}>
              <h4 style={styles.subSectionTitle}>Grouped by project</h4>
              <span style={styles.dotsIcon}>•••</span>
            </div>
            <div style={styles.projectPillsRow}>
              <span style={styles.projPillPurp}>🟣 Vehicle Marketplace (45%)</span>
              <span style={styles.projPillBlue}>🔵 Academic Planner (35%)</span>
              <span style={styles.projPillTeal}>🟢 Portfolio API (20%)</span>
            </div>
          </div>

          {/* Render Middle Column Children */}
          <div style={styles.childrenWrapper}>
            {childrenMiddle}
          </div>
        </div>

        {/* COLUMN 3: Work Timer & Skill Controller */}
        <div style={styles.columnCard}>
          <div style={styles.columnHeader}>
            <span style={styles.menuIcon}>☰</span>
            <div style={styles.headerTitleGroup}>
              <span style={styles.columnBadge}>LIVE FOCUS TIMER</span>
              <h2 style={styles.columnTitle}>Timer</h2>
            </div>
            <span style={styles.circleIcon}>⏱</span>
          </div>

          {/* Mode Switcher Tabs */}
          <div style={styles.modeTabsRow}>
            {['Work time', 'Break time', 'List view'].map((mode) => (
              <button
                key={mode}
                onClick={() => setTimerMode(mode)}
                style={{
                  ...styles.modeTabBtn,
                  backgroundColor: timerMode === mode ? '#6366f1' : '#f1f5f9',
                  color: timerMode === mode ? '#ffffff' : '#475569',
                }}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* SVG Circular Countdown Timer */}
          <div style={styles.timerCircleCard}>
            <div style={styles.timerCircleWrapper}>
              <svg width="180" height="180" viewBox="0 0 180 180" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="90" cy="90" r="75" stroke="#e0e7ff" strokeWidth="10" fill="transparent" />
                <circle
                  cx="90"
                  cy="90"
                  r="75"
                  stroke="#6366f1"
                  strokeWidth="10"
                  fill="transparent"
                  strokeDasharray="471"
                  strokeDashoffset="100"
                  strokeLinecap="round"
                />
              </svg>

              <div style={styles.timerCenterContent}>
                <span style={styles.timerBellIcon}>🔔 13:34</span>
                <h1 style={styles.timerCountdownText}>{formatTime(timerSeconds)}</h1>
                <span style={styles.timerPercentageTag}>78% Complete</span>
              </div>
            </div>

            {/* Timer Control Buttons */}
            <div style={styles.timerControlsRow}>
              <button
                onClick={() => setTimerSeconds(8581)}
                style={styles.secondaryControlBtn}
              >
                Cast
              </button>
              <button
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                style={{
                  ...styles.primaryControlBtn,
                  backgroundColor: isTimerRunning ? '#ef4444' : '#6366f1',
                }}
              >
                {isTimerRunning ? 'Pause' : 'Start Focus'}
              </button>
            </div>
          </div>

          {/* Render Right Column Children (New Skills & CV Skill Tracker) */}
          <div style={styles.childrenWrapper}>
            {childrenRight}
          </div>
        </div>

      </div>
    </div>
  );
}

const styles = {
  fullScreenWrapper: {
    minHeight: '100vh',
    width: '100%',
    backgroundColor: '#ede9fe',
    backgroundImage: 'linear-gradient(135deg, #e0e7ff 0%, #ede9fe 50%, #f3e8ff 100%)',
    padding: '1.5rem',
    boxSizing: 'border-box',
    fontFamily: "'Outfit', 'Inter', system-ui, sans-serif",
  },
  dashboardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
    gap: '1.5rem',
    maxWidth: '1600px',
    margin: '0 auto',
  },
  columnCard: {
    backgroundColor: '#ffffff',
    borderRadius: '28px',
    padding: '1.5rem',
    boxShadow: '0 20px 40px rgba(99, 102, 241, 0.08)',
    border: '1px solid #e0e7ff',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  columnHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  menuIcon: {
    fontSize: '1.2rem',
    color: '#64748b',
    cursor: 'pointer',
  },
  headerTitleGroup: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  columnBadge: {
    fontSize: '0.65rem',
    fontWeight: '900',
    color: '#6366f1',
    letterSpacing: '0.5px',
  },
  columnTitle: {
    fontSize: '1.35rem',
    fontWeight: '900',
    color: '#0f172a',
    margin: 0,
  },
  iconControls: {
    display: 'flex',
    gap: '0.5rem',
  },
  circleIcon: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: '#f1f5f9',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: '0.9rem',
    color: '#475569',
    cursor: 'pointer',
  },
  weekNumberRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: '0.35rem',
  },
  dayPillBtn: {
    borderRadius: '16px',
    padding: '0.6rem 0.2rem',
    border: 'none',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  dayNumber: {
    fontSize: '0.95rem',
    fontWeight: '900',
  },
  dayLetter: {
    fontSize: '0.65rem',
    fontWeight: '800',
    marginTop: '0.1rem',
  },
  timeBlockContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  timeRow: {
    display: 'flex',
    gap: '0.75rem',
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: '0.75rem',
    fontWeight: '800',
    color: '#64748b',
    minWidth: '42px',
  },
  purpleTimeCard: {
    flex: 1,
    backgroundColor: '#6366f1',
    color: '#ffffff',
    borderRadius: '18px',
    padding: '0.85rem 1rem',
    boxShadow: '0 8px 20px rgba(99, 102, 241, 0.25)',
  },
  indigoTimeCard: {
    flex: 1,
    backgroundColor: '#a855f7',
    color: '#ffffff',
    borderRadius: '18px',
    padding: '0.85rem 1rem',
    boxShadow: '0 8px 20px rgba(168, 85, 247, 0.25)',
  },
  cardHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.35rem',
  },
  cardTimeTag: {
    fontSize: '0.7rem',
    fontWeight: '800',
    opacity: 0.9,
  },
  avatarGroup: {
    display: 'flex',
    gap: '0.2rem',
  },
  avatarCircle: {
    fontSize: '0.8rem',
  },
  cardTitleText: {
    fontSize: '0.85rem',
    fontWeight: '800',
    margin: 0,
    lineHeight: '1.3',
  },
  dateNavCard: {
    backgroundColor: '#f8fafc',
    borderRadius: '18px',
    padding: '0.6rem 1rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    border: '1px solid #e2e8f0',
  },
  navArrowBtn: {
    backgroundColor: '#6366f1',
    color: '#ffffff',
    border: 'none',
    borderRadius: '50%',
    width: '28px',
    height: '28px',
    cursor: 'pointer',
    fontSize: '0.75rem',
    fontWeight: '900',
  },
  dateRangeText: {
    fontSize: '0.85rem',
    fontWeight: '800',
    color: '#1e293b',
  },
  trackerHoursCard: {
    backgroundColor: '#f8fafc',
    borderRadius: '20px',
    padding: '1rem',
    border: '1px solid #e2e8f0',
  },
  hoursRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '1rem',
  },
  hoursLabel: {
    fontSize: '0.75rem',
    fontWeight: '800',
    color: '#64748b',
  },
  bigHoursText: {
    fontSize: '1.6rem',
    fontWeight: '900',
    color: '#0f172a',
    margin: '0.2rem 0 0 0',
  },
  mediumHoursText: {
    fontSize: '1.1rem',
    fontWeight: '900',
    color: '#6366f1',
    margin: '0.2rem 0 0 0',
  },
  weeklyBarsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
  },
  barRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
  },
  barDayLabel: {
    fontSize: '0.72rem',
    fontWeight: '900',
    color: '#64748b',
    width: '14px',
  },
  barTrack: {
    flex: 1,
    height: '10px',
    backgroundColor: '#e2e8f0',
    borderRadius: '10px',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: '10px',
  },
  groupedProjectCard: {
    backgroundColor: '#f8fafc',
    borderRadius: '18px',
    padding: '0.85rem 1rem',
    border: '1px solid #e2e8f0',
  },
  subSectionTitle: {
    fontSize: '0.85rem',
    fontWeight: '800',
    color: '#1e293b',
    margin: 0,
  },
  dotsIcon: {
    color: '#64748b',
    fontSize: '0.8rem',
  },
  projectPillsRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.35rem',
    marginTop: '0.5rem',
  },
  projPillPurp: {
    fontSize: '0.7rem',
    fontWeight: '800',
    backgroundColor: '#ede9fe',
    color: '#6366f1',
    padding: '0.25rem 0.6rem',
    borderRadius: '10px',
  },
  projPillBlue: {
    fontSize: '0.7rem',
    fontWeight: '800',
    backgroundColor: '#dbeafe',
    color: '#2563eb',
    padding: '0.25rem 0.6rem',
    borderRadius: '10px',
  },
  projPillTeal: {
    fontSize: '0.7rem',
    fontWeight: '800',
    backgroundColor: '#ccfbf1',
    color: '#0d9488',
    padding: '0.25rem 0.6rem',
    borderRadius: '10px',
  },
  modeTabsRow: {
    display: 'flex',
    gap: '0.35rem',
    backgroundColor: '#f1f5f9',
    padding: '0.35rem',
    borderRadius: '16px',
  },
  modeTabBtn: {
    flex: 1,
    border: 'none',
    borderRadius: '12px',
    padding: '0.45rem 0.5rem',
    fontSize: '0.75rem',
    fontWeight: '800',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  timerCircleCard: {
    backgroundColor: '#f8fafc',
    borderRadius: '24px',
    padding: '1.25rem',
    border: '1px solid #e2e8f0',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1rem',
  },
  timerCircleWrapper: {
    position: 'relative',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerCenterContent: {
    position: 'absolute',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  timerBellIcon: {
    fontSize: '0.7rem',
    fontWeight: '800',
    color: '#64748b',
  },
  timerCountdownText: {
    fontSize: '1.8rem',
    fontWeight: '900',
    color: '#0f172a',
    margin: '0.1rem 0',
  },
  timerPercentageTag: {
    fontSize: '0.72rem',
    fontWeight: '800',
    color: '#6366f1',
    backgroundColor: '#e0e7ff',
    padding: '0.15rem 0.5rem',
    borderRadius: '10px',
  },
  timerControlsRow: {
    display: 'flex',
    gap: '0.5rem',
    width: '100%',
  },
  secondaryControlBtn: {
    flex: 1,
    backgroundColor: '#ffffff',
    border: '1px solid #cbd5e1',
    borderRadius: '14px',
    padding: '0.6rem',
    fontSize: '0.82rem',
    fontWeight: '800',
    color: '#475569',
    cursor: 'pointer',
  },
  primaryControlBtn: {
    flex: 2,
    color: '#ffffff',
    border: 'none',
    borderRadius: '14px',
    padding: '0.6rem',
    fontSize: '0.85rem',
    fontWeight: '900',
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)',
  },
  childrenWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
};
