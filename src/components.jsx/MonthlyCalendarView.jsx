import React, { useState } from 'react';

export default function MonthlyCalendarView({ selectedDateStr, onSelectDate, dailyTasks = [] }) {
  const initialDate = selectedDateStr ? new Date(selectedDateStr) : new Date();
  const [currentYear, setCurrentYear] = useState(isNaN(initialDate.getFullYear()) ? new Date().getFullYear() : initialDate.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(isNaN(initialDate.getMonth()) ? new Date().getMonth() : initialDate.getMonth());

  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  const dayHeaders = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOffset = (year, month) => {
    const firstDay = new Date(year, month, 1).getDay();
    return firstDay === 0 ? 6 : firstDay - 1;
  };

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleResetToToday = () => {
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth());
    const todayIso = now.toISOString().split('T')[0];
    onSelectDate(todayIso);
  };

  const totalDays = getDaysInMonth(currentYear, currentMonth);
  const offset = getFirstDayOffset(currentYear, currentMonth);
  const todayIso = new Date().toISOString().split('T')[0];

  return (
    <div style={styles.compactCalendarCard}>
      {/* Month Header Navigation */}
      <div style={styles.calendarHeader}>
        <div style={styles.monthTitleGroup}>
          <span style={styles.monthTitle}>
            📅 {monthNames[currentMonth]} {currentYear}
          </span>
        </div>

        <div style={styles.navBtnGroup}>
          <button onClick={handlePrevMonth} style={styles.compactNavBtn} title="Previous Month">
            ◄
          </button>
          <button onClick={handleResetToToday} style={styles.compactTodayBtn} title="Jump to Today">
            Today
          </button>
          <button onClick={handleNextMonth} style={styles.compactNavBtn} title="Next Month">
            ►
          </button>
        </div>
      </div>

      {/* Days of Week Header */}
      <div style={styles.daysGridHeader}>
        {dayHeaders.map((dh, idx) => (
          <div key={idx} style={styles.headerCell}>
            {dh}
          </div>
        ))}
      </div>

      {/* Calendar Grid Cells */}
      <div style={styles.daysGridBody}>
        {/* Leading Empty Offsets */}
        {Array.from({ length: offset }).map((_, idx) => (
          <div key={`empty-${idx}`} style={styles.emptyCell} />
        ))}

        {/* Month Day Cells */}
        {Array.from({ length: totalDays }).map((_, idx) => {
          const dayNumber = idx + 1;
          const monthFormatted = String(currentMonth + 1).padStart(2, '0');
          const dayFormatted = String(dayNumber).padStart(2, '0');
          const dateStr = `${currentYear}-${monthFormatted}-${dayFormatted}`;

          const isSelected = selectedDateStr === dateStr;
          const isToday = todayIso === dateStr;

          const dateHasTask = dailyTasks.some((t) => {
            const logD = t.log_date ? t.log_date.split('T')[0] : (t.target_date || t.dateStr);
            return logD === dateStr;
          });

          return (
            <div
              key={`day-${dayNumber}`}
              onClick={() => onSelectDate(dateStr)}
              style={{
                ...styles.compactDayCell,
                backgroundColor: isSelected
                  ? '#4338ca'
                  : isToday
                  ? '#e0e7ff'
                  : '#ffffff',
                color: isSelected
                  ? '#ffffff'
                  : isToday
                  ? '#4338ca'
                  : '#1e293b',
                border: isSelected
                  ? 'none'
                  : isToday
                  ? '1.5px solid #818cf8'
                  : '1px solid #e2e8f0',
                fontWeight: isSelected || isToday ? '900' : '700',
                boxShadow: isSelected ? '0 4px 10px rgba(67, 56, 202, 0.35)' : 'none',
              }}
            >
              <span style={{ fontSize: '0.8rem', lineHeight: 1 }}>{dayNumber}</span>
              {dateHasTask && (
                <div
                  style={{
                    ...styles.miniTaskDot,
                    backgroundColor: isSelected ? '#ffffff' : '#10b981',
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const styles = {
  compactCalendarCard: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '0.6rem',
    fontFamily: "'Outfit', 'Inter', system-ui, sans-serif",
  },
  calendarHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.6rem',
  },
  monthTitleGroup: {
    display: 'flex',
    alignItems: 'center',
  },
  monthTitle: {
    fontSize: '0.88rem',
    fontWeight: '900',
    color: '#1e293b',
  },
  navBtnGroup: {
    display: 'flex',
    gap: '0.25rem',
  },
  compactNavBtn: {
    backgroundColor: '#ffffff',
    color: '#475569',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    padding: '0.2rem 0.5rem',
    fontSize: '0.7rem',
    fontWeight: '800',
    cursor: 'pointer',
  },
  compactTodayBtn: {
    backgroundColor: '#818cf8',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    padding: '0.2rem 0.6rem',
    fontSize: '0.7rem',
    fontWeight: '900',
    cursor: 'pointer',
  },
  daysGridHeader: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: '0.25rem',
    marginBottom: '0.25rem',
    textAlign: 'center',
  },
  headerCell: {
    fontSize: '0.68rem',
    fontWeight: '800',
    color: '#64748b',
    padding: '0.1rem 0',
  },
  daysGridBody: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: '0.25rem',
  },
  emptyCell: {
    minHeight: '28px',
  },
  compactDayCell: {
    minHeight: '28px',
    borderRadius: '10px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
    padding: '0.15rem',
    position: 'relative',
    transition: 'all 0.15s ease',
  },
  miniTaskDot: {
    width: '4px',
    height: '4px',
    borderRadius: '50%',
    marginTop: '2px',
  },
};
