import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

// Inspirational quotes array
const INSPIRATIONAL_QUOTES = [
  { text: "Consistency is what transforms average into extraordinary. Execute daily.", author: "Productivity System" },
  { text: "Small daily improvements over time lead to stunning results.", author: "Engineering Rule" },
  { text: "Focus on process, not outcome. Great products are built one commit at a time.", author: "Tech Founder" },
  { text: "Disciplined execution beats raw intelligence every single time.", author: "Daily Mastery" },
];

export default function MotivationalCountdownPlatform({
  logs = [],
  selectedDateStr = new Date().toISOString().split('T')[0],
  onSelectDate = () => {},
  onOpenAddModal = () => {},
}) {
  // Navigation tab selection: 'timer' | 'tasks' | 'reports'
  const [activeTab, setActiveTab] = useState('timer');
  const [timerMode, setTimerMode] = useState('work'); // 'work' (25m), 'break' (5m), 'sprint' (48h)

  // Timer countdown state (seconds)
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [initialTime, setInitialTime] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);

  // Motivational quote index
  const [quoteIdx, setQuoteIdx] = useState(0);

  // Timer loop
  useEffect(() => {
    let interval = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsRunning(false);
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  // Mode Switcher (Work / Break / Sprint)
  const handleModeSwitch = (mode) => {
    setTimerMode(mode);
    setIsRunning(false);
    if (mode === 'work') {
      setTimeLeft(25 * 60);
      setInitialTime(25 * 60);
    } else if (mode === 'break') {
      setTimeLeft(5 * 60);
      setInitialTime(5 * 60);
    } else if (mode === 'sprint') {
      setTimeLeft(3600 * 48); // 48 hours sprint
      setInitialTime(3600 * 48);
    }
  };

  // Time calculations
  const hours = Math.floor(timeLeft / 3600);
  const mins = Math.floor((timeLeft % 3600) / 60);
  const secs = timeLeft % 60;

  const timeFormatted =
    hours > 0
      ? `${hours}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
      : `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  const progressPercent = Math.min(
    100,
    Math.max(0, Math.round(((initialTime - timeLeft) / initialTime) * 100))
  );

  // SVG Circular Gauge calculation (Radius = 110)
  const radius = 110;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  // Calculate Real Stats from User's Logs
  const totalCodingHours = logs.reduce((sum, l) => sum + (parseFloat(l.hours_coding) || 0), 0);
  const totalDsaHours = logs.reduce((sum, l) => sum + (parseFloat(l.hours_dsa) || 0), 0);
  const totalInterviewHours = logs.reduce((sum, l) => sum + (parseFloat(l.hours_interview) || 0), 0);
  const totalContentHours = logs.reduce((sum, l) => sum + (parseFloat(l.hours_content) || 0), 0);
  const grandTotalHours = totalCodingHours + totalDsaHours + totalInterviewHours + totalContentHours;

  // Filter logs for selected date
  const selectedLogs = logs.filter(
    (l) => l.log_date && l.log_date.startsWith(selectedDateStr)
  );

  // Days of week selector
  const daysOfWeek = [
    { dayLabel: 'M', dayNum: 1 },
    { dayLabel: 'T', dayNum: 2 },
    { dayLabel: 'W', dayNum: 3 },
    { dayLabel: 'T', dayNum: 4 },
    { dayLabel: 'F', dayNum: 5 },
    { dayLabel: 'S', dayNum: 6 },
    { dayLabel: 'S', dayNum: 7 },
  ];

  const nextQuote = () => {
    setQuoteIdx((prev) => (prev + 1) % INSPIRATIONAL_QUOTES.length);
  };

  const currentDateObj = new Date();

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={styles.mainCanvasContainer}
    >
      {/* Top Header Row */}
      <div style={styles.topHeaderNav}>
        <div style={styles.brandTitleGroup}>
          <span style={styles.brandIconDot}>⏱️</span>
          <div>
            <h2 style={styles.brandMainTitle}>Task Management & Timer</h2>
            <span style={styles.brandSubDate}>
              {currentDateObj.toLocaleDateString(undefined, {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </span>
          </div>
        </div>

        {/* Tab View Buttons */}
        <div style={styles.navigationTabsPills}>
          <button
            onClick={() => setActiveTab('timer')}
            style={{
              ...styles.tabPillBtn,
              ...(activeTab === 'timer' ? styles.tabPillBtnActive : {}),
            }}
          >
            ⏱️ Timer
          </button>
          <button
            onClick={() => setActiveTab('tasks')}
            style={{
              ...styles.tabPillBtn,
              ...(activeTab === 'tasks' ? styles.tabPillBtnActive : {}),
            }}
          >
            📋 Task Management
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            style={{
              ...styles.tabPillBtn,
              ...(activeTab === 'reports' ? styles.tabPillBtnActive : {}),
            }}
          >
            📊 Reports & Analytics
          </button>
        </div>
      </div>

      {/* 3-Column Dribbble SaaS Grid */}
      <div style={styles.screensGrid3Column}>
        
        {/* COLUMN 1: TASK MANAGEMENT (REAL USER DATA & LOGS) */}
        <div style={styles.screenCardWrapper}>
          <div style={styles.cardHeaderRow}>
            <h3 style={styles.cardHeaderTitle}>Task Management</h3>
            <button onClick={onOpenAddModal} style={styles.addLogSmallBtn}>
              + New Entry
            </button>
          </div>

          {/* Calendar Date Selector */}
          <div style={styles.dateSelectorBox}>
            <label style={styles.dateLabel}>Selected Date:</label>
            <input
              type="date"
              value={selectedDateStr}
              onChange={(e) => onSelectDate(e.target.value)}
              style={styles.dateInputField}
            />
          </div>

          {/* Day of Week Badges */}
          <div style={styles.daysStripRow}>
            {daysOfWeek.map((d) => (
              <div key={d.dayNum} style={styles.dayPillBox}>
                <span style={styles.dayLabelText}>{d.dayLabel}</span>
              </div>
            ))}
          </div>

          {/* REAL USER LOGS LIST */}
          <div style={styles.timelineList}>
            {selectedLogs.length === 0 ? (
              <div style={styles.emptyTaskState}>
                <span style={{ fontSize: '2rem' }}>📝</span>
                <p style={styles.emptyTaskText}>No task entries recorded for this date yet.</p>
                <button onClick={onOpenAddModal} style={styles.createTaskCtaBtn}>
                  + Add Daily Log Entry
                </button>
              </div>
            ) : (
              selectedLogs.map((log) => (
                <div key={log.id} style={styles.realLogCard}>
                  <div style={styles.logCardHeader}>
                    <span style={styles.logDateBadge}>📅 {log.log_date ? log.log_date.split('T')[0] : selectedDateStr}</span>
                    <span style={styles.logHoursBadge}>💻 {(parseFloat(log.hours_coding) || 0).toFixed(1)}h Coding</span>
                  </div>
                  <p style={styles.logJournalText}>
                    {log.journal_text || log.journal_notes || 'Daily task & coding session completed.'}
                  </p>
                  <div style={styles.metricsPillsRow}>
                    <span style={styles.metricPill}>🧠 DSA: {log.hours_dsa || 0}h</span>
                    <span style={styles.metricPill}>🎙️ Prep: {log.hours_interview || 0}h</span>
                    <span style={styles.metricPill}>⭐ Confidence: {log.confidence_score || 5}/5</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* COLUMN 2: REPORTS & TRACKER HOURS (REAL LOGGED METRICS) */}
        <div style={styles.screenCardWrapper}>
          <div style={styles.cardHeaderRow}>
            <h3 style={styles.cardHeaderTitle}>Reports & Analytics</h3>
            <span style={styles.reportsRangeTag}>Total Stats</span>
          </div>

          {/* Real Logged Hours Summary Card */}
          <div style={styles.trackerHoursSummaryCard}>
            <div style={styles.hoursCol}>
              <span style={styles.hoursLabel}>Total Hours Logged</span>
              <span style={styles.hoursBigValue}>{grandTotalHours.toFixed(1)}h</span>
            </div>
            <div style={styles.hoursColRight}>
              <span style={styles.hoursSubBadge}>💻 Coding Focus</span>
              <span style={styles.hoursSubValue}>{totalCodingHours.toFixed(1)}h</span>
            </div>
          </div>

          {/* Real Breakdown Stacked Bars */}
          <div style={styles.barChartSection}>
            <span style={styles.chartTitleLabel}>Category Breakdown</span>
            <div style={styles.categoryProgressRows}>
              <div style={styles.categoryItemRow}>
                <div style={styles.categoryLabelRow}>
                  <span>💻 Coding Session</span>
                  <span>{totalCodingHours.toFixed(1)} Hours</span>
                </div>
                <div style={styles.categoryBarTrack}>
                  <div
                    style={{
                      ...styles.categoryBarFill,
                      width: `${grandTotalHours > 0 ? Math.min(100, (totalCodingHours / grandTotalHours) * 100) : 0}%`,
                      backgroundColor: '#3b82f6',
                    }}
                  />
                </div>
              </div>

              <div style={styles.categoryItemRow}>
                <div style={styles.categoryLabelRow}>
                  <span>🧠 DSA Problem Solving</span>
                  <span>{totalDsaHours.toFixed(1)} Hours</span>
                </div>
                <div style={styles.categoryBarTrack}>
                  <div
                    style={{
                      ...styles.categoryBarFill,
                      width: `${grandTotalHours > 0 ? Math.min(100, (totalDsaHours / grandTotalHours) * 100) : 0}%`,
                      backgroundColor: '#8b5cf6',
                    }}
                  />
                </div>
              </div>

              <div style={styles.categoryItemRow}>
                <div style={styles.categoryLabelRow}>
                  <span>🎙️ Interview Prep</span>
                  <span>{totalInterviewHours.toFixed(1)} Hours</span>
                </div>
                <div style={styles.categoryBarTrack}>
                  <div
                    style={{
                      ...styles.categoryBarFill,
                      width: `${grandTotalHours > 0 ? Math.min(100, (totalInterviewHours / grandTotalHours) * 100) : 0}%`,
                      backgroundColor: '#f97316',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Real Log Count Summary Card */}
          <div style={styles.groupedProjectCard}>
            <div style={styles.groupedHeader}>
              <span style={styles.groupedTitle}>Logged Days Activity</span>
              <span style={{ fontSize: '0.85rem', fontWeight: '900', color: '#2563eb' }}>
                {logs.length} Entries
              </span>
            </div>
            <div style={styles.progressRingSummary}>
              <div style={styles.miniProgressTrack}>
                <div
                  style={{
                    ...styles.miniProgressBar,
                    width: `${Math.min(100, (logs.length / 30) * 100)}%`,
                  }}
                />
              </div>
              <span style={styles.progressTextValue}>
                {logs.length >= 30 ? '🔥 Monthly Goal Reached!' : `${Math.round((logs.length / 30) * 100)}% Monthly Target`}
              </span>
            </div>
          </div>
        </div>

        {/* COLUMN 3: CIRCULAR RING TIMER */}
        <div style={styles.screenCardWrapperActive}>
          <div style={styles.cardHeaderRow}>
            <h3 style={styles.cardHeaderTitle}>Timer</h3>
            <span style={styles.activeTimerTag}>⚡ Active Engine</span>
          </div>

          {/* Work / Break / Sprint Mode Selector */}
          <div style={styles.timerSubTabs}>
            <button
              onClick={() => handleModeSwitch('work')}
              style={{
                ...styles.modeTabBtn,
                ...(timerMode === 'work' ? styles.modeTabBtnActive : {}),
              }}
            >
              Work time
            </button>
            <button
              onClick={() => handleModeSwitch('break')}
              style={{
                ...styles.modeTabBtn,
                ...(timerMode === 'break' ? styles.modeTabBtnActive : {}),
              }}
            >
              Break time
            </button>
            <button
              onClick={() => handleModeSwitch('sprint')}
              style={{
                ...styles.modeTabBtn,
                ...(timerMode === 'sprint' ? styles.modeTabBtnActive : {}),
              }}
            >
              Sprint mode
            </button>
          </div>

          {/* Circular SVG Ring Timer Widget */}
          <div style={styles.circularGaugeContainer}>
            <svg width="250" height="250" style={styles.svgRing}>
              <circle
                cx="125"
                cy="125"
                r={radius}
                stroke="#e2e8f0"
                strokeWidth="14"
                fill="transparent"
              />
              <circle
                cx="125"
                cy="125"
                r={radius}
                stroke="#2563eb"
                strokeWidth="14"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                style={{ transition: 'stroke-dashoffset 0.5s ease' }}
              />
            </svg>

            <div style={styles.ringCenterContent}>
              <div style={styles.ringBellRow}>
                <span>🔔</span>
                <span style={styles.ringAlarmText}>Target Session</span>
              </div>
              <h2 style={styles.ringTimeBig}>{timeFormatted}</h2>
              <span style={styles.ringPercentBadge}>{progressPercent}% Elapsed</span>
            </div>
          </div>

          {/* Timer Controls */}
          <div style={styles.timerControlsGroup}>
            <button
              onClick={() => {
                setTimeLeft(initialTime);
                setIsRunning(false);
              }}
              style={styles.resetBtn}
            >
              🔄 Reset
            </button>
            <button
              onClick={() => setIsRunning(!isRunning)}
              style={{
                ...styles.mainPlayPauseBtn,
                backgroundColor: isRunning ? '#ef4444' : '#2563eb',
              }}
            >
              {isRunning ? 'Pause ⏸' : 'Start ▶'}
            </button>
          </div>
        </div>

      </div>

      {/* Motivational Ticker Footer */}
      <div style={styles.motivationalTickerFooter}>
        <div style={styles.tickerHeader}>
          <span>💡</span>
          <span style={styles.tickerTagText}>DAILY WISDOM & MOTIVATION</span>
          <button onClick={nextQuote} style={styles.sparkRefreshBtn}>
            ✨ Next Spark
          </button>
        </div>
        <p style={styles.tickerQuoteText}>
          "{INSPIRATIONAL_QUOTES[quoteIdx].text}" — <strong style={{ color: '#2563eb' }}>{INSPIRATIONAL_QUOTES[quoteIdx].author}</strong>
        </p>
      </div>
    </motion.div>
  );
}

// SLEEK PERIWINKLE BLUE DRIBBBLE DESIGN SYSTEM (Cleaner, no dummy code!)
const styles = {
  mainCanvasContainer: {
    backgroundColor: '#ebf2ff',
    borderRadius: '32px',
    padding: '2rem',
    fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif",
    color: '#1e293b',
    boxShadow: '0 20px 50px rgba(37, 99, 235, 0.12)',
    margin: '1.5rem 0',
  },
  topHeaderNav: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.75rem',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  brandTitleGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  brandIconDot: {
    fontSize: '2rem',
  },
  brandMainTitle: {
    fontSize: '1.8rem',
    fontWeight: '900',
    color: '#0f172a',
    margin: 0,
    letterSpacing: '-0.02em',
  },
  brandSubDate: {
    fontSize: '0.85rem',
    color: '#64748b',
    fontWeight: '700',
  },
  navigationTabsPills: {
    display: 'flex',
    backgroundColor: '#ffffff',
    padding: '0.35rem',
    borderRadius: '20px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
    border: '1px solid #e2e8f0',
    gap: '0.25rem',
  },
  tabPillBtn: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#64748b',
    padding: '0.5rem 1.1rem',
    borderRadius: '16px',
    fontSize: '0.88rem',
    fontWeight: '800',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  tabPillBtnActive: {
    backgroundColor: '#2563eb',
    color: '#ffffff',
    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
  },
  screensGrid3Column: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))',
    gap: '1.5rem',
    marginBottom: '1.5rem',
  },
  screenCardWrapper: {
    backgroundColor: '#ffffff',
    borderRadius: '28px',
    padding: '1.75rem',
    boxShadow: '0 10px 30px rgba(37, 99, 235, 0.06)',
    border: '1px solid #e2e8f0',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  screenCardWrapperActive: {
    backgroundColor: '#ffffff',
    borderRadius: '28px',
    padding: '1.75rem',
    boxShadow: '0 14px 35px rgba(37, 99, 235, 0.12)',
    border: '2px solid #2563eb',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  cardHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardHeaderTitle: {
    fontSize: '1.4rem',
    fontWeight: '900',
    color: '#0f172a',
    margin: 0,
  },
  addLogSmallBtn: {
    backgroundColor: '#2563eb',
    color: '#ffffff',
    border: 'none',
    padding: '0.4rem 0.85rem',
    borderRadius: '14px',
    fontSize: '0.8rem',
    fontWeight: '800',
    cursor: 'pointer',
  },
  dateSelectorBox: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    padding: '0.5rem 0.85rem',
    borderRadius: '14px',
    border: '1px solid #e2e8f0',
  },
  dateLabel: {
    fontSize: '0.8rem',
    fontWeight: '800',
    color: '#64748b',
  },
  dateInputField: {
    border: '1px solid #cbd5e1',
    borderRadius: '10px',
    padding: '0.25rem 0.5rem',
    fontSize: '0.82rem',
    fontFamily: 'inherit',
  },
  daysStripRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '0.35rem',
  },
  dayPillBox: {
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '0.4rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  dayLabelText: {
    fontSize: '0.8rem',
    fontWeight: '900',
    color: '#475569',
  },
  timelineList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.85rem',
  },
  emptyTaskState: {
    textAlign: 'center',
    padding: '2rem 1rem',
    backgroundColor: '#f8fafc',
    borderRadius: '20px',
    border: '1.5px dashed #cbd5e1',
  },
  emptyTaskText: {
    fontSize: '0.88rem',
    color: '#64748b',
    fontWeight: '600',
    margin: '0.5rem 0 1rem 0',
  },
  createTaskCtaBtn: {
    backgroundColor: '#2563eb',
    color: '#ffffff',
    border: 'none',
    padding: '0.6rem 1.25rem',
    borderRadius: '16px',
    fontSize: '0.85rem',
    fontWeight: '900',
    cursor: 'pointer',
  },
  realLogCard: {
    backgroundColor: '#f8fafc',
    borderRadius: '18px',
    padding: '1rem',
    border: '1px solid #e2e8f0',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  logCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logDateBadge: {
    fontSize: '0.75rem',
    fontWeight: '800',
    color: '#64748b',
  },
  logHoursBadge: {
    fontSize: '0.75rem',
    fontWeight: '900',
    color: '#2563eb',
    backgroundColor: '#eff6ff',
    padding: '0.2rem 0.5rem',
    borderRadius: '10px',
  },
  logJournalText: {
    fontSize: '0.88rem',
    fontWeight: '700',
    color: '#1e293b',
    margin: 0,
    lineHeight: '1.4',
  },
  metricsPillsRow: {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap',
  },
  metricPill: {
    fontSize: '0.7rem',
    fontWeight: '800',
    backgroundColor: '#ffffff',
    color: '#475569',
    padding: '0.2rem 0.5rem',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
  },
  reportsRangeTag: {
    fontSize: '0.75rem',
    fontWeight: '900',
    color: '#2563eb',
    backgroundColor: '#eff6ff',
    padding: '0.25rem 0.65rem',
    borderRadius: '12px',
  },
  trackerHoursSummaryCard: {
    backgroundColor: '#f8fafc',
    borderRadius: '20px',
    padding: '1rem 1.25rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    border: '1px solid #e2e8f0',
  },
  hoursCol: {
    display: 'flex',
    flexDirection: 'column',
  },
  hoursLabel: {
    fontSize: '0.75rem',
    fontWeight: '800',
    color: '#64748b',
  },
  hoursBigValue: {
    fontSize: '1.6rem',
    fontWeight: '900',
    color: '#0f172a',
  },
  hoursColRight: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  hoursSubBadge: {
    fontSize: '0.7rem',
    fontWeight: '900',
    color: '#2563eb',
  },
  hoursSubValue: {
    fontSize: '1.1rem',
    fontWeight: '900',
    color: '#1e293b',
  },
  barChartSection: {
    backgroundColor: '#ffffff',
    borderRadius: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.85rem',
  },
  chartTitleLabel: {
    fontSize: '0.82rem',
    fontWeight: '900',
    color: '#64748b',
  },
  categoryProgressRows: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.85rem',
  },
  categoryItemRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem',
  },
  categoryLabelRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.8rem',
    fontWeight: '800',
    color: '#334155',
  },
  categoryBarTrack: {
    width: '100%',
    height: '8px',
    backgroundColor: '#f1f5f9',
    borderRadius: '6px',
    overflow: 'hidden',
  },
  categoryBarFill: {
    height: '100%',
    borderRadius: '6px',
    transition: 'width 0.4s ease',
  },
  groupedProjectCard: {
    backgroundColor: '#f8fafc',
    borderRadius: '20px',
    padding: '1rem 1.25rem',
    border: '1px solid #e2e8f0',
  },
  groupedHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.65rem',
  },
  groupedTitle: {
    fontSize: '0.85rem',
    fontWeight: '900',
    color: '#0f172a',
  },
  progressRingSummary: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
  },
  miniProgressTrack: {
    width: '100%',
    height: '8px',
    backgroundColor: '#e2e8f0',
    borderRadius: '6px',
    overflow: 'hidden',
  },
  miniProgressBar: {
    height: '100%',
    background: 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)',
    borderRadius: '6px',
  },
  progressTextValue: {
    fontSize: '0.78rem',
    fontWeight: '800',
    color: '#2563eb',
  },
  activeTimerTag: {
    fontSize: '0.75rem',
    fontWeight: '900',
    color: '#10b981',
    backgroundColor: '#ecfdf5',
    padding: '0.2rem 0.55rem',
    borderRadius: '10px',
  },
  timerSubTabs: {
    display: 'flex',
    backgroundColor: '#f1f5f9',
    padding: '0.3rem',
    borderRadius: '16px',
    gap: '0.2rem',
  },
  modeTabBtn: {
    flex: 1,
    backgroundColor: 'transparent',
    border: 'none',
    color: '#64748b',
    padding: '0.45rem 0.5rem',
    borderRadius: '12px',
    fontSize: '0.78rem',
    fontWeight: '800',
    cursor: 'pointer',
  },
  modeTabBtnActive: {
    backgroundColor: '#2563eb',
    color: '#ffffff',
    boxShadow: '0 4px 10px rgba(37, 99, 235, 0.3)',
  },
  circularGaugeContainer: {
    position: 'relative',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    margin: '0.5rem 0',
  },
  svgRing: {
    transform: 'rotate(-90deg)',
  },
  ringCenterContent: {
    position: 'absolute',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  ringBellRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.3rem',
    fontSize: '0.8rem',
    color: '#64748b',
  },
  ringAlarmText: {
    fontWeight: '700',
  },
  ringTimeBig: {
    fontSize: '2.8rem',
    fontWeight: '900',
    color: '#0f172a',
    margin: '0.2rem 0',
    lineHeight: 1,
  },
  ringPercentBadge: {
    fontSize: '0.9rem',
    fontWeight: '900',
    color: '#2563eb',
  },
  timerControlsGroup: {
    display: 'flex',
    gap: '0.75rem',
  },
  resetBtn: {
    backgroundColor: '#f1f5f9',
    border: '1px solid #cbd5e1',
    color: '#475569',
    padding: '0.75rem 1.25rem',
    borderRadius: '16px',
    fontWeight: '800',
    fontSize: '0.88rem',
    cursor: 'pointer',
  },
  mainPlayPauseBtn: {
    flex: 1,
    color: '#ffffff',
    border: 'none',
    padding: '0.75rem 1.5rem',
    borderRadius: '16px',
    fontWeight: '900',
    fontSize: '0.92rem',
    cursor: 'pointer',
    boxShadow: '0 6px 18px rgba(37, 99, 235, 0.35)',
  },
  motivationalTickerFooter: {
    backgroundColor: '#ffffff',
    borderRadius: '20px',
    padding: '1.1rem 1.5rem',
    border: '1px solid #e2e8f0',
    boxShadow: '0 4px 14px rgba(0,0,0,0.03)',
  },
  tickerHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '0.35rem',
  },
  tickerTagText: {
    fontSize: '0.75rem',
    fontWeight: '900',
    color: '#2563eb',
    marginRight: 'auto',
    marginLeft: '0.4rem',
    letterSpacing: '0.5px',
  },
  sparkRefreshBtn: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#64748b',
    fontSize: '0.78rem',
    fontWeight: '800',
    cursor: 'pointer',
  },
  tickerQuoteText: {
    fontSize: '0.95rem',
    fontStyle: 'italic',
    color: '#334155',
    margin: 0,
    fontWeight: '600',
  },
};
