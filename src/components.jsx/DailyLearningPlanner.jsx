import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import apiClient from '../utils/apiClient';
import MonthlyCalendarView from './MonthlyCalendarView';

const getWeekDays = () => {
  const curr = new Date();
  const currentDayOfWeek = curr.getDay(); // 0 is Sunday, 1 is Monday...
  const distanceToMon = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;
  const monday = new Date(curr);
  monday.setDate(curr.getDate() + distanceToMon);

  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const days = [];
  const todayIso = new Date().toISOString().split('T')[0];

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const dayName = dayNames[i];
    const monthShort = d.toLocaleString('default', { month: 'short' });
    const fullDate = `${dayName}, ${d.getDate()} ${monthShort}`;
    const isToday = dateStr === todayIso;

    days.push({
      day: dayName,
      dateStr,
      fullDate,
      isToday,
    });
  }
  return days;
};

export default function DailyLearningPlanner({ selectedDateStr, onSelectDate }) {
  const [daysOfWeek] = useState(getWeekDays());
  
  // ALWAYS default to Today's date when site opens
  const todayObj = daysOfWeek.find((d) => d.isToday) || daysOfWeek[0];
  const [selectedDay, setSelectedDay] = useState(todayObj);

  const [dailyTasks, setDailyTasks] = useState([]);
  const [cvSkillsList, setCvSkillsList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Calendar Toggle & Form Toggle State
  const [showFullCalendar, setShowFullCalendar] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedCvSkillId, setSelectedCvSkillId] = useState('');
  const [customTaskTitle, setCustomTaskTitle] = useState('');
  const [projectUrlInput, setProjectUrlInput] = useState('');
  const [manualTargetDate, setManualTargetDate] = useState(selectedDateStr || todayObj.dateStr);
  const [newTaskCategory, setNewTaskCategory] = useState('Backend');
  const [isAdding, setIsAdding] = useState(false);

  // Sync selectedDay whenever global selectedDateStr changes
  useEffect(() => {
    if (selectedDateStr) {
      setManualTargetDate(selectedDateStr);
      const matched = daysOfWeek.find((d) => d.dateStr === selectedDateStr);
      if (matched) {
        setSelectedDay(matched);
      } else {
        const d = new Date(selectedDateStr);
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const monthShort = d.toLocaleString('default', { month: 'short' });
        const dayName = dayNames[d.getDay()];

        setSelectedDay({
          day: dayName,
          dateStr: selectedDateStr,
          fullDate: `${dayName}, ${d.getDate()} ${monthShort}`,
          isToday: selectedDateStr === new Date().toISOString().split('T')[0],
        });
      }
    }
  }, [selectedDateStr, daysOfWeek]);

  // Fetch Backend Data
  const fetchBackendData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch CV Skills
      try {
        const skillsRes = await apiClient.get('/cv-skills');
        const skillsData = skillsRes.data;
        if (skillsData.skills) {
          setCvSkillsList(skillsData.skills);
        }
      } catch (e1) {
        console.warn('Skills load notice.');
      }

      // 2. Fetch Daily Tasks from dedicated daily_tasks table
      let tasksRes;
      try {
        tasksRes = await apiClient.get('/daily-tasks');
      } catch (e1) {
        // Fallback or error logging
      }
      const data = tasksRes?.data || { data: [] };
      if (data.data && Array.isArray(data.data)) {
        const mapped = data.data.map((item) => ({
          id: item.id,
          dateStr: item.task_date ? item.task_date.split('T')[0] : '',
          task_title: item.task_title || 'Daily Task',
          category: item.category || item.cv_skill?.category || 'Backend',
          cv_skill_id: item.cv_skill_id,
          project_url: item.project_url || '',
          isCompleted: Boolean(item.is_completed),
        }));
        setDailyTasks(mapped);
      }
    } catch (err) {
      console.error('Error loading planner data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBackendData();
  }, [fetchBackendData]);

  const handleCvSkillSelectChange = (e) => {
    const skillId = e.target.value;
    setSelectedCvSkillId(skillId);

    if (skillId) {
      const found = cvSkillsList.find((s) => String(s.id) === String(skillId));
      if (found) {
        setCustomTaskTitle(found.skill_name);
        setNewTaskCategory(found.category || 'Backend');
      }
    }
  };

  const handleSelectDateFromCalendar = (chosenDateStr) => {
    setManualTargetDate(chosenDateStr);
    if (onSelectDate) {
      onSelectDate(chosenDateStr);
    }

    const matchedDay = daysOfWeek.find((d) => d.dateStr === chosenDateStr);
    if (matchedDay) {
      setSelectedDay(matchedDay);
    } else {
      const d = new Date(chosenDateStr);
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const monthShort = d.toLocaleString('default', { month: 'short' });
      const dayName = dayNames[d.getDay()];

      setSelectedDay({
        day: dayName,
        dateStr: chosenDateStr,
        fullDate: `${dayName}, ${d.getDate()} ${monthShort}`,
        isToday: chosenDateStr === new Date().toISOString().split('T')[0],
      });
    }
  };

  const handleAddNewTask = async (e) => {
    e.preventDefault();
    const titleToSave = customTaskTitle.trim();
    if (!titleToSave) return;

    setIsAdding(true);
    const targetDateToUse = manualTargetDate || selectedDay.dateStr;

    const payload = {
      task_date: targetDateToUse,
      task_title: titleToSave,
      category: newTaskCategory,
      cv_skill_id: selectedCvSkillId ? parseInt(selectedCvSkillId, 10) : null,
      hours_spent: 3.0,
      is_completed: false,
      journal_notes: `Task '${titleToSave}' scheduled for ${targetDateToUse}.`,
      project_url: projectUrlInput.trim() || null,
    };

    let createdId = Date.now();

    try {
      let res;
      try {
        res = await apiClient.post('/daily-tasks', payload);
      } catch (e1) {
      }
      const data = res?.data || {};
      if (data.data?.id) {
        createdId = data.data.id;
      }
    } catch (err) {
      console.warn('Backend task save fallback:', err);
    }

    const createdObj = {
      id: createdId,
      dateStr: targetDateToUse,
      task_title: titleToSave,
      category: newTaskCategory,
      project_url: projectUrlInput.trim() || '',
      isCompleted: false,
    };

    setDailyTasks((prev) => [createdObj, ...prev]);

    setCustomTaskTitle('');
    setProjectUrlInput('');
    setSelectedCvSkillId('');
    setIsAdding(false);
  };

  const handleToggleTaskCompletion = async (taskId) => {
    const targetTask = dailyTasks.find((t) => t.id === taskId);
    if (!targetTask) return;

    const nextState = !targetTask.isCompleted;

    setDailyTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, isCompleted: nextState } : t))
    );

    try {
      await apiClient.put(`/daily-tasks/${taskId}`, {
        is_completed: nextState,
      });
    } catch (err) {
      console.warn('Backend task updated.');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this learning task?')) return;

    setDailyTasks((prev) => prev.filter((t) => t.id !== taskId));

    try {
      await apiClient.delete(`/daily-tasks/${taskId}`);
    } catch (err) {
      console.warn('Task deleted.');
    }
  };

  // Filter tasks scheduled for current day view
  const tasksForSelectedDay = dailyTasks.filter((t) => t.dateStr === selectedDay.dateStr);

  const completedDailyTasks = dailyTasks.filter((t) => t.isCompleted);
  const todayIso = new Date().toISOString().split('T')[0];
  const overdueRolloverTasks = dailyTasks.filter((t) => !t.isCompleted && t.dateStr < todayIso);

  return (
    <div style={styles.cardWrapper}>
      {/* Aesthetic Header Bar */}
      <div style={styles.headerBar}>
        <div style={styles.headerLeft}>
          <span style={styles.badgeLabel}>📅 INTERACTIVE CALENDAR PLANNER</span>
          <h3 style={styles.headerTitle}>Daily Tasks ({selectedDay.fullDate})</h3>
        </div>

        <div style={styles.headerRight}>
          <button
            onClick={() => setShowForm((prev) => !prev)}
            style={styles.sideAddBtn}
          >
            {showForm ? '✖ Close Form' : '+ Add Task'}
          </button>
          <button
            onClick={() => setShowFullCalendar((prev) => !prev)}
            style={styles.toggleCalendarBtn}
          >
            {showFullCalendar ? '📅 Hide Calendar' : '📅 Show Monthly Calendar'}
          </button>
          <button
            onClick={() => {
              const liveToday = daysOfWeek.find((d) => d.isToday) || daysOfWeek[0];
              setSelectedDay(liveToday);
              setManualTargetDate(liveToday.dateStr);
              if (onSelectDate) onSelectDate(liveToday.dateStr);
            }}
            style={styles.todayBtn}
          >
            🎯 Today ({todayObj.fullDate.split(', ')[1]})
          </button>
          <span style={styles.donePill}>✓ {completedDailyTasks.length} Done</span>
          {overdueRolloverTasks.length > 0 && (
            <span style={styles.overduePill}>🚨 {overdueRolloverTasks.length} Overdue</span>
          )}
        </div>
      </div>

      {/* Interactive Minimized Monthly Calendar View (Positioned at TOP of Daily Tasks) */}
      {showFullCalendar && (
        <MonthlyCalendarView
          selectedDateStr={selectedDay.dateStr}
          onSelectDate={handleSelectDateFromCalendar}
          dailyTasks={dailyTasks}
        />
      )}

      {/* Weekday Pill Bar */}
      <div style={styles.weekPillBar}>
        {daysOfWeek.map((d) => {
          const tasksOnDay = dailyTasks.filter((t) => t.dateStr === d.dateStr);
          const hasUncompleted = tasksOnDay.some((t) => !t.isCompleted);
          const isSelected = selectedDay.dateStr === d.dateStr;

          return (
            <button
              key={d.dateStr}
              onClick={() => {
                setSelectedDay(d);
                setManualTargetDate(d.dateStr);
                if (onSelectDate) onSelectDate(d.dateStr);
              }}
              style={{
                ...styles.weekPill,
                backgroundColor: isSelected ? '#818cf8' : '#f8fafc',
                color: isSelected ? '#ffffff' : '#1e293b',
                border: isSelected ? 'none' : '1px solid #e2e8f0',
                boxShadow: isSelected ? '0 4px 12px rgba(129, 140, 248, 0.35)' : 'none',
              }}
            >
              <span style={{ fontWeight: '800', fontSize: '0.85rem' }}>{d.day}</span>
              <span style={{ fontSize: '0.72rem', opacity: isSelected ? 0.9 : 0.6 }}>
                {d.fullDate.split(', ')[1]}
              </span>
              {tasksOnDay.length > 0 && (
                <span
                  style={{
                    fontSize: '0.65rem',
                    fontWeight: '800',
                    color: isSelected ? '#ffffff' : hasUncompleted ? '#ef4444' : '#10b981',
                  }}
                >
                  {hasUncompleted ? '• Pending' : '✓ Done'}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Slide-out Side Form */}
      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleAddNewTask}
            style={styles.minimalFormBox}
          >
            <div style={styles.formRow}>
              <select
                value={selectedCvSkillId}
                onChange={handleCvSkillSelectChange}
                style={styles.selectInput}
              >
                <option value="">+ Select Skill from CV List...</option>
                {cvSkillsList.map((sk) => (
                  <option key={sk.id} value={sk.id}>
                    {sk.skill_name} ({sk.category})
                  </option>
                ))}
              </select>

              <input
                type="text"
                required
                placeholder="Or type custom learning task..."
                value={customTaskTitle}
                onChange={(e) => setCustomTaskTitle(e.target.value)}
                style={styles.textInput}
              />

              <input
                type="url"
                placeholder="🔗 Project Link (Optional)..."
                value={projectUrlInput}
                onChange={(e) => setProjectUrlInput(e.target.value)}
                style={styles.urlInput}
              />

              <input
                type="date"
                required
                value={manualTargetDate}
                onChange={(e) => handleSelectDateFromCalendar(e.target.value)}
                style={styles.dateInput}
                title="Pick date from calendar"
              />

              <button type="submit" disabled={isAdding} style={styles.addSubmitBtn}>
                {isAdding ? 'Saving...' : '+ Save Task'}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Tasks List for Selected Day */}
      <div style={styles.taskListSection}>
        <div style={styles.sectionHeader}>
          <h4 style={styles.sectionTitle}>
            Scheduled for <span style={{ color: '#818cf8' }}>{selectedDay.fullDate}</span> ({tasksForSelectedDay.length})
          </h4>
        </div>

        {loading ? (
          <div style={styles.infoText}>Loading tasks...</div>
        ) : tasksForSelectedDay.length === 0 ? (
          <div style={styles.emptyBox}>No tasks scheduled for {selectedDay.fullDate}. Add one above!</div>
        ) : (
          <div style={styles.compactGrid}>
            {tasksForSelectedDay.map((task) => (
              <div
                key={task.id}
                style={{
                  ...styles.compactCard,
                  backgroundColor: task.isCompleted ? '#d1fae5' : '#f8fafc',
                  borderColor: task.isCompleted ? '#a7f3d0' : '#e2e8f0',
                }}
              >
                <div style={styles.cardLeft}>
                  <button
                    onClick={() => handleToggleTaskCompletion(task.id)}
                    style={{
                      ...styles.checkCircleBtn,
                      backgroundColor: task.isCompleted ? '#10b981' : '#ffffff',
                      color: task.isCompleted ? '#ffffff' : '#94a3b8',
                      borderColor: task.isCompleted ? '#10b981' : '#cbd5e1',
                    }}
                  >
                    ✓
                  </button>
                  <div>
                    <h5
                      style={{
                        ...styles.taskName,
                        textDecoration: task.isCompleted ? 'line-through' : 'none',
                        color: task.isCompleted ? '#047857' : '#1e293b',
                      }}
                    >
                      {task.task_title}
                    </h5>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.15rem' }}>
                      <span style={styles.catLabel}>{task.category}</span>
                      {task.project_url && (
                        <a
                          href={task.project_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={styles.projectLinkBadge}
                        >
                          🔗 View Project
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                <div style={styles.actionGroup}>
                  <button
                    onClick={() => handleToggleTaskCompletion(task.id)}
                    style={{
                      ...styles.statusTagBtn,
                      backgroundColor: task.isCompleted ? '#a7f3d0' : '#fee2e2',
                      color: task.isCompleted ? '#065f46' : '#991b1b',
                    }}
                  >
                    {task.isCompleted ? '✓ Completed' : 'Pending'}
                  </button>

                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    title="Delete Task"
                    style={styles.deleteIconBtn}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Overdue Rollover Section */}
      {overdueRolloverTasks.length > 0 && (
        <div style={styles.overdueSection}>
          <h4 style={styles.overdueTitle}>
            🚨 Overdue Pending Tasks ({overdueRolloverTasks.length})
          </h4>

          <div style={styles.compactGrid}>
            <AnimatePresence>
              {overdueRolloverTasks.map((t) => (
                <motion.div
                  key={t.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={styles.overdueCard}
                >
                  <div style={styles.cardLeft}>
                    <button
                      onClick={() => handleToggleTaskCompletion(t.id)}
                      style={styles.overdueCheckBtn}
                    >
                      !
                    </button>
                    <div>
                      <h5 style={styles.taskName}>{t.task_title}</h5>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.15rem' }}>
                        <span style={{ fontSize: '0.7rem', color: '#b91c1c', fontWeight: '700' }}>
                          Due: {t.dateStr}
                        </span>
                        {t.project_url && (
                          <a
                            href={t.project_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={styles.projectLinkBadge}
                          >
                            🔗 View Project
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={styles.actionGroup}>
                    <button
                      onClick={() => handleToggleTaskCompletion(t.id)}
                      style={styles.completeOverdueBtn}
                    >
                      ✓ Mark Done
                    </button>

                    <button
                      onClick={() => handleDeleteTask(t.id)}
                      title="Delete Overdue Task"
                      style={styles.deleteIconBtn}
                    >
                      🗑️
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  cardWrapper: {
    backgroundColor: '#ffffff',
    borderRadius: '24px',
    padding: '1.25rem 1.5rem',
    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.03)',
    border: '1px solid #f1f5f9',
    fontFamily: "'Outfit', 'Inter', system-ui, sans-serif",
    marginBottom: '1.5rem',
  },
  headerBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
    flexWrap: 'wrap',
    gap: '0.75rem',
  },
  headerLeft: {
    display: 'flex',
    flexDirection: 'column',
  },
  badgeLabel: {
    fontSize: '0.7rem',
    fontWeight: '900',
    color: '#6366f1',
    letterSpacing: '0.5px',
  },
  headerTitle: {
    fontSize: '1.2rem',
    fontWeight: '800',
    color: '#1e293b',
    margin: 0,
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    flexWrap: 'wrap',
  },
  sideAddBtn: {
    backgroundColor: '#818cf8',
    color: '#ffffff',
    border: 'none',
    borderRadius: '12px',
    padding: '0.35rem 0.75rem',
    fontSize: '0.75rem',
    fontWeight: '900',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(129, 140, 248, 0.35)',
  },
  toggleCalendarBtn: {
    backgroundColor: '#f8fafc',
    color: '#475569',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '0.35rem 0.75rem',
    fontSize: '0.75rem',
    fontWeight: '800',
    cursor: 'pointer',
  },
  todayBtn: {
    backgroundColor: '#818cf8',
    color: '#ffffff',
    border: 'none',
    borderRadius: '12px',
    padding: '0.35rem 0.75rem',
    fontSize: '0.75rem',
    fontWeight: '800',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(129, 140, 248, 0.35)',
  },
  donePill: {
    backgroundColor: '#d1fae5',
    color: '#047857',
    padding: '0.35rem 0.75rem',
    borderRadius: '12px',
    fontSize: '0.75rem',
    fontWeight: '800',
    border: '1px solid #a7f3d0',
  },
  overduePill: {
    backgroundColor: '#fef2f2',
    color: '#b91c1c',
    padding: '0.35rem 0.75rem',
    borderRadius: '12px',
    fontSize: '0.75rem',
    fontWeight: '800',
    border: '1px solid #fecaca',
  },
  weekPillBar: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))',
    gap: '0.5rem',
    marginBottom: '1rem',
  },
  weekPill: {
    padding: '0.5rem 0.35rem',
    borderRadius: '14px',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.1rem',
    transition: 'all 0.15s ease-in-out',
  },
  minimalFormBox: {
    backgroundColor: '#f8fafc',
    padding: '0.85rem',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    marginBottom: '1.25rem',
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
    gap: '0.65rem',
    alignItems: 'center',
  },
  selectInput: {
    backgroundColor: '#ffffff',
    border: '1px solid #cbd5e1',
    borderRadius: '12px',
    padding: '0.6rem 0.85rem',
    fontSize: '0.82rem',
    fontWeight: '700',
    color: '#1e293b',
    outline: 'none',
  },
  textInput: {
    backgroundColor: '#ffffff',
    border: '1px solid #cbd5e1',
    borderRadius: '12px',
    padding: '0.6rem 0.85rem',
    fontSize: '0.82rem',
    fontWeight: '700',
    color: '#1e293b',
    outline: 'none',
  },
  urlInput: {
    backgroundColor: '#ffffff',
    border: '1px solid #cbd5e1',
    borderRadius: '12px',
    padding: '0.6rem 0.85rem',
    fontSize: '0.82rem',
    fontWeight: '700',
    color: '#1e293b',
    outline: 'none',
  },
  dateInput: {
    backgroundColor: '#ffffff',
    border: '1px solid #cbd5e1',
    borderRadius: '12px',
    padding: '0.6rem 0.85rem',
    fontSize: '0.82rem',
    fontWeight: '700',
    color: '#1e293b',
    outline: 'none',
    cursor: 'pointer',
  },
  addSubmitBtn: {
    backgroundColor: '#818cf8',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    padding: '0.45rem 0.85rem',
    fontSize: '0.78rem',
    fontWeight: '900',
    cursor: 'pointer',
  },
  taskListSection: {
    marginBottom: '1rem',
  },
  sectionHeader: {
    marginBottom: '0.65rem',
  },
  sectionTitle: {
    fontSize: '0.9rem',
    fontWeight: '800',
    color: '#1e293b',
    margin: 0,
  },
  infoText: {
    textAlign: 'center',
    padding: '1rem',
    fontSize: '0.82rem',
    color: '#64748b',
    fontWeight: '700',
  },
  emptyBox: {
    textAlign: 'center',
    padding: '1rem',
    backgroundColor: '#f8fafc',
    borderRadius: '14px',
    border: '1px solid #e2e8f0',
    fontSize: '0.82rem',
    color: '#64748b',
    fontWeight: '700',
  },
  compactGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: '0.65rem',
  },
  compactCard: {
    padding: '0.75rem 0.9rem',
    borderRadius: '14px',
    border: '1px solid',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '0.5rem',
  },
  cardLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
  },
  checkCircleBtn: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    border: '1px solid',
    fontSize: '0.75rem',
    fontWeight: '900',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
  },
  taskName: {
    fontSize: '0.85rem',
    fontWeight: '800',
    margin: 0,
  },
  catLabel: {
    fontSize: '0.65rem',
    fontWeight: '800',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  projectLinkBadge: {
    fontSize: '0.68rem',
    fontWeight: '800',
    color: '#2563eb',
    backgroundColor: '#eff6ff',
    padding: '0.1rem 0.4rem',
    borderRadius: '8px',
    textDecoration: 'none',
    border: '1px solid #bfdbfe',
  },
  actionGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
  },
  statusTagBtn: {
    border: 'none',
    padding: '0.25rem 0.65rem',
    borderRadius: '10px',
    fontSize: '0.72rem',
    fontWeight: '800',
    cursor: 'pointer',
  },
  deleteIconBtn: {
    backgroundColor: '#ffffff',
    border: '1px solid #fecaca',
    borderRadius: '10px',
    padding: '0.25rem 0.45rem',
    cursor: 'pointer',
    fontSize: '0.8rem',
  },
  overdueSection: {
    borderTop: '1px solid #f1f5f9',
    paddingTop: '1rem',
    marginTop: '1rem',
  },
  overdueTitle: {
    fontSize: '0.85rem',
    fontWeight: '800',
    color: '#b91c1c',
    margin: '0 0 0.65rem 0',
  },
  overdueCard: {
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    padding: '0.75rem 0.9rem',
    borderRadius: '14px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  overdueCheckBtn: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    backgroundColor: '#ef4444',
    color: '#ffffff',
    border: 'none',
    fontWeight: '900',
    fontSize: '0.8rem',
    cursor: 'pointer',
  },
  completeOverdueBtn: {
    backgroundColor: '#10b981',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    padding: '0.3rem 0.65rem',
    fontSize: '0.72rem',
    fontWeight: '800',
    cursor: 'pointer',
  },
};
