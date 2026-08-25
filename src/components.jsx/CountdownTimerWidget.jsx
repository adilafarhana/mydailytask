import React, { useState, useEffect } from 'react';

export default function CountdownTimerWidget() {
  const startDateStr = '2026-08-24T00:00:00';
  const startDateObj = new Date(startDateStr);

  const [isRunning, setIsRunning] = useState(true);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    let timer = null;
    if (isRunning) {
      timer = setInterval(() => {
        setNow(new Date());
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRunning]);

  const diffMs = Math.max(0, now - startDateObj);
  const totalSeconds = Math.floor(diffMs / 1000);

  const days = Math.floor(totalSeconds / (3600 * 24));
  const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const handleReset = () => {
    setNow(new Date());
  };

  return (
    <div style={styles.cardContainer}>
      <div style={styles.headerRow}>
        <div style={styles.titleGroup}>
          <h4 style={styles.titleText}>Sprint Tracker</h4>
          <span style={styles.startDateText}>(Start Date: 24-08-2026)</span>
        </div>

        <div style={styles.actionsGroup}>
          <button
            onClick={() => setIsRunning(!isRunning)}
            style={{
              ...styles.actionBtn,
              backgroundColor: isRunning ? '#fff0f0' : '#ecfdf5',
              color: isRunning ? '#dc2626' : '#059669',
              border: isRunning ? '1px solid #fca5a5' : '1px solid #6ee7b7',
            }}
          >
            {isRunning ? '⏸ Pause' : '▶ Resume'}
          </button>
          <button onClick={handleReset} style={styles.resetBtn}>
            🔄 Reset
          </button>
        </div>
      </div>

      <div style={styles.timerDisplay}>
        <div style={styles.timeBox}>
          <span style={styles.digit}>{String(days).padStart(2, '0')}</span>
          <span style={styles.unit}>Days</span>
        </div>

        <span style={styles.colon}>:</span>

        <div style={styles.timeBox}>
          <span style={styles.digit}>{String(hours).padStart(2, '0')}</span>
          <span style={styles.unit}>Hours</span>
        </div>

        <span style={styles.colon}>:</span>

        <div style={styles.timeBox}>
          <span style={styles.digit}>{String(minutes).padStart(2, '0')}</span>
          <span style={styles.unit}>Mins</span>
        </div>

        <span style={styles.colon}>:</span>

        <div style={styles.timeBox}>
          <span style={styles.digit}>{String(seconds).padStart(2, '0')}</span>
          <span style={styles.unit}>Secs</span>
        </div>
      </div>
    </div>
  );
}

const styles = {
  cardContainer: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '1rem 1.25rem',
    border: '1px solid #e2e8f0',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)',
    marginBottom: '1rem',
    fontFamily: "'Outfit', 'Inter', system-ui, sans-serif",
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.85rem',
    flexWrap: 'wrap',
    gap: '0.5rem',
  },
  titleGroup: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '0.5rem',
  },
  titleText: {
    margin: 0,
    fontSize: '1rem',
    fontWeight: '900',
    color: '#1e293b',
  },
  startDateText: {
    fontSize: '0.78rem',
    color: '#64748b',
    fontWeight: '600',
  },
  actionsGroup: {
    display: 'flex',
    gap: '0.4rem',
  },
  actionBtn: {
    padding: '0.3rem 0.65rem',
    borderRadius: '8px',
    fontSize: '0.75rem',
    fontWeight: '800',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  resetBtn: {
    backgroundColor: '#f8fafc',
    color: '#475569',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    padding: '0.3rem 0.65rem',
    fontSize: '0.75rem',
    fontWeight: '800',
    cursor: 'pointer',
  },
  timerDisplay: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.85rem',
    backgroundColor: '#f8fafc',
    borderRadius: '12px',
    padding: '0.65rem 1rem',
    border: '1px solid #f1f5f9',
  },
  timeBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    minWidth: '48px',
  },
  digit: {
    fontSize: '1.5rem',
    fontWeight: '900',
    color: '#4338ca',
    lineHeight: 1,
  },
  unit: {
    fontSize: '0.65rem',
    fontWeight: '800',
    color: '#64748b',
    textTransform: 'uppercase',
    marginTop: '0.2rem',
  },
  colon: {
    fontSize: '1.25rem',
    fontWeight: '900',
    color: '#818cf8',
    marginBottom: '0.35rem',
  },
};
