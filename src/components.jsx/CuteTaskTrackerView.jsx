import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const INITIAL_SECTIONS = {
  morning: [
    { id: 1, text: 'Builds seamless digital experiences', completed: true },
    { id: 2, text: 'Brush teeth & morning focus', completed: true },
    { id: 3, text: 'Set daily main priority', completed: true },
    { id: 4, text: '1 Hour deep focus coding', completed: false },
  ],
  afternoon: [
    { id: 5, text: 'Creating a seamless mobile app flow is essential', completed: true },
    { id: 6, text: 'Solve 1 DSA problem', completed: false },
    { id: 7, text: 'Code review & commits', completed: false },
  ],
  evening: [
    { id: 8, text: 'Update Daily Learning Log', completed: false },
    { id: 9, text: 'Export LinkedIn post summary', completed: false },
    { id: 10, text: 'Clear temporary git branches', completed: false },
  ],
  night: [
    { id: 11, text: 'Mark daily streak', completed: false },
    { id: 12, text: 'Prepare tomorrow goals', completed: false },
    { id: 13, text: 'Lights out & rest', completed: false },
  ],
};

export default function CuteTaskTrackerView() {
  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem('nixtio_flow_tasks');
    return saved ? JSON.parse(saved) : INITIAL_SECTIONS;
  });

  const [newTaskInput, setNewTaskInput] = useState({
    morning: '',
    afternoon: '',
    evening: '',
    night: '',
  });

  useEffect(() => {
    localStorage.setItem('nixtio_flow_tasks', JSON.stringify(tasks));
  }, [tasks]);

  const toggleTask = (section, id) => {
    setTasks((prev) => ({
      ...prev,
      [section]: prev[section].map((t) =>
        t.id === id ? { ...t, completed: !t.completed } : t
      ),
    }));
  };

  const addTask = (section) => {
    const text = newTaskInput[section].trim();
    if (!text) return;
    const newTask = {
      id: Date.now(),
      text: text,
      completed: false,
    };
    setTasks((prev) => ({
      ...prev,
      [section]: [...prev[section], newTask],
    }));
    setNewTaskInput((prev) => ({ ...prev, [section]: '' }));
  };

  const deleteTask = (section, id) => {
    setTasks((prev) => ({
      ...prev,
      [section]: prev[section].filter((t) => t.id !== id),
    }));
  };

  // Calculate overall stats
  const allTasks = [...tasks.morning, ...tasks.afternoon, ...tasks.evening, ...tasks.night];
  const completedCount = allTasks.filter((t) => t.completed).length;
  const totalCount = allTasks.length;
  const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div style={styles.outerCanvas}>
      <div style={styles.container}>
        {/* Navigation Bar */}
        <header style={styles.navbar}>
          <div style={styles.brandGroup}>
            <Link to="/" style={styles.backHomeBtn}>
              ← Back to Welcome Timer
            </Link>
            <span style={styles.brandTitle}>Task Management View</span>
          </div>

          <div style={styles.navActions}>
            <Link to="/login" style={styles.loginBtn}>
              Sign In
            </Link>
            <Link to="/register" style={styles.registerBtn}>
              Get Started
            </Link>
          </div>
        </header>

        {/* Task Management Board Frame */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={styles.boardFrame}
        >
          {/* Header */}
          <div style={styles.boardHeaderRow}>
            <div>
              <span style={styles.badgeLabel}>📋 NIXTIO TASK SYSTEM</span>
              <h1 style={styles.boardMainTitle}>Task Management Flow</h1>
              <p style={styles.boardSubTitle}>
                Manage your daily time blocks, code commits, and project milestones seamlessly.
              </p>
            </div>

            <div style={styles.completionPillBadge}>
              <span>🎯 {completedCount} / {totalCount} Tasks Complete ({percent}%)</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div style={styles.progressTrack}>
            <div style={{ ...styles.progressBar, width: `${percent}%` }} />
          </div>

          {/* 4 Task Columns */}
          <div style={styles.cardsGrid}>
            {/* Morning */}
            <div style={styles.taskCardBlue}>
              <div style={styles.cardHeader}>
                <span style={styles.cardTag}>⏰ MORNING SPRINT</span>
                <h3 style={styles.cardTitle}>08:30 - 12:00</h3>
              </div>

              <div style={styles.tasksList}>
                {tasks.morning.map((task) => (
                  <div key={task.id} style={styles.taskItem}>
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => toggleTask('morning', task.id)}
                      style={styles.checkbox}
                    />
                    <span style={{ ...styles.taskText, ...(task.completed ? styles.taskTextDone : {}) }}>
                      {task.text}
                    </span>
                    <button onClick={() => deleteTask('morning', task.id)} style={styles.delBtn}>×</button>
                  </div>
                ))}
              </div>

              <div style={styles.inputRow}>
                <input
                  type="text"
                  placeholder="+ Add morning task..."
                  value={newTaskInput.morning}
                  onChange={(e) => setNewTaskInput((prev) => ({ ...prev, morning: e.target.value }))}
                  onKeyDown={(e) => e.key === 'Enter' && addTask('morning')}
                  style={styles.inputField}
                />
                <button onClick={() => addTask('morning')} style={styles.addBtn}>Add</button>
              </div>
            </div>

            {/* Afternoon */}
            <div style={styles.taskCardPurple}>
              <div style={styles.cardHeader}>
                <span style={styles.cardTag}>☀️ AFTERNOON FOCUS</span>
                <h3 style={styles.cardTitle}>12:00 - 17:00</h3>
              </div>

              <div style={styles.tasksList}>
                {tasks.afternoon.map((task) => (
                  <div key={task.id} style={styles.taskItem}>
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => toggleTask('afternoon', task.id)}
                      style={styles.checkbox}
                    />
                    <span style={{ ...styles.taskText, ...(task.completed ? styles.taskTextDone : {}) }}>
                      {task.text}
                    </span>
                    <button onClick={() => deleteTask('afternoon', task.id)} style={styles.delBtn}>×</button>
                  </div>
                ))}
              </div>

              <div style={styles.inputRow}>
                <input
                  type="text"
                  placeholder="+ Add afternoon task..."
                  value={newTaskInput.afternoon}
                  onChange={(e) => setNewTaskInput((prev) => ({ ...prev, afternoon: e.target.value }))}
                  onKeyDown={(e) => e.key === 'Enter' && addTask('afternoon')}
                  style={styles.inputField}
                />
                <button onClick={() => addTask('afternoon')} style={styles.addBtn}>Add</button>
              </div>
            </div>

            {/* Evening */}
            <div style={styles.taskCardOrange}>
              <div style={styles.cardHeader}>
                <span style={styles.cardTag}>🎨 EVENING REVIEW</span>
                <h3 style={styles.cardTitle}>17:00 - 21:00</h3>
              </div>

              <div style={styles.tasksList}>
                {tasks.evening.map((task) => (
                  <div key={task.id} style={styles.taskItem}>
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => toggleTask('evening', task.id)}
                      style={styles.checkbox}
                    />
                    <span style={{ ...styles.taskText, ...(task.completed ? styles.taskTextDone : {}) }}>
                      {task.text}
                    </span>
                    <button onClick={() => deleteTask('evening', task.id)} style={styles.delBtn}>×</button>
                  </div>
                ))}
              </div>

              <div style={styles.inputRow}>
                <input
                  type="text"
                  placeholder="+ Add evening task..."
                  value={newTaskInput.evening}
                  onChange={(e) => setNewTaskInput((prev) => ({ ...prev, evening: e.target.value }))}
                  onKeyDown={(e) => e.key === 'Enter' && addTask('evening')}
                  style={styles.inputField}
                />
                <button onClick={() => addTask('evening')} style={styles.addBtn}>Add</button>
              </div>
            </div>

            {/* Night */}
            <div style={styles.taskCardTeal}>
              <div style={styles.cardHeader}>
                <span style={styles.cardTag}>🌙 NIGHT REFLECTION</span>
                <h3 style={styles.cardTitle}>21:00 - 23:59</h3>
              </div>

              <div style={styles.tasksList}>
                {tasks.night.map((task) => (
                  <div key={task.id} style={styles.taskItem}>
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => toggleTask('night', task.id)}
                      style={styles.checkbox}
                    />
                    <span style={{ ...styles.taskText, ...(task.completed ? styles.taskTextDone : {}) }}>
                      {task.text}
                    </span>
                    <button onClick={() => deleteTask('night', task.id)} style={styles.delBtn}>×</button>
                  </div>
                ))}
              </div>

              <div style={styles.inputRow}>
                <input
                  type="text"
                  placeholder="+ Add night task..."
                  value={newTaskInput.night}
                  onChange={(e) => setNewTaskInput((prev) => ({ ...prev, night: e.target.value }))}
                  onKeyDown={(e) => e.key === 'Enter' && addTask('night')}
                  style={styles.inputField}
                />
                <button onClick={() => addTask('night')} style={styles.addBtn}>Add</button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

const styles = {
  outerCanvas: {
    minHeight: '100vh',
    backgroundColor: '#ebf2ff',
    padding: '2rem 1.5rem',
    fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif",
    color: '#1e293b',
    boxSizing: 'border-box',
  },
  container: {
    maxWidth: '1280px',
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
    padding: '1rem 1.75rem',
    borderRadius: '24px',
    boxShadow: '0 8px 25px rgba(37, 99, 235, 0.08)',
    border: '1px solid #e2e8f0',
  },
  brandGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.25rem',
  },
  backHomeBtn: {
    color: '#2563eb',
    textDecoration: 'none',
    fontWeight: '800',
    fontSize: '0.88rem',
    backgroundColor: '#eff6ff',
    padding: '0.45rem 0.9rem',
    borderRadius: '16px',
    border: '1px solid #bfdbfe',
  },
  brandTitle: {
    fontSize: '1.25rem',
    fontWeight: '900',
    color: '#0f172a',
  },
  navActions: {
    display: 'flex',
    gap: '0.75rem',
  },
  loginBtn: {
    color: '#1e293b',
    textDecoration: 'none',
    fontWeight: '800',
    fontSize: '0.9rem',
    padding: '0.5rem 1rem',
  },
  registerBtn: {
    backgroundColor: '#2563eb',
    color: '#ffffff',
    textDecoration: 'none',
    padding: '0.6rem 1.25rem',
    borderRadius: '20px',
    fontWeight: '900',
    fontSize: '0.9rem',
    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
  },
  boardFrame: {
    backgroundColor: '#ffffff',
    borderRadius: '32px',
    padding: '2.25rem 2rem',
    boxShadow: '0 16px 40px rgba(37, 99, 235, 0.1)',
    border: '1px solid #e2e8f0',
  },
  boardHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '1.5rem',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  badgeLabel: {
    backgroundColor: '#eff6ff',
    color: '#2563eb',
    borderRadius: '16px',
    padding: '0.25rem 0.75rem',
    fontSize: '0.75rem',
    fontWeight: '900',
  },
  boardMainTitle: {
    fontSize: '2.4rem',
    fontWeight: '900',
    margin: '0.4rem 0',
    color: '#0f172a',
  },
  boardSubTitle: {
    fontSize: '0.95rem',
    color: '#64748b',
    margin: 0,
    fontWeight: '600',
  },
  completionPillBadge: {
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '20px',
    padding: '0.6rem 1.2rem',
    fontSize: '0.9rem',
    fontWeight: '900',
    color: '#2563eb',
  },
  progressTrack: {
    width: '100%',
    height: '10px',
    backgroundColor: '#f1f5f9',
    borderRadius: '10px',
    overflow: 'hidden',
    marginBottom: '2rem',
  },
  progressBar: {
    height: '100%',
    background: 'linear-gradient(90deg, #3b82f6 0%, #8b5cf6 50%, #f97316 100%)',
    borderRadius: '10px',
    transition: 'width 0.4s ease',
  },
  cardsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: '1.5rem',
  },
  taskCardBlue: {
    backgroundColor: '#ffffff',
    border: '2px solid #bfdbfe',
    borderRadius: '24px',
    padding: '1.5rem',
    boxShadow: '0 8px 20px rgba(59, 130, 246, 0.08)',
  },
  taskCardPurple: {
    backgroundColor: '#ffffff',
    border: '2px solid #ddd6fe',
    borderRadius: '24px',
    padding: '1.5rem',
    boxShadow: '0 8px 20px rgba(139, 92, 246, 0.08)',
  },
  taskCardOrange: {
    backgroundColor: '#ffffff',
    border: '2px solid #fed7aa',
    borderRadius: '24px',
    padding: '1.5rem',
    boxShadow: '0 8px 20px rgba(249, 115, 22, 0.08)',
  },
  taskCardTeal: {
    backgroundColor: '#ffffff',
    border: '2px solid #99f6e4',
    borderRadius: '24px',
    padding: '1.5rem',
    boxShadow: '0 8px 20px rgba(20, 184, 166, 0.08)',
  },
  cardHeader: {
    marginBottom: '1.25rem',
  },
  cardTag: {
    fontSize: '0.72rem',
    fontWeight: '900',
    color: '#2563eb',
  },
  cardTitle: {
    fontSize: '1.25rem',
    fontWeight: '900',
    color: '#0f172a',
    margin: '0.2rem 0 0 0',
  },
  tasksList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.65rem',
    marginBottom: '1.25rem',
  },
  taskItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.65rem',
    backgroundColor: '#f8fafc',
    padding: '0.6rem 0.75rem',
    borderRadius: '14px',
    border: '1px solid #e2e8f0',
  },
  checkbox: {
    width: '18px',
    height: '18px',
    accentColor: '#2563eb',
    cursor: 'pointer',
  },
  taskText: {
    fontSize: '0.88rem',
    fontWeight: '700',
    color: '#1e293b',
    flex: 1,
  },
  taskTextDone: {
    textDecoration: 'line-through',
    color: '#94a3b8',
  },
  delBtn: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#cbd5e1',
    fontSize: '1.1rem',
    cursor: 'pointer',
    fontWeight: '900',
  },
  inputRow: {
    display: 'flex',
    gap: '0.4rem',
  },
  inputField: {
    flex: 1,
    border: '1.5px solid #cbd5e1',
    borderRadius: '12px',
    padding: '0.45rem 0.75rem',
    fontSize: '0.82rem',
    fontFamily: 'inherit',
    outline: 'none',
  },
  addBtn: {
    backgroundColor: '#2563eb',
    color: '#ffffff',
    border: 'none',
    borderRadius: '12px',
    padding: '0.45rem 0.85rem',
    fontSize: '0.8rem',
    fontWeight: '900',
    cursor: 'pointer',
  },
};
