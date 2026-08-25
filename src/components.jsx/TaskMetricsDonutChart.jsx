import React from 'react';

export default function TaskMetricsDonutChart() {
  const segments = [
    { label: 'Completed', value: 19, color: '#a7f3d0', text: '#065f46' },
    { label: 'Open', value: 11, color: '#c084fc', text: '#5b21b6' },
    { label: 'Accepted', value: 25, color: '#38bdf8', text: '#075985' },
    { label: 'Inprogress', value: 9, color: '#f472b6', text: '#831843' },
    { label: 'Overdue', value: 30, color: '#fb923c', text: '#7c2d12' },
    { label: 'Due Soon', value: 6, color: '#fde047', text: '#713f12' },
  ];

  // Calculate SVG strokeDasharray for donut chart
  const radius = 65;
  const circumference = 2 * Math.PI * radius;
  let accumulatedPercent = 0;

  return (
    <div style={styles.chartContainer}>
      <div style={styles.chartWrapper}>
        <svg width="180" height="180" viewBox="0 0 180 180">
          <g transform="rotate(-90 90 90)">
            {segments.map((seg, index) => {
              const strokeDasharray = `${(seg.value / 100) * circumference} ${circumference}`;
              const strokeDashoffset = -((accumulatedPercent / 100) * circumference);
              accumulatedPercent += seg.value;

              return (
                <circle
                  key={index}
                  cx="90"
                  cy="90"
                  r={radius}
                  fill="transparent"
                  stroke={seg.color}
                  strokeWidth="24"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  style={{ transition: 'all 0.4s ease' }}
                />
              );
            })}
          </g>
          {/* Donut Center Hole */}
          <circle cx="90" cy="90" r="45" fill="#ffffff" />
        </svg>

        {/* Labels Overlay */}
        <div style={styles.labelsOverlay}>
          <span style={styles.topLabel}>Completed</span>
          <span style={styles.topPercent}>19%</span>
          <span style={styles.rightLabel}>Open</span>
          <span style={styles.rightPercent}>11%</span>
          <span style={styles.acceptedLabel}>Accepted</span>
          <span style={styles.acceptedPercent}>25%</span>
          <span style={styles.bottomLabel}>Inprogress</span>
          <span style={styles.bottomPercent}>9%</span>
          <span style={styles.overdueLabel}>Overdue</span>
          <span style={styles.overduePercent}>30%</span>
          <span style={styles.dueSoonLabel}>Due Soon</span>
          <span style={styles.dueSoonPercent}>6%</span>
        </div>
      </div>
    </div>
  );
}

const styles = {
  chartContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '1.25rem 0.5rem',
    backgroundColor: '#ffffff',
    borderRadius: '24px',
    border: '1.5px solid #ffedd5',
    boxShadow: '0 8px 20px rgba(255, 122, 0, 0.05)',
    marginBottom: '1rem',
    position: 'relative',
  },
  chartWrapper: {
    position: 'relative',
    width: '260px',
    height: '220px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  labelsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
    fontFamily: "'Outfit', 'Inter', system-ui, sans-serif",
  },
  topLabel: {
    position: 'absolute',
    top: '2px',
    left: '50%',
    transform: 'translateX(-50%)',
    fontSize: '0.72rem',
    fontWeight: '800',
    color: '#404040',
  },
  topPercent: {
    position: 'absolute',
    top: '38px',
    left: '50%',
    transform: 'translateX(-50%)',
    fontSize: '0.75rem',
    fontWeight: '900',
    color: '#166534',
  },
  rightLabel: {
    position: 'absolute',
    top: '32px',
    right: '10px',
    fontSize: '0.72rem',
    fontWeight: '800',
    color: '#404040',
  },
  rightPercent: {
    position: 'absolute',
    top: '55px',
    right: '35px',
    fontSize: '0.75rem',
    fontWeight: '900',
    color: '#5b21b6',
  },
  acceptedLabel: {
    position: 'absolute',
    top: '95px',
    right: '0px',
    fontSize: '0.72rem',
    fontWeight: '800',
    color: '#404040',
  },
  acceptedPercent: {
    position: 'absolute',
    top: '115px',
    right: '32px',
    fontSize: '0.75rem',
    fontWeight: '900',
    color: '#075985',
  },
  bottomLabel: {
    position: 'absolute',
    bottom: '2px',
    left: '50%',
    transform: 'translateX(-50%)',
    fontSize: '0.72rem',
    fontWeight: '800',
    color: '#404040',
  },
  bottomPercent: {
    position: 'absolute',
    bottom: '40px',
    left: '50%',
    transform: 'translateX(-50%)',
    fontSize: '0.75rem',
    fontWeight: '900',
    color: '#9d174d',
  },
  overdueLabel: {
    position: 'absolute',
    top: '90px',
    left: '2px',
    fontSize: '0.72rem',
    fontWeight: '800',
    color: '#404040',
  },
  overduePercent: {
    position: 'absolute',
    top: '112px',
    left: '35px',
    fontSize: '0.75rem',
    fontWeight: '900',
    color: '#9a3412',
  },
  dueSoonLabel: {
    position: 'absolute',
    top: '32px',
    left: '5px',
    fontSize: '0.72rem',
    fontWeight: '800',
    color: '#404040',
  },
  dueSoonPercent: {
    position: 'absolute',
    top: '55px',
    left: '42px',
    fontSize: '0.75rem',
    fontWeight: '900',
    color: '#854d0e',
  },
};
