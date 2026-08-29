import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE = 'http://127.0.0.1:8000/api';

export default function CareerLaunchpadDashboard() {
  // Navigation active tab: 'focus' | 'vault' | 'roadmap' | 'review'
  const [activeTab, setActiveTab] = useState('focus');

  // Selected date string (YYYY-MM-DD) for Day-by-Day view
  const todayIso = new Date().toISOString().split('T')[0];
  const [selectedDateStr, setSelectedDateStr] = useState(todayIso);

  // Selected history date for Page 4 previous day details
  const [historyDetailDate, setHistoryDetailDate] = useState(todayIso);

  // Format selected date for header display (e.g., "August 27, 2026")
  const formatHeaderDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Helper to change date by delta days
  const shiftDate = (days) => {
    const current = new Date(selectedDateStr + 'T00:00:00');
    current.setDate(current.getDate() + days);
    setSelectedDateStr(current.toISOString().split('T')[0]);
  };

  // ----------------------------------------------------
  // CLEAN STATE MANAGEMENT (NO DEMO VALUES, RELIABLE PERSISTENCE)
  // ----------------------------------------------------

  // Daily Tasks State (Stored per date)
  const [dailyTasks, setDailyTasks] = useState(() => {
    const saved = localStorage.getItem('clp_daily_tasks_v2');
    return saved ? JSON.parse(saved) : [];
  });

  // Daily Logs & Stats by Date { '2026-08-27': { codingSeconds: 0, drillsCount: 0, notes: '' } }
  const [dailyLogsMap, setDailyLogsMap] = useState(() => {
    const saved = localStorage.getItem('clp_daily_logs_map');
    return saved ? JSON.parse(saved) : {};
  });

  // Helper functions for per-task estimation & timer
  const parseEstTimeToSeconds = (estStr) => {
    if (!estStr) return 1800;
    const lower = String(estStr).toLowerCase().trim();
    if (lower.endsWith('h')) {
      const hours = parseFloat(lower) || 1;
      return Math.round(hours * 3600);
    }
    if (lower.endsWith('m')) {
      const mins = parseFloat(lower) || 30;
      return Math.round(mins * 60);
    }
    const num = parseFloat(lower);
    if (!isNaN(num)) return Math.round(num * 60);
    return 1800;
  };

  const formatSecondsMMSS = (sec = 0) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Active Coding Timer State for Selected Date
  const [isTimerActive, setIsTimerActive] = useState(false);

  // Per-Task Countdown Timer State
  const [activeTaskTimerId, setActiveTaskTimerId] = useState(null);
  const [taskCountdownSeconds, setTaskCountdownSeconds] = useState(0);
  const [taskTimerIsRunning, setTaskTimerIsRunning] = useState(false);

  // Modal Popups State
  const [videoModalTask, setVideoModalTask] = useState(null);
  const [viewingVideoTask, setViewingVideoTask] = useState(null);
  const [selectedDetailTask, setSelectedDetailTask] = useState(null);
  const [completionPopupTask, setCompletionPopupTask] = useState(null);
  const [warningPopupTask, setWarningPopupTask] = useState(null);

  // Quick-Add Modal State
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState('skill');
  const [newTaskEstTime, setNewTaskEstTime] = useState('30m');
  const [newTaskProject, setNewTaskProject] = useState('');

  // Page 2: Question Vault State (Pre-populated with Adila's CV Projects)
  const [cvBullets, setCvBullets] = useState(() => {
    const saved = localStorage.getItem('clp_cv_bullets_v2');
    if (saved && JSON.parse(saved).length > 0) return JSON.parse(saved);
    return [
      {
        id: 1,
        project: 'Laravel MLM Platform (Bpract Software Solutions)',
        bulletText: 'Developed scalable web applications using PHP & Laravel, including complete MLM platform handling commission calculations, wallet transactions, and referral systems with Sanctum/Passport RBAC.',
        questions: [
          'How did you ensure database transaction isolation and prevent race conditions during high-frequency wallet transactions and multi-level commission payouts in Laravel?',
          'Walk me through your implementation of Role-Based Access Control (RBAC) and authentication using Laravel Sanctum and Passport.',
          'How did you optimize Eloquent ORM queries and MySQL indexes to prevent N+1 query bottlenecks in referral tree rendering?',
        ],
      },
      {
        id: 2,
        project: 'Online Vehicle Marketplace & Sales Platform',
        bulletText: 'Built full-stack platform handling bookings, payments, and order management with an admin dashboard forecasting model and complaint management modules.',
        questions: [
          'How did you design the schema for booking transactions and integrate third-party payment gateways securely using webhook signature validation?',
          'Explain the mathematical logic or algorithm behind the forecasting model in the admin dashboard. How did you optimize query performance for large dataset aggregations?',
        ],
      },
      {
        id: 3,
        project: 'Academic Task Management System (MERN Stack)',
        bulletText: 'Built task management platform tracking assignments, projects, and automated internal mark calculation reducing manual effort and supporting academic workflows.',
        questions: [
          'How did you automate the internal mark calculation engine, and how did you handle edge cases such as missing grades or weighted grade overrides in MongoDB?',
          'How did you structure RESTful API endpoints in Express/Node.js and manage asynchronous state in React to ensure fluid real-time updates?',
        ],
      },
    ];
  });

  const [newBulletText, setNewBulletText] = useState('');
  const [newBulletProject, setNewBulletProject] = useState('');
  const [vaultFilter, setVaultFilter] = useState('All'); // 'All' | 'Unmastered'
  const [expandedStarId, setExpandedStarId] = useState(null);

  // Page 3: Skill Roadmap & Kanban State (Clean User Data)
  const [skillTrees] = useState(() => {
    const saved = localStorage.getItem('clp_skill_trees_v2');
    return saved
      ? JSON.parse(saved)
      : [
          { id: 1, name: 'Next.js', level: 60, statusLabel: 'Practical', resourceUrl: 'https://nextjs.org/docs' },
          { id: 2, name: 'Docker', level: 40, statusLabel: 'Beginner', resourceUrl: 'https://docs.docker.com' },
          { id: 3, name: 'System Design', level: 30, statusLabel: 'Beginner', resourceUrl: 'https://github.com/donnemartin/system-design-primer' },
          { id: 4, name: 'Laravel API', level: 80, statusLabel: 'Ready for Interview', resourceUrl: 'https://laravel.com/docs' },
        ];
  });

  const [kanbanTasks, setKanbanTasks] = useState(() => {
    const saved = localStorage.getItem('clp_kanban_tasks_v2');
    return saved ? JSON.parse(saved) : [];
  });

  const [newKanbanTitle, setNewKanbanTitle] = useState('');
  const [newKanbanCategory, setNewKanbanCategory] = useState('Frontend');

  // Page 4: Weekly Review Goals State
  // Page: Achieving Career Goals State
  const [careerGoals, setCareerGoals] = useState(() => {
    const saved = localStorage.getItem('clp_career_goals_v3');
    return saved
      ? JSON.parse(saved)
      : [
          { id: 1, title: 'Become a Senior Full Stack Engineer', category: 'Career Goal', targetDate: '2026-12-31', progress: 75, isAchieved: false },
          { id: 2, title: 'Land a High-Paying Remote Developer Role', category: 'Job Target', targetDate: '2026-10-15', progress: 85, isAchieved: false },
          { id: 3, title: 'Master System Design & Microservices', category: 'Skill Mastery', targetDate: '2026-09-30', progress: 50, isAchieved: false },
        ];
  });

  const [isAddGoalModalOpen, setIsAddGoalModalOpen] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalCategory, setNewGoalCategory] = useState('Career Goal');
  const [newGoalTargetDate, setNewGoalTargetDate] = useState('2026-12-31');

  // ----------------------------------------------------
  // PERSISTENCE & TIMERS
  // ----------------------------------------------------

  useEffect(() => {
    localStorage.setItem('clp_daily_tasks_v2', JSON.stringify(dailyTasks));
  }, [dailyTasks]);

  useEffect(() => {
    localStorage.setItem('clp_daily_logs_map', JSON.stringify(dailyLogsMap));
  }, [dailyLogsMap]);

  useEffect(() => {
    localStorage.setItem('clp_cv_bullets_v2', JSON.stringify(cvBullets));
  }, [cvBullets]);

  useEffect(() => {
    localStorage.setItem('clp_skill_trees_v2', JSON.stringify(skillTrees));
  }, [skillTrees]);

  useEffect(() => {
    localStorage.setItem('clp_kanban_tasks_v2', JSON.stringify(kanbanTasks));
  }, [kanbanTasks]);

  useEffect(() => {
    localStorage.setItem('clp_career_goals_v3', JSON.stringify(careerGoals));
  }, [careerGoals]);

  // Current Date Log Getters & Setters
  const currentDateLog = dailyLogsMap[selectedDateStr] || {
    codingSeconds: 0,
    drillsCount: 0,
    notes: '',
  };

  const updateCurrentDateLog = (fields) => {
    setDailyLogsMap((prev) => ({
      ...prev,
      [selectedDateStr]: {
        ...(prev[selectedDateStr] || { codingSeconds: 0, drillsCount: 0, notes: '' }),
        ...fields,
      },
    }));
  };

  // Live Timer Effect for selected date
  useEffect(() => {
    let timer = null;
    if (isTimerActive) {
      timer = setInterval(() => {
        setDailyLogsMap((prev) => {
          const existing = prev[selectedDateStr] || { codingSeconds: 0, drillsCount: 0, notes: '' };
          return {
            ...prev,
            [selectedDateStr]: {
              ...existing,
              codingSeconds: (existing.codingSeconds || 0) + 1,
            },
          };
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isTimerActive, selectedDateStr]);

  // Per-Task Countdown Live Timer Effect
  useEffect(() => {
    let interval = null;
    if (taskTimerIsRunning && activeTaskTimerId) {
      interval = setInterval(() => {
        setTaskCountdownSeconds((prevSec) => {
          if (prevSec <= 1) {
            setTaskTimerIsRunning(false);
            setDailyTasks((prevTasks) =>
              prevTasks.map((t) =>
                t.id === activeTaskTimerId
                  ? { ...t, elapsedSeconds: (t.elapsedSeconds || 0) + 1 }
                  : t
              )
            );
            return 0;
          }
          setDailyTasks((prevTasks) =>
            prevTasks.map((t) =>
              t.id === activeTaskTimerId
                ? { ...t, elapsedSeconds: (t.elapsedSeconds || 0) + 1 }
                : t
            )
          );
          return prevSec - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [taskTimerIsRunning, activeTaskTimerId]);

  const startTaskTimer = (task) => {
    if (activeTaskTimerId === task.id && taskTimerIsRunning) {
      setTaskTimerIsRunning(false);
    } else if (activeTaskTimerId === task.id && !taskTimerIsRunning) {
      setTaskTimerIsRunning(true);
    } else {
      const initialSeconds = parseEstTimeToSeconds(task.estTime);
      setActiveTaskTimerId(task.id);
      setTaskCountdownSeconds(initialSeconds);
      setTaskTimerIsRunning(true);
    }
  };

  const handleTaskCheck = (task) => {
    if (task.isCompleted) {
      toggleTaskCompletion(task.id);
      return;
    }

    const isInterview = task.type === 'interview';
    const hasVideo = Boolean(task.videoUrl);

    if (isInterview && !hasVideo) {
      setWarningPopupTask(task);
    } else {
      toggleTaskCompletion(task.id);
      setCompletionPopupTask({
        ...task,
        isCompleted: true,
      });
    }
  };

  const setTaskReminder = (taskId) => {
    setDailyTasks((prev) => {
      const updated = prev.map((t) =>
        t.id === taskId ? { ...t, reminderSet: true } : t
      );
      localStorage.setItem('clp_daily_tasks_v2', JSON.stringify(updated));
      return updated;
    });
  };

  const handleSaveTaskVideo = (taskId, videoUrl) => {
    setDailyTasks((prev) => {
      const updated = prev.map((t) =>
        t.id === taskId ? { ...t, videoUrl, videoRecordedAt: new Date().toISOString() } : t
      );
      localStorage.setItem('clp_daily_tasks_v2', JSON.stringify(updated));
      return updated;
    });
  };

  const handleDeleteTaskVideo = (taskId) => {
    setDailyTasks((prev) => {
      const updated = prev.map((t) =>
        t.id === taskId ? { ...t, videoUrl: null, videoRecordedAt: null } : t
      );
      localStorage.setItem('clp_daily_tasks_v2', JSON.stringify(updated));
      return updated;
    });
  };

  // Backend Sync if available (preserves local task state)
  const loadBackendData = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/daily-tasks`);
      if (res.ok) {
        const json = await res.json();
        if (json.data && Array.isArray(json.data) && json.data.length > 0) {
          const savedLocal = localStorage.getItem('clp_daily_tasks_v2');
          const localTasks = savedLocal ? JSON.parse(savedLocal) : [];
          if (localTasks.length === 0) {
            const mapped = json.data.map((item, idx) => ({
              id: item.id || Date.now() + idx,
              taskDate: item.task_date || todayIso,
              type: item.category === 'Skill' ? 'skill' : item.category === 'Interview' ? 'interview' : 'coding',
              title: item.task_title || item.title || 'Task item',
              estTime: item.hours_spent ? `${Math.round(item.hours_spent * 60)}m` : '30m',
              isCompleted: Boolean(item.is_completed),
              project: item.project_url || '',
            }));
            setDailyTasks(mapped);
          }
        }
      }
    } catch (err) {
      console.log('Using local/cached dataset');
    }
  }, [todayIso]);

  useEffect(() => {
    loadBackendData();
  }, [loadBackendData]);

  // ----------------------------------------------------
  // COMPUTED VALUES FOR CURRENT DATE (DAY-BY-DAY)
  // ----------------------------------------------------

  // Filter tasks for ONLY the selected date
  const tasksForSelectedDate = dailyTasks.filter(
    (t) => (t.taskDate || todayIso) === selectedDateStr
  );

  const skillTasks = tasksForSelectedDate.filter((t) => t.type === 'skill');
  const codingTasks = tasksForSelectedDate.filter((t) => t.type === 'coding');
  const interviewTasks = tasksForSelectedDate.filter((t) => t.type === 'interview');

  // Completion Ring for Selected Date
  const totalTodayTasks = tasksForSelectedDate.length;
  const completedTodayTasks = tasksForSelectedDate.filter((t) => t.isCompleted).length;
  const completionPercentage =
    totalTodayTasks > 0 ? Math.round((completedTodayTasks / totalTodayTasks) * 100) : 0;

  // Active Streak Calculation (Consecutive days with at least 1 completed task)
  const calculateStreak = () => {
    let streak = 0;
    let checkDate = new Date();
    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0];
      const hasCompleted = dailyTasks.some(
        (t) => (t.taskDate || todayIso) === dateStr && t.isCompleted
      );
      if (hasCompleted) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  };
  const activeStreak = calculateStreak();

  // Format Seconds to Hours/Mins
  const formatHoursMins = (totalSec = 0) => {
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    return `${h}h ${m}m`;
  };

  // Readiness Score
  const masteredQuestionsCount = cvBullets.filter((b) => b.status === 'Mastered').length;
  const totalQuestionsCount = cvBullets.length || 1;
  const finishedKanbanCount = kanbanTasks.filter((k) => k.status === 'Completed').length;
  const totalKanbanCount = kanbanTasks.length || 1;

  const readinessScore = cvBullets.length === 0 && kanbanTasks.length === 0
    ? 0
    : Math.min(
        100,
        Math.round(
          (masteredQuestionsCount / totalQuestionsCount) * 50 + (finishedKanbanCount / totalKanbanCount) * 50
        )
      );

  // ----------------------------------------------------
  // FULL MONTHLY CALENDAR GRID & ACTIVITY TRACKER
  // ----------------------------------------------------
  const [calendarYearMonth, setCalendarYearMonth] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const [calendarViewMode, setCalendarViewMode] = useState('monthly'); // 'monthly' | '7day'

  const shiftCalendarMonth = (offset) => {
    setCalendarYearMonth((prev) => {
      let newMonth = prev.month + offset;
      let newYear = prev.year;
      if (newMonth > 11) {
        newMonth = 0;
        newYear++;
      } else if (newMonth < 0) {
        newMonth = 11;
        newYear--;
      }
      return { year: newYear, month: newMonth };
    });
  };

  const getMonthlyCalendarDays = (year, month) => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDayOfWeek = firstDay.getDay(); // 0 = Sun
    const totalDays = lastDay.getDate();

    const daysList = [];

    // Leading padding for days of week alignment
    for (let i = 0; i < startDayOfWeek; i++) {
      daysList.push(null);
    }

    for (let day = 1; day <= totalDays; day++) {
      const padM = String(month + 1).padStart(2, '0');
      const padD = String(day).padStart(2, '0');
      const dateStr = `${year}-${padM}-${padD}`;
      const dObj = new Date(year, month, day);
      const dayName = dObj.toLocaleDateString('en-US', { weekday: 'short' });

      const dayTasks = dailyTasks.filter((t) => (t.taskDate || todayIso) === dateStr);
      const completedCount = dayTasks.filter((t) => t.isCompleted).length;
      const log = dailyLogsMap[dateStr] || {};
      const hoursLogged = ((log.codingSeconds || 0) / 3600).toFixed(1);

      let level = 0;
      if (completedCount >= 5 || (log.codingSeconds || 0) >= 14400) level = 4;
      else if (completedCount >= 3 || (log.codingSeconds || 0) >= 7200) level = 3;
      else if (completedCount >= 1 || (log.codingSeconds || 0) >= 1800) level = 2;
      else if (dayTasks.length > 0) level = 1;

      daysList.push({
        dateStr,
        dayName,
        dayNum: day,
        completedCount,
        totalCount: dayTasks.length,
        hoursLogged: `${hoursLogged}h`,
        level,
        logNotes: log.notes || '',
        tasksList: dayTasks,
      });
    }

    return daysList;
  };

  const monthlyCalendarDays = getMonthlyCalendarDays(
    calendarYearMonth.year,
    calendarYearMonth.month
  );

  // Dynamic Past 7 Days List for Weekly Review (Activity Grid based on date)
  const getLast7Days = () => {
    const list = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      const dayNum = d.getDate();

      // Aggregate data for this past day
      const dayTasks = dailyTasks.filter((t) => (t.taskDate || todayIso) === dateStr);
      const completedCount = dayTasks.filter((t) => t.isCompleted).length;
      const log = dailyLogsMap[dateStr] || {};
      const hoursLogged = ((log.codingSeconds || 0) / 3600).toFixed(1);

      // Determine intensity level 0..4
      let level = 0;
      if (completedCount >= 5 || log.codingSeconds >= 14400) level = 4;
      else if (completedCount >= 3 || log.codingSeconds >= 7200) level = 3;
      else if (completedCount >= 1 || log.codingSeconds >= 1800) level = 2;
      else if (dayTasks.length > 0) level = 1;

      list.push({
        dateStr,
        dayName,
        dayNum,
        completedCount,
        totalCount: dayTasks.length,
        hoursLogged: `${hoursLogged}h`,
        level,
        logNotes: log.notes || '',
        tasksList: dayTasks,
      });
    }
    return list;
  };

  const activity7Days = getLast7Days();
  const selectedHistoryObj = (calendarViewMode === 'monthly' ? monthlyCalendarDays.filter(Boolean) : activity7Days).find((d) => d.dateStr === historyDetailDate) || activity7Days[6];

  // ----------------------------------------------------
  // HANDLERS
  // ----------------------------------------------------

  const toggleTaskCompletion = (id) => {
    setDailyTasks((prev) => {
      const updated = prev.map((task) =>
        task.id === id ? { ...task, isCompleted: !task.isCompleted } : task
      );
      localStorage.setItem('clp_daily_tasks_v2', JSON.stringify(updated));
      return updated;
    });

    // Try backend sync
    try {
      const target = dailyTasks.find((t) => t.id === id);
      if (target && typeof id === 'number' && id < 1000000) {
        fetch(`${API_BASE}/daily-tasks/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ is_completed: !target.isCompleted }),
        });
      }
    } catch (e) {}
  };

  const handleAddDailyTask = (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    const item = {
      id: Date.now(),
      taskDate: selectedDateStr,
      type: newTaskCategory,
      title: newTaskTitle.trim(),
      estTime: newTaskEstTime,
      project: newTaskProject.trim(),
      isCompleted: false,
    };
    setDailyTasks((prev) => {
      const updated = [...prev, item];
      localStorage.setItem('clp_daily_tasks_v2', JSON.stringify(updated));
      return updated;
    });
    setNewTaskTitle('');
    setNewTaskProject('');
    setIsTaskModalOpen(false);

    // Backend sync
    try {
      fetch(`${API_BASE}/daily-tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_date: selectedDateStr,
          task_title: item.title,
          category: newTaskCategory === 'skill' ? 'Skill' : newTaskCategory === 'interview' ? 'Interview' : 'Coding',
          is_completed: false,
        }),
      });
    } catch (e1) {}
  };

  const handleAddCvBullet = (e) => {
    e.preventDefault();
    if (!newBulletText.trim()) return;
    const newEntry = {
      id: Date.now(),
      project: newBulletProject.trim() || 'General Project',
      bulletText: newBulletText.trim(),
      questions: [
        `What key technical challenges did you solve in "${newBulletText.trim().substring(0, 30)}..."?`,
        'How did you validate performance and ensure fault tolerance?',
        'What would you design differently if you built this system again today?',
      ],
      star: {
        situation: 'Initial baseline context and problem statement.',
        task: 'Core technical objectives and requirements.',
        action: 'Step-by-step implementation, architectural pattern, and code decisions.',
        result: 'Measurable metric results and operational impact.',
      },
      status: 'Needs Practice',
    };
    setCvBullets((prev) => [newEntry, ...prev]);
    setNewBulletText('');
    setNewBulletProject('');
    setExpandedStarId(newEntry.id);
  };

  const updateStarField = (bulletId, field, val) => {
    setCvBullets((prev) =>
      prev.map((b) => (b.id === bulletId ? { ...b, star: { ...b.star, [field]: val } } : b))
    );
  };

  const updateBulletStatus = (bulletId, status) => {
    setCvBullets((prev) => prev.map((b) => (b.id === bulletId ? { ...b, status } : b)));
  };

  const handleMoveKanban = (taskId, targetStatus) => {
    setKanbanTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: targetStatus } : t)));
  };

  const handleAddKanbanTask = (e) => {
    e.preventDefault();
    if (!newKanbanTitle.trim()) return;
    const newTask = {
      id: Date.now(),
      title: newKanbanTitle.trim(),
      category: newKanbanCategory,
      status: 'To Do',
    };
    setKanbanTasks((prev) => [...prev, newTask]);
    setNewKanbanTitle('');
  };

  const handleAddCareerGoal = (e) => {
    e.preventDefault();
    if (!newGoalTitle.trim()) return;
    const newGoal = {
      id: Date.now(),
      title: newGoalTitle.trim(),
      category: newGoalCategory,
      targetDate: newGoalTargetDate || '2026-12-31',
      progress: 10,
      isAchieved: false,
    };
    setCareerGoals((prev) => [newGoal, ...prev]);
    setNewGoalTitle('');
    setIsAddGoalModalOpen(false);
  };


  const filteredBullets = cvBullets.filter((b) => {
    if (vaultFilter === 'Unmastered') return b.status !== 'Mastered';
    return true;
  });

  return (
    <div style={styles.appContainer}>
      {/* ==================================================== */}
      {/* LEFT NAVIGATION SIDEBAR                             */}
      {/* ==================================================== */}
      <aside style={styles.sidebar}>
        <div style={styles.logoSection}>
          <span style={styles.logoIcon}>🚀</span>
          <div>
            <h1 style={styles.logoText}>CAREER</h1>
            <span style={styles.logoSubtext}>LAUNCHPAD</span>
          </div>
        </div>

        <nav style={styles.navMenu}>
          <button
            onClick={() => setActiveTab('focus')}
            style={{
              ...styles.navButton,
              ...(activeTab === 'focus' ? styles.navButtonActive : {}),
            }}
          >
            <span style={styles.navIcon}>🎯</span>
            <span style={styles.navLabel}>TODAY'S FOCUS</span>
          </button>

          <button
            onClick={() => setActiveTab('vault')}
            style={{
              ...styles.navButton,
              ...(activeTab === 'vault' ? styles.navButtonActive : {}),
            }}
          >
            <span style={styles.navIcon}>❓</span>
            <span style={styles.navLabel}>QUESTION VAULT</span>
          </button>

          <button
            onClick={() => setActiveTab('roadmap')}
            style={{
              ...styles.navButton,
              ...(activeTab === 'roadmap' ? styles.navButtonActive : {}),
            }}
          >
            <span style={styles.navIcon}>🗺️</span>
            <span style={styles.navLabel}>ROADMAP</span>
          </button>

          <button
            onClick={() => setActiveTab('review')}
            style={{
              ...styles.navButton,
              ...(activeTab === 'review' ? styles.navButtonActive : {}),
            }}
          >
            <span style={styles.navIcon}>📊</span>
            <span style={styles.navLabel}>WEEKLY REVIEW</span>
          </button>
        </nav>

        <div style={styles.sidebarFooter}>
          <div style={styles.userBadge}>
            <span style={styles.userAvatar}>👩‍💻</span>
            <div>
              <div style={styles.userName}>Adila Farhana V V</div>
              <div style={styles.userRole}>Full Stack Engineer & Skill Master</div>
            </div>
          </div>
        </div>
      </aside>

      {/* ==================================================== */}
      {/* MAIN CONTENT AREA                                    */}
      {/* ==================================================== */}
      <main style={styles.mainContent}>
        {/* TOP HEADER BAR WITH DAY-BY-DAY DATE SELECTOR */}
        <header style={styles.headerBar}>
          <div>
            <div style={styles.dateSelectorRow}>
              <button onClick={() => shiftDate(-1)} style={styles.dateNavBtn}>◀ Prev</button>
              <input
                type="date"
                value={selectedDateStr}
                onChange={(e) => setSelectedDateStr(e.target.value)}
                style={styles.datePickerInput}
              />
              <button onClick={() => shiftDate(1)} style={styles.dateNavBtn}>Next ▶</button>
              {selectedDateStr !== todayIso && (
                <button onClick={() => setSelectedDateStr(todayIso)} style={styles.todayResetBtn}>
                  Today
                </button>
              )}
            </div>

            <h2 style={styles.headerTitle}>
              {activeTab === 'focus' && `${formatHeaderDate(selectedDateStr).toUpperCase()} FOCUS`}
              {activeTab === 'vault' && 'CV & INTERVIEW QUESTION VAULT'}
              {activeTab === 'roadmap' && 'PROJECT & SKILL ROADMAP'}
              {activeTab === 'review' && 'WEEKLY REVIEW & CONSISTENCY TRACKER'}
            </h2>
          </div>

          <div style={styles.headerRightGroup}>
            {/* Daily Completion Ring Widget */}
            <div style={styles.completionRingWidget}>
              <svg width="48" height="48" viewBox="0 0 48 48">
                <circle cx="24" cy="24" r="18" fill="none" stroke="#1e293b" strokeWidth="4" />
                <circle
                  cx="24"
                  cy="24"
                  r="18"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="4"
                  strokeDasharray="113.097"
                  strokeDashoffset={113.097 - (113.097 * completionPercentage) / 100}
                  strokeLinecap="round"
                  transform="rotate(-90 24 24)"
                  style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                />
              </svg>
              <div style={styles.completionTextGroup}>
                <span style={styles.completionRatioText}>
                  {completedTodayTasks}/{totalTodayTasks}
                </span>
                <span style={styles.completionSubLabel}>TASKS DONE</span>
              </div>
            </div>

            {/* Quick-add button */}
            <button onClick={() => setIsTaskModalOpen(true)} style={styles.quickAddBtn}>
              + ADD DAILY TASK
            </button>
          </div>
        </header>

        {/* PAGE 1: TODAY'S FOCUS DASHBOARD (DAY-BY-DAY DETAILS ONLY) */}
        {activeTab === 'focus' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* PERSONALIZED WELCOME BANNER FOR ADILA FARHANA V V */}
            <div
              style={{
                background: 'linear-gradient(135deg, #e0e7ff 0%, #fae8ff 100%)',
                border: '1px solid #818cf8',
                borderRadius: '16px',
                padding: '16px 20px',
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'center',
                justify: 'space-between',
                boxShadow: '0 4px 14px rgba(99, 102, 241, 0.1)',
                gap: '14px',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ fontSize: '36px' }}>👩‍💻</div>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: '800', color: '#1e1b4b' }}>
                    Welcome back, Adila Farhana V V! 👋
                  </div>
                  <div style={{ fontSize: '13px', color: '#4338ca', fontWeight: '600', marginTop: '3px' }}>
                    🎯 <strong>Personal Mission:</strong> Continuous Skill Growth, Knowledge Expansion & Landing your Dream Job!
                  </div>
                </div>
              </div>
              <div style={{ backgroundColor: '#ffffff', color: '#4338ca', border: '1px solid #c7d2fe', padding: '6px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: '700' }}>
                🌟 Adila's Launchpad
              </div>
            </div>

            {/* TOP STATS ROW FOR SELECTED DATE */}
            <div style={styles.statsRow}>
              {/* Mini Card 1: Today's Coding Time & LeetCode Problem Solved Counter */}
              <div style={{ ...styles.statCard, background: 'linear-gradient(135deg, #c7d2fe 0%, #a5b4fc 100%)', border: '1px solid #818cf8', boxShadow: '0 4px 16px rgba(99, 102, 241, 0.15)' }}>
                <div style={styles.statHeader}>
                  <span style={{ ...styles.statLabel, color: '#1e1b4b' }}>CODING TIME ({formatHeaderDate(selectedDateStr)})</span>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <a
                      href="https://leetcode.com/problemset/all/"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        backgroundColor: '#ffffff',
                        color: '#4f46e5',
                        border: '1px solid #818cf8',
                        padding: '4px 10px',
                        borderRadius: '8px',
                        fontSize: '11px',
                        fontWeight: '700',
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                      }}
                    >
                      🔗 Open LeetCode
                    </a>
                    <button
                      onClick={() => setIsTimerActive(!isTimerActive)}
                      style={{
                        ...styles.timerToggleBtn,
                        backgroundColor: isTimerActive ? '#ef4444' : '#4f46e5',
                      }}
                    >
                      {isTimerActive ? '⏸ Pause' : '▶ Start'}
                    </button>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={styles.statValueRow}>
                    <span style={styles.statIcon}>⏱️</span>
                    <span style={{ ...styles.statMainValue, color: '#1e1b4b' }}>{formatHoursMins(currentDateLog.codingSeconds)}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(255, 255, 255, 0.75)', padding: '6px 12px', borderRadius: '10px', border: '1px solid #818cf8' }}>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#1e1b4b' }}>
                      💻 {currentDateLog.solvedProblemsCount || 0} Solved
                    </span>
                    <button
                      onClick={() =>
                        updateCurrentDateLog({ solvedProblemsCount: (currentDateLog.solvedProblemsCount || 0) + 1 })
                      }
                      title="Log +1 solved LeetCode problem"
                      style={{
                        backgroundColor: '#4f46e5',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '4px 8px',
                        fontSize: '11px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        boxShadow: '0 2px 4px rgba(79, 70, 229, 0.25)',
                      }}
                    >
                      +1 Code
                    </button>
                  </div>
                </div>
              </div>

              {/* Mini Card 2: Interview Drills Completed */}
              <div style={{ ...styles.statCard, background: 'linear-gradient(135deg, #f5d0fe 0%, #f0abfc 100%)', border: '1px solid #e879f9', boxShadow: '0 4px 16px rgba(217, 70, 239, 0.15)' }}>
                <div style={styles.statHeader}>
                  <span style={{ ...styles.statLabel, color: '#701a75' }}>INTERVIEW DRILLS COMPLETED</span>
                  <button
                    onClick={() =>
                      updateCurrentDateLog({ drillsCount: (currentDateLog.drillsCount || 0) + 1 })
                    }
                    style={{ ...styles.incrementBtn, backgroundColor: '#fae8ff', color: '#86198f', border: '1px solid #f0abfc' }}
                  >
                    + Log Drill
                  </button>
                </div>
                <div style={styles.statValueRow}>
                  <span style={styles.statIcon}>🎧</span>
                  <span style={{ ...styles.statMainValue, color: '#701a75' }}>
                    {currentDateLog.drillsCount || 0} questions
                  </span>
                </div>
              </div>

              {/* Mini Card 3: Active Streak */}
              <div style={{ ...styles.statCard, background: 'linear-gradient(135deg, #fde68a 0%, #fcd34d 100%)', border: '1px solid #fbbf24', boxShadow: '0 4px 16px rgba(245, 158, 11, 0.15)' }}>
                <div style={styles.statHeader}>
                  <span style={{ ...styles.statLabel, color: '#78350f' }}>ACTIVE STREAK</span>
                  <span style={{ ...styles.fireBadge, backgroundColor: '#ffffff', color: '#b45309', border: '1px solid #f59e0b' }}>Active</span>
                </div>
                <div style={styles.statValueRow}>
                  <span style={styles.statIcon}>🔥</span>
                  <span style={{ ...styles.statMainValue, color: '#78350f' }}>{activeStreak} days</span>
                </div>
              </div>
            </div>

            {/* MAIN SECTION: 3 DAILY TASK COLUMNS FOR SELECTED DATE */}
            <div style={styles.taskColumnsGrid}>
              {/* COLUMN 1: 🔵 Skill Learning */}
              <div style={styles.taskColumnCard}>
                <div style={{ ...styles.columnTitleHeader, backgroundColor: '#e0e7ff', padding: '6px 12px', borderRadius: '10px', borderLeft: '4px solid #6366f1' }}>
                  <span style={styles.blueDot}>🔵</span>
                  <h3 style={{ ...styles.columnTitleText, color: '#3730a3' }}>SKILL LEARNING</h3>
                </div>

                <div style={styles.taskList}>
                  {skillTasks.length === 0 ? (
                    <div style={styles.emptyStateNotice}>No skill items for this date</div>
                  ) : (
                    skillTasks.map((task) => {
                      const isTimerActiveForThis = activeTaskTimerId === task.id && taskTimerIsRunning;
                      return (
                        <div
                          key={task.id}
                          style={{
                            ...styles.taskCardItemContainer,
                            opacity: task.isCompleted ? 0.6 : 1,
                            borderColor: isTimerActiveForThis ? '#6366f1' : '#e2e8f0',
                            boxShadow: isTimerActiveForThis ? '0 0 12px rgba(99, 102, 241, 0.4)' : '0 2px 8px rgba(0,0,0,0.03)',
                          }}
                        >
                          {/* TOP ROW: Checkbox + Full Task Title + Estimated Time Badge */}
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                              <input
                                type="checkbox"
                                checked={Boolean(task.isCompleted)}
                                onChange={() => handleTaskCheck(task)}
                                style={styles.checkboxInput}
                              />
                              <span
                                onClick={() => setSelectedDetailTask(task)}
                                title="Click to view full task details"
                                style={{
                                  ...styles.taskItemTitle,
                                  textDecoration: task.isCompleted ? 'line-through' : 'none',
                                  fontSize: '14px',
                                  fontWeight: '600',
                                  color: '#0f172a',
                                  wordBreak: 'break-word',
                                  cursor: 'pointer',
                                }}
                              >
                                {task.title}
                              </span>
                            </div>
                            <span style={styles.timeBadge}>⏱️ {task.estTime || '30m'}</span>
                          </div>

                          {/* BOTTOM ROW: Badges & Action Buttons */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', paddingTop: '8px', borderTop: '1px solid #283548', marginTop: '6px' }}>
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                              {task.reminderSet && (
                                <span style={styles.reminderBadge}>🔔 Reminder Set</span>
                              )}
                              {task.videoUrl && (
                                <span style={styles.videoBadge}>📹 Video Saved ✅</span>
                              )}
                            </div>

                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                              <button
                                type="button"
                                onClick={() => startTaskTimer(task)}
                                style={{
                                  ...styles.timerTriggerBtn,
                                  backgroundColor: isTimerActiveForThis ? '#ef4444' : '#3b82f6',
                                }}
                              >
                                {isTimerActiveForThis
                                  ? `⏸ ${formatSecondsMMSS(taskCountdownSeconds)}`
                                  : '▶ Timer'}
                              </button>

                              {task.videoUrl ? (
                                <button
                                  type="button"
                                  onClick={() => setViewingVideoTask(task)}
                                  style={{
                                    ...styles.videoRecordBtn,
                                    backgroundColor: '#10b981',
                                  }}
                                >
                                  🎬 View Video
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setVideoModalTask(task)}
                                  style={{
                                    ...styles.videoRecordBtn,
                                    backgroundColor: '#6366f1',
                                  }}
                                >
                                  📷 Record
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <button
                  onClick={() => {
                    setNewTaskCategory('skill');
                    setIsTaskModalOpen(true);
                  }}
                  style={styles.addChecklistBtn}
                >
                  + Add checklist
                </button>
              </div>

              {/* COLUMN 2: 🟢 Project Coding */}
              <div style={styles.taskColumnCard}>
                <div style={{ ...styles.columnTitleHeader, backgroundColor: '#dcfce7', padding: '6px 12px', borderRadius: '10px', borderLeft: '4px solid #22c55e' }}>
                  <span style={styles.greenDot}>🟢</span>
                  <h3 style={{ ...styles.columnTitleText, color: '#14532d' }}>PROJECT CODING</h3>
                </div>

                <div style={styles.taskList}>
                  {codingTasks.length === 0 ? (
                    <div style={styles.emptyStateNotice}>No coding tasks for this date</div>
                  ) : (
                    codingTasks.map((task) => {
                      const isTimerActiveForThis = activeTaskTimerId === task.id && taskTimerIsRunning;
                      return (
                        <div
                          key={task.id}
                          style={{
                            ...styles.taskCardItemContainer,
                            opacity: task.isCompleted ? 0.6 : 1,
                            borderColor: isTimerActiveForThis ? '#6366f1' : '#e2e8f0',
                            boxShadow: isTimerActiveForThis ? '0 0 12px rgba(99, 102, 241, 0.4)' : '0 2px 8px rgba(0,0,0,0.03)',
                          }}
                        >
                          {/* TOP ROW: Checkbox + Full Task Title + Estimated Time Badge */}
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                              <input
                                type="checkbox"
                                checked={Boolean(task.isCompleted)}
                                onChange={() => handleTaskCheck(task)}
                                style={styles.checkboxInput}
                              />
                              <span
                                onClick={() => setSelectedDetailTask(task)}
                                title="Click to view full task details"
                                style={{
                                  ...styles.taskItemTitle,
                                  textDecoration: task.isCompleted ? 'line-through' : 'none',
                                  fontSize: '14px',
                                  fontWeight: '600',
                                  color: '#0f172a',
                                  wordBreak: 'break-word',
                                  cursor: 'pointer',
                                }}
                              >
                                {task.title}
                              </span>
                            </div>
                            <span style={styles.timeBadge}>⏱️ {task.estTime || '30m'}</span>
                          </div>

                          {/* BOTTOM ROW: Badges & Action Buttons */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', paddingTop: '8px', borderTop: '1px solid #283548', marginTop: '6px' }}>
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                              {task.project && (
                                <span style={styles.projectTagLink}>🔗 {task.project}</span>
                              )}
                              {task.reminderSet && (
                                <span style={styles.reminderBadge}>🔔 Reminder Set</span>
                              )}
                              {task.videoUrl && (
                                <span style={styles.videoBadge}>📹 Video Saved ✅</span>
                              )}
                            </div>

                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                              <button
                                type="button"
                                onClick={() => startTaskTimer(task)}
                                style={{
                                  ...styles.timerTriggerBtn,
                                  backgroundColor: isTimerActiveForThis ? '#ef4444' : '#10b981',
                                }}
                              >
                                {isTimerActiveForThis
                                  ? `⏸ ${formatSecondsMMSS(taskCountdownSeconds)}`
                                  : '▶ Timer'}
                              </button>

                              {task.videoUrl ? (
                                <button
                                  type="button"
                                  onClick={() => setViewingVideoTask(task)}
                                  style={{
                                    ...styles.videoRecordBtn,
                                    backgroundColor: '#10b981',
                                  }}
                                >
                                  🎬 View Video
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setVideoModalTask(task)}
                                  style={{
                                    ...styles.videoRecordBtn,
                                    backgroundColor: '#6366f1',
                                  }}
                                >
                                  📷 Record
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <button
                  onClick={() => {
                    setNewTaskCategory('coding');
                    setIsTaskModalOpen(true);
                  }}
                  style={styles.addChecklistBtn}
                >
                  + Add checklist
                </button>
              </div>

              {/* COLUMN 3: 🟠 Interview Rehearsal */}
              <div style={styles.taskColumnCard}>
                <div style={{ ...styles.columnTitleHeader, backgroundColor: '#fef3c7', padding: '6px 12px', borderRadius: '10px', borderLeft: '4px solid #f59e0b' }}>
                  <span style={styles.orangeDot}>🟠</span>
                  <h3 style={{ ...styles.columnTitleText, color: '#78350f' }}>INTERVIEW REHEARSAL</h3>
                </div>

                <div style={styles.taskList}>
                  {interviewTasks.length === 0 ? (
                    <div style={styles.emptyStateNotice}>No interview drills for this date</div>
                  ) : (
                    interviewTasks.map((task) => {
                      const isTimerActiveForThis = activeTaskTimerId === task.id && taskTimerIsRunning;
                      return (
                        <div
                          key={task.id}
                          style={{
                            ...styles.taskCardItemContainer,
                            opacity: task.isCompleted ? 0.6 : 1,
                            borderColor: isTimerActiveForThis ? '#6366f1' : '#e2e8f0',
                            boxShadow: isTimerActiveForThis ? '0 0 12px rgba(99, 102, 241, 0.4)' : '0 2px 8px rgba(0,0,0,0.03)',
                          }}
                        >
                          {/* TOP ROW: Checkbox + Full Task Title + Estimated Time Badge */}
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                              <input
                                type="checkbox"
                                checked={Boolean(task.isCompleted)}
                                onChange={() => handleTaskCheck(task)}
                                style={styles.checkboxInput}
                              />
                              <span
                                onClick={() => setSelectedDetailTask(task)}
                                title="Click to view full task details"
                                style={{
                                  ...styles.taskItemTitle,
                                  textDecoration: task.isCompleted ? 'line-through' : 'none',
                                  fontSize: '14px',
                                  fontWeight: '600',
                                  color: '#0f172a',
                                  wordBreak: 'break-word',
                                  cursor: 'pointer',
                                }}
                              >
                                {task.title}
                              </span>
                            </div>
                            <span style={styles.timeBadge}>⏱️ {task.estTime || '30m'}</span>
                          </div>

                          {/* BOTTOM ROW: Badges & Action Buttons */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', paddingTop: '8px', borderTop: '1px solid #283548', marginTop: '6px' }}>
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                              {task.reminderSet && (
                                <span style={styles.reminderBadge}>🔔 Reminder Set</span>
                              )}
                              {task.videoUrl && (
                                <span style={styles.videoBadge}>📹 Video Saved ✅</span>
                              )}
                            </div>

                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                              <button
                                type="button"
                                onClick={() => startTaskTimer(task)}
                                style={{
                                  ...styles.timerTriggerBtn,
                                  backgroundColor: isTimerActiveForThis ? '#ef4444' : '#f59e0b',
                                }}
                              >
                                {isTimerActiveForThis
                                  ? `⏸ ${formatSecondsMMSS(taskCountdownSeconds)}`
                                  : '▶ Timer'}
                              </button>

                              {task.videoUrl ? (
                                <button
                                  type="button"
                                  onClick={() => setViewingVideoTask(task)}
                                  style={{
                                    ...styles.videoRecordBtn,
                                    backgroundColor: '#10b981',
                                  }}
                                >
                                  🎬 View Video
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setVideoModalTask(task)}
                                  style={{
                                    ...styles.videoRecordBtn,
                                    backgroundColor: '#6366f1',
                                  }}
                                >
                                  📷 Record
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <button
                  onClick={() => {
                    setNewTaskCategory('interview');
                    setIsTaskModalOpen(true);
                  }}
                  style={styles.addChecklistBtn}
                >
                  + Add checklist
                </button>
              </div>
            </div>

            {/* BOTTOM BAR: QUICK NOTES FOR SELECTED DATE */}
            <div style={styles.quickNotesCard}>
              <h4 style={styles.quickNotesTitle}>
                QUICK NOTES ({formatHeaderDate(selectedDateStr)})
              </h4>
              <textarea
                value={currentDateLog.notes || ''}
                onChange={(e) => updateCurrentDateLog({ notes: e.target.value })}
                placeholder="Write what went well today and what blockers occurred..."
                style={styles.quickNotesTextarea}
              />
            </div>
          </motion.div>
        )}



        {/* PAGE 2: CV & INTERVIEW QUESTION VAULT */}
        {activeTab === 'vault' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            style={styles.vaultLayoutGrid}
          >
            {/* LEFT / MIDDLE MAIN CONTENT AREA */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* TOP SECTION: RESUME BULLET IMPORTER */}
              <div style={styles.cardBox}>
                <h3 style={styles.cardTitle}>Resume Bullet Importer</h3>
                <p style={styles.cardSubtext}>
                  Add your actual CV bullet points to generate and organize mock interview questions.
                </p>
                <form onSubmit={handleAddCvBullet} style={styles.importerForm}>
                  <div style={styles.formRow}>
                    <input
                      type="text"
                      value={newBulletProject}
                      onChange={(e) => setNewBulletProject(e.target.value)}
                      placeholder="Project / Company Name (e.g. E-Commerce Backend)"
                      style={styles.textInput}
                    />
                  </div>
                  <textarea
                    value={newBulletText}
                    onChange={(e) => setNewBulletText(e.target.value)}
                    placeholder='e.g., "Optimized database queries by 40% using composite indexing and Redis caching"'
                    style={styles.importerTextarea}
                  />
                  <button type="submit" style={styles.primaryActionBtn}>
                    + Import Bullet & Generate Questions
                  </button>
                </form>
              </div>

              {/* MIDDLE SECTION: QUESTION CARDS BY PROJECT */}
              <div style={{ marginTop: '20px' }}>
                <h3 style={styles.sectionHeading}>Question Cards (Grouped by Project)</h3>
                {filteredBullets.length === 0 ? (
                  <div style={styles.emptyCardBox}>
                    No CV questions imported yet. Use the Resume Bullet Importer above to add your first bullet!
                  </div>
                ) : (
                  filteredBullets.map((bullet) => {
                    const isExpanded = expandedStarId === bullet.id;
                    return (
                      <div key={bullet.id} style={styles.vaultCard}>
                        <div style={styles.vaultCardHeader}>
                          <div>
                            <span style={styles.projectBadge}>{bullet.project}</span>
                            <h4 style={styles.bulletTitleText}>"{bullet.bulletText}"</h4>
                          </div>
                          <div style={styles.statusBadgeGroup}>
                            <select
                              value={bullet.status}
                              onChange={(e) => updateBulletStatus(bullet.id, e.target.value)}
                              style={{
                                ...styles.statusSelect,
                                borderColor:
                                  bullet.status === 'Mastered'
                                    ? '#10b981'
                                    : bullet.status === 'Reviewing'
                                    ? '#f59e0b'
                                    : '#ef4444',
                                color:
                                  bullet.status === 'Mastered'
                                    ? '#10b981'
                                    : bullet.status === 'Reviewing'
                                    ? '#f59e0b'
                                    : '#ef4444',
                              }}
                            >
                              <option value="Needs Practice">Needs Practice</option>
                              <option value="Reviewing">Reviewing</option>
                              <option value="Mastered">Mastered</option>
                            </select>
                          </div>
                        </div>

                        {/* Auto-suggested Questions */}
                        <div style={styles.questionsContainer}>
                          <span style={styles.questionsLabel}>Interview Practice Questions:</span>
                          <ul style={styles.questionsList}>
                            {bullet.questions.map((q, idx) => (
                              <li key={idx} style={{ ...styles.questionItem, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>❓ {q}</span>
                                <button
                                  type="button"
                                  onClick={() => setVideoModalTask({ id: `q-${bullet.id}-${idx}`, title: q, videoUrl: bullet[`video_${idx}`] })}
                                  style={{
                                    backgroundColor: bullet[`video_${idx}`] ? '#10b981' : '#6366f1',
                                    color: '#ffffff',
                                    border: 'none',
                                    borderRadius: '6px',
                                    padding: '4px 10px',
                                    fontSize: '11px',
                                    cursor: 'pointer',
                                    fontWeight: '600',
                                    marginLeft: '8px',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  📷 {bullet[`video_${idx}`] ? 'View Video' : 'Camera Record'}
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Expandable STAR Answer Drawer */}
                        <div style={styles.starDrawerWrapper}>
                          <button
                            onClick={() => setExpandedStarId(isExpanded ? null : bullet.id)}
                            style={styles.starToggleButton}
                          >
                            <span>{isExpanded ? '▼ Hide STAR Answer' : '▶ Expand STAR Answer Drawer'}</span>
                            <span style={styles.starBadgeText}>STAR Framework</span>
                          </button>

                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                style={styles.starContentBox}
                              >
                                <div style={styles.starGrid}>
                                  <div style={styles.starField}>
                                    <label style={styles.starLabel}>S - Situation</label>
                                    <textarea
                                      value={bullet.star.situation}
                                      onChange={(e) =>
                                        updateStarField(bullet.id, 'situation', e.target.value)
                                      }
                                      style={styles.starInput}
                                    />
                                  </div>
                                  <div style={styles.starField}>
                                    <label style={styles.starLabel}>T - Task</label>
                                    <textarea
                                      value={bullet.star.task}
                                      onChange={(e) =>
                                        updateStarField(bullet.id, 'task', e.target.value)
                                      }
                                      style={styles.starInput}
                                    />
                                  </div>
                                  <div style={styles.starField}>
                                    <label style={styles.starLabel}>A - Action</label>
                                    <textarea
                                      value={bullet.star.action}
                                      onChange={(e) =>
                                        updateStarField(bullet.id, 'action', e.target.value)
                                      }
                                      style={styles.starInput}
                                    />
                                  </div>
                                  <div style={styles.starField}>
                                    <label style={styles.starLabel}>R - Result</label>
                                    <textarea
                                      value={bullet.star.result}
                                      onChange={(e) =>
                                        updateStarField(bullet.id, 'result', e.target.value)
                                      }
                                      style={styles.starInput}
                                    />
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* RIGHT ACTION SIDEBAR */}
            <div style={styles.rightActionSidebar}>
              <div style={styles.cardBox}>
                <h4 style={styles.sidebarFilterTitle}>VAULT FILTERS</h4>
                <p style={styles.cardSubtext}>Quickly focus on unmastered questions</p>

                <div style={styles.filterBtnGroup}>
                  <button
                    onClick={() => setVaultFilter('All')}
                    style={{
                      ...styles.filterTabBtn,
                      backgroundColor: vaultFilter === 'All' ? '#6366f1' : '#1e293b',
                      color: vaultFilter === 'All' ? '#ffffff' : '#94a3b8',
                    }}
                  >
                    All Questions ({cvBullets.length})
                  </button>
                  <button
                    onClick={() => setVaultFilter('Unmastered')}
                    style={{
                      ...styles.filterTabBtn,
                      backgroundColor: vaultFilter === 'Unmastered' ? '#6366f1' : '#1e293b',
                      color: vaultFilter === 'Unmastered' ? '#ffffff' : '#94a3b8',
                    }}
                  >
                    Unmastered Only (
                    {cvBullets.filter((b) => b.status !== 'Mastered').length})
                  </button>
                </div>
              </div>

              {/* Quick Summary Stat Box */}
              <div style={{ ...styles.cardBox, marginTop: '20px' }}>
                <h4 style={styles.sidebarFilterTitle}>MASTERY BREAKDOWN</h4>
                <div style={styles.masteryStatRow}>
                  <span style={{ color: '#ef4444' }}>Needs Practice:</span>
                  <span>{cvBullets.filter((b) => b.status === 'Needs Practice').length}</span>
                </div>
                <div style={styles.masteryStatRow}>
                  <span style={{ color: '#f59e0b' }}>Reviewing:</span>
                  <span>{cvBullets.filter((b) => b.status === 'Reviewing').length}</span>
                </div>
                <div style={styles.masteryStatRow}>
                  <span style={{ color: '#10b981' }}>Mastered:</span>
                  <span>{cvBullets.filter((b) => b.status === 'Mastered').length}</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* PAGE 3: PROJECT & SKILL ROADMAP */}
        {activeTab === 'roadmap' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            style={styles.splitRoadmapGrid}
          >
            {/* LEFT SIDE: SKILL TREES */}
            <div style={styles.cardBox}>
              <h3 style={styles.cardTitle}>Skill Trees</h3>
              <p style={styles.cardSubtext}>Target technologies & interview preparedness levels</p>

              <div style={styles.skillTreeList}>
                {skillTrees.map((skill) => (
                  <div key={skill.id} style={styles.skillTreeItem}>
                    <div style={styles.skillTreeHeader}>
                      <span style={styles.skillNameText}>🔹 {skill.name}</span>
                      <span style={styles.skillStatusBadge}>{skill.statusLabel}</span>
                    </div>

                    {/* Progress Bar (Beginner -> Practical -> Ready) */}
                    <div style={styles.progressBarBg}>
                      <div
                        style={{
                          ...styles.progressBarFill,
                          width: `${skill.level}%`,
                          backgroundColor:
                            skill.level >= 80 ? '#10b981' : skill.level >= 50 ? '#3b82f6' : '#f59e0b',
                        }}
                      />
                    </div>
                    <div style={styles.progressTicksRow}>
                      <span>Beginner</span>
                      <span>Practical</span>
                      <span>Ready for Interview</span>
                    </div>

                    <a
                      href={skill.resourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={styles.resourceLink}
                    >
                      📖 Direct Cheatsheet & Tutorial Resource ↗
                    </a>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT SIDE: PROJECT KANBAN BOARD */}
            <div style={styles.cardBox}>
              <div style={styles.kanbanHeaderRow}>
                <div>
                  <h3 style={styles.cardTitle}>Project Kanban Board</h3>
                  <p style={styles.cardSubtext}>Organize project coding features by status</p>
                </div>
              </div>

              {/* Add Kanban Item Form */}
              <form onSubmit={handleAddKanbanTask} style={styles.addKanbanForm}>
                <input
                  type="text"
                  value={newKanbanTitle}
                  onChange={(e) => setNewKanbanTitle(e.target.value)}
                  placeholder="New project task title..."
                  style={styles.textInput}
                />
                <select
                  value={newKanbanCategory}
                  onChange={(e) => setNewKanbanCategory(e.target.value)}
                  style={styles.selectInput}
                >
                  <option value="Frontend">Frontend</option>
                  <option value="Backend">Backend</option>
                  <option value="Bugfix">Bugfix</option>
                  <option value="Deploy">Deploy</option>
                </select>
                <button type="submit" style={styles.primaryActionBtn}>
                  + Add Card
                </button>
              </form>

              {/* 3 KANBAN COLUMNS */}
              <div style={styles.kanbanColumnsRow}>
                {/* Column 1: To Do */}
                <div style={styles.kanbanCol}>
                  <div style={styles.kanbanColHeader}>
                    <span>TO DO</span>
                    <span style={styles.countBadge}>
                      {kanbanTasks.filter((k) => k.status === 'To Do').length}
                    </span>
                  </div>
                  {kanbanTasks
                    .filter((k) => k.status === 'To Do')
                    .map((task) => (
                      <div key={task.id} style={styles.kanbanCard}>
                        <span style={styles.getCategoryTagStyle(task.category)}>{task.category}</span>
                        <div style={styles.kanbanCardTitle}>{task.title}</div>
                        <button
                          onClick={() => handleMoveKanban(task.id, 'In Progress')}
                          style={styles.moveBtn}
                        >
                          Move to In Progress ➔
                        </button>
                      </div>
                    ))}
                </div>

                {/* Column 2: In Progress */}
                <div style={styles.kanbanCol}>
                  <div style={styles.kanbanColHeader}>
                    <span>IN PROGRESS</span>
                    <span style={styles.countBadge}>
                      {kanbanTasks.filter((k) => k.status === 'In Progress').length}
                    </span>
                  </div>
                  {kanbanTasks
                    .filter((k) => k.status === 'In Progress')
                    .map((task) => (
                      <div key={task.id} style={styles.kanbanCard}>
                        <span style={styles.getCategoryTagStyle(task.category)}>{task.category}</span>
                        <div style={styles.kanbanCardTitle}>{task.title}</div>
                        <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                          <button
                            onClick={() => handleMoveKanban(task.id, 'To Do')}
                            style={styles.moveBtn}
                          >
                            ⬅ To Do
                          </button>
                          <button
                            onClick={() => handleMoveKanban(task.id, 'Completed')}
                            style={{ ...styles.moveBtn, backgroundColor: '#10b981' }}
                          >
                            Complete ➔
                          </button>
                        </div>
                      </div>
                    ))}
                </div>

                {/* Column 3: Completed */}
                <div style={styles.kanbanCol}>
                  <div style={styles.kanbanColHeader}>
                    <span>COMPLETED</span>
                    <span style={styles.countBadge}>
                      {kanbanTasks.filter((k) => k.status === 'Completed').length}
                    </span>
                  </div>
                  {kanbanTasks
                    .filter((k) => k.status === 'Completed')
                    .map((task) => (
                      <div key={task.id} style={{ ...styles.kanbanCard, opacity: 0.85 }}>
                        <span style={styles.getCategoryTagStyle(task.category)}>{task.category}</span>
                        <div style={{ ...styles.kanbanCardTitle, textDecoration: 'line-through' }}>
                          {task.title}
                        </div>
                        <button
                          onClick={() => handleMoveKanban(task.id, 'In Progress')}
                          style={styles.moveBtn}
                        >
                          ⬅ Reopen
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* PAGE 4: WEEKLY REVIEW & CONSISTENCY TRACKER (ALL PREVIOUS DAYS HISTORY) */}
        {activeTab === 'review' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            style={styles.weeklyReviewGrid}
          >
            {/* LEFT / MAIN COLUMN */}
            <div style={{ flex: 1 }}>
              {/* FULL MONTHLY ACTIVITY CALENDAR TRACKER */}
              <div style={styles.cardBox}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h3 style={{ ...styles.cardTitle, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      📅 {calendarViewMode === 'monthly' ? 'Monthly Activity Calendar' : 'Activity Grid (Last 7 Days)'}
                    </h3>
                    <p style={styles.cardSubtext}>
                      Visual log of study hours & tasks completed per day. Click any day to view full breakdown below.
                    </p>
                  </div>

                  {/* Month & View Mode Controls */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    {calendarViewMode === 'monthly' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#f1f5f9', padding: '4px', borderRadius: '10px', border: '1px solid #cbd5e1' }}>
                        <button
                          type="button"
                          onClick={() => shiftCalendarMonth(-1)}
                          style={{ ...styles.dateNavBtn, padding: '4px 10px', fontSize: '11px' }}
                        >
                          ◀ Prev
                        </button>
                        <span style={{ fontSize: '12px', fontWeight: '800', color: '#0f172a', padding: '0 8px' }}>
                          {new Date(calendarYearMonth.year, calendarYearMonth.month, 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase()}
                        </span>
                        <button
                          type="button"
                          onClick={() => shiftCalendarMonth(1)}
                          style={{ ...styles.dateNavBtn, padding: '4px 10px', fontSize: '11px' }}
                        >
                          Next ▶
                        </button>
                      </div>
                    )}

                    {/* View Mode Toggle */}
                    <div style={{ display: 'flex', backgroundColor: '#f1f5f9', borderRadius: '8px', padding: '2px', border: '1px solid #cbd5e1' }}>
                      <button
                        type="button"
                        onClick={() => setCalendarViewMode('monthly')}
                        style={{
                          border: 'none',
                          backgroundColor: calendarViewMode === 'monthly' ? '#4f46e5' : 'transparent',
                          color: calendarViewMode === 'monthly' ? '#ffffff' : '#475569',
                          fontSize: '11px',
                          fontWeight: '700',
                          padding: '5px 12px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                        }}
                      >
                        📅 Month View
                      </button>
                      <button
                        type="button"
                        onClick={() => setCalendarViewMode('7day')}
                        style={{
                          border: 'none',
                          backgroundColor: calendarViewMode === '7day' ? '#4f46e5' : 'transparent',
                          color: calendarViewMode === '7day' ? '#ffffff' : '#475569',
                          fontSize: '11px',
                          fontWeight: '700',
                          padding: '5px 12px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                        }}
                      >
                        📊 7-Day View
                      </button>
                    </div>
                  </div>
                </div>

                {/* MONTHLY CALENDAR VIEW */}
                {calendarViewMode === 'monthly' ? (
                  <div>
                    {/* Day-of-Week Headers */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', marginBottom: '8px', textAlign: 'center' }}>
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                        <div key={d} style={{ fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>
                          {d}
                        </div>
                      ))}
                    </div>

                    {/* Monthly Days Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
                      {monthlyCalendarDays.map((cell, idx) => {
                        if (!cell) {
                          return <div key={`empty-${idx}`} style={{ minHeight: '60px', opacity: 0 }} />;
                        }
                        const isSelectedHistory = cell.dateStr === historyDetailDate;
                        const levelStyles = [
                          { bg: '#f1f5f9', border: '#e2e8f0', text: '#64748b' },
                          { bg: '#dcfce7', border: '#86efac', text: '#14532d' },
                          { bg: '#86efac', border: '#4ade80', text: '#064e3b' },
                          { bg: '#4ade80', border: '#22c55e', text: '#052e16' },
                          { bg: '#22c55e', border: '#16a34a', text: '#ffffff' },
                        ];
                        const curStyle = levelStyles[cell.level];

                        return (
                          <div
                            key={cell.dateStr}
                            onClick={() => setHistoryDetailDate(cell.dateStr)}
                            style={{
                              backgroundColor: curStyle.bg,
                              border: isSelectedHistory ? '2px solid #4f46e5' : `1px solid ${curStyle.border}`,
                              borderRadius: '12px',
                              padding: '8px 6px',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justify: 'space-between',
                              minHeight: '64px',
                              cursor: 'pointer',
                              boxShadow: isSelectedHistory ? '0 4px 14px rgba(79, 70, 229, 0.3)' : 'none',
                              transform: isSelectedHistory ? 'scale(1.04)' : 'none',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <span style={{ fontSize: '13px', fontWeight: '800', color: isSelectedHistory ? '#4f46e5' : curStyle.text }}>
                              {cell.dayNum}
                            </span>
                            <span style={{ fontSize: '10px', fontWeight: '700', color: curStyle.text }}>
                              {cell.hoursLogged}
                            </span>
                            <span style={{ fontSize: '9px', fontWeight: '600', color: curStyle.text, opacity: 0.85 }}>
                              {cell.completedCount}/{cell.totalCount}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  /* 7-DAY VIEW GRID */
                  <div style={styles.activityGridRow}>
                    {activity7Days.map((cell) => {
                      const isSelectedHistory = cell.dateStr === historyDetailDate;
                      const levelStyles = [
                        { bg: '#f1f5f9', border: '#e2e8f0', text: '#64748b' },
                        { bg: '#dcfce7', border: '#86efac', text: '#14532d' },
                        { bg: '#86efac', border: '#4ade80', text: '#064e3b' },
                        { bg: '#4ade80', border: '#22c55e', text: '#052e16' },
                        { bg: '#22c55e', border: '#16a34a', text: '#ffffff' },
                      ];
                      const curStyle = levelStyles[cell.level];
                      return (
                        <div
                          key={cell.dateStr}
                          onClick={() => setHistoryDetailDate(cell.dateStr)}
                          style={{
                            ...styles.activityDayCard,
                            cursor: 'pointer',
                            transform: isSelectedHistory ? 'scale(1.05)' : 'none',
                          }}
                        >
                          <span
                            style={{
                              ...styles.activityDayName,
                              color: isSelectedHistory ? '#4f46e5' : '#64748b',
                            }}
                          >
                            {cell.dayName}
                          </span>
                          <div
                            style={{
                              ...styles.activitySquare,
                              backgroundColor: curStyle.bg,
                              border: isSelectedHistory ? '2px solid #4f46e5' : `1px solid ${curStyle.border}`,
                            }}
                          >
                            <span style={{ fontSize: '14px', fontWeight: '800', color: curStyle.text }}>{cell.dayNum}</span>
                          </div>
                          <span style={{ fontSize: '11px', fontWeight: '700', color: '#4f46e5' }}>{cell.hoursLogged}</span>
                          <span style={styles.activityTaskCount}>
                            {cell.completedCount}/{cell.totalCount} tasks
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* COLOR INTENSITY LEGEND */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '11px', fontWeight: '600', color: '#64748b' }}>Activity Level:</span>
                  {[
                    { bg: '#f1f5f9', border: '#cbd5e1', label: '0 Tasks' },
                    { bg: '#dcfce7', border: '#86efac', label: '1 Task' },
                    { bg: '#86efac', border: '#4ade80', label: '2-3 Tasks' },
                    { bg: '#4ade80', border: '#22c55e', label: '4-5 Tasks' },
                    { bg: '#22c55e', border: '#15803d', label: 'High' },
                  ].map((lvl, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <div style={{ width: '14px', height: '14px', borderRadius: '4px', backgroundColor: lvl.bg, border: `1px solid ${lvl.border}` }} />
                      <span style={{ fontSize: '10px', color: '#64748b', fontWeight: '600' }}>{lvl.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* DETAILED PREVIOUS DAY BREAKDOWN FOR SELECTED HISTORY DATE */}
              <div style={{ ...styles.cardBox, marginTop: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={styles.cardTitle}>
                    Previous Day Log: {formatHeaderDate(historyDetailDate)}
                  </h3>
                  <button
                    onClick={() => {
                      setSelectedDateStr(historyDetailDate);
                      setActiveTab('focus');
                    }}
                    style={styles.jumpToDateBtn}
                  >
                    Edit Tasks in Today's Focus ➔
                  </button>
                </div>

                <div style={styles.historyMetricsRow}>
                  <div style={styles.historyMetricCard}>
                    <span style={styles.histMetricLbl}>Coding Time</span>
                    <span style={styles.histMetricVal}>
                      {formatHoursMins((dailyLogsMap[historyDetailDate] || {}).codingSeconds || 0)}
                    </span>
                  </div>
                  <div style={styles.historyMetricCard}>
                    <span style={styles.histMetricLbl}>Drills Completed</span>
                    <span style={styles.histMetricVal}>
                      {(dailyLogsMap[historyDetailDate] || {}).drillsCount || 0} questions
                    </span>
                  </div>
                  <div style={styles.historyMetricCard}>
                    <span style={styles.histMetricLbl}>Tasks Completed</span>
                    <span style={styles.histMetricVal}>
                      {selectedHistoryObj ? `${selectedHistoryObj.completedCount}/${selectedHistoryObj.totalCount}` : '0/0'}
                    </span>
                  </div>
                </div>

                {/* Tasks List for this previous day */}
                <div style={{ marginTop: '16px' }}>
                  <h4 style={styles.historySectionTitle}>Tasks Logged on this Date:</h4>
                  {!selectedHistoryObj || selectedHistoryObj.tasksList.length === 0 ? (
                    <div style={styles.emptyHistoryNotice}>No tasks logged on this specific date.</div>
                  ) : (
                    <div style={styles.historyTasksList}>
                      {selectedHistoryObj.tasksList.map((t) => (
                        <div key={t.id} style={styles.historyTaskItem}>
                          <span style={{ fontSize: '14px' }}>{t.isCompleted ? '✅' : '⏳'}</span>
                          <span
                            style={{
                              fontSize: '13px',
                              textDecoration: t.isCompleted ? 'line-through' : 'none',
                              color: t.isCompleted ? '#94a3b8' : '#f8fafc',
                            }}
                          >
                            {t.title}
                          </span>
                          <span style={styles.historyBadge}>{t.type.toUpperCase()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Notes for this previous day */}
                {selectedHistoryObj && selectedHistoryObj.logNotes && (
                  <div style={styles.historyNotesBox}>
                    <h5 style={styles.historyNotesTitle}>Journal Notes:</h5>
                    <p style={styles.historyNotesText}>"{selectedHistoryObj.logNotes}"</p>
                  </div>
                )}
              </div>

              {/* READINESS RADAR GAUGE METER */}
              <div style={{ ...styles.cardBox, marginTop: '20px' }}>
                <h3 style={styles.cardTitle}>Readiness Radar</h3>
                <p style={styles.cardSubtext}>Overall interview & portfolio preparation meter</p>

                <div style={styles.radarGaugeWrapper}>
                  <svg width="220" height="130" viewBox="0 0 200 120">
                    <path
                      d="M 20 100 A 80 80 0 0 1 180 100"
                      fill="none"
                      stroke="#1e293b"
                      strokeWidth="18"
                      strokeLinecap="round"
                    />
                    <path
                      d="M 20 100 A 80 80 0 0 1 180 100"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="18"
                      strokeLinecap="round"
                      strokeDasharray="251.3"
                      strokeDashoffset={251.3 - (251.3 * readinessScore) / 100}
                      style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                    />
                  </svg>
                  <div style={styles.gaugeCenterText}>
                    <span style={styles.gaugePercentNumber}>{readinessScore}%</span>
                    <span style={styles.gaugeStatusLabel}>READY</span>
                  </div>
                </div>

                <div style={styles.radarMetricsRow}>
                  <div style={styles.radarMetricCell}>
                    <span style={styles.metricVal}>
                      {masteredQuestionsCount}/{totalQuestionsCount}
                    </span>
                    <span style={styles.metricLbl}>Mastered CV Questions</span>
                  </div>
                  <div style={styles.radarMetricCell}>
                    <span style={styles.metricVal}>
                      {finishedKanbanCount}/{totalKanbanCount}
                    </span>
                    <span style={styles.metricLbl}>Finished Kanban Features</span>
                  </div>
                </div>
              </div>
            </div>


          </motion.div>
        )}

        {/* ==================================================== */}
        {/* QUICK-ADD TASK MODAL                                 */}
        {/* ==================================================== */}
        <AnimatePresence>
          {isTaskModalOpen && (
            <div style={styles.modalOverlay}>
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                style={styles.modalContentCard}
              >
                <div style={styles.modalHeader}>
                  <h3 style={styles.modalTitle}>+ Add Task for {formatHeaderDate(selectedDateStr)}</h3>
                  <button
                    onClick={() => setIsTaskModalOpen(false)}
                    style={styles.modalCloseBtn}
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleAddDailyTask} style={styles.modalForm}>
                  <div style={styles.fieldGroup}>
                    <label style={styles.fieldLabel}>Task Title</label>
                    <input
                      type="text"
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      placeholder="e.g., Build Auth Service API endpoint"
                      required
                      style={styles.textInput}
                    />
                  </div>

                  <div style={styles.fieldGroup}>
                    <label style={styles.fieldLabel}>Task Column Category</label>
                    <select
                      value={newTaskCategory}
                      onChange={(e) => setNewTaskCategory(e.target.value)}
                      style={styles.selectInput}
                    >
                      <option value="skill">🔵 Skill Learning</option>
                      <option value="coding">🟢 Project Coding</option>
                      <option value="interview">🟠 Interview Rehearsal</option>
                    </select>
                  </div>

                  <div style={styles.fieldGroup}>
                    <label style={styles.fieldLabel}>Estimated Time</label>
                    <input
                      type="text"
                      value={newTaskEstTime}
                      onChange={(e) => setNewTaskEstTime(e.target.value)}
                      placeholder="e.g., 30m, 45m, 1h"
                      style={styles.textInput}
                    />
                  </div>

                  {newTaskCategory === 'coding' && (
                    <div style={styles.fieldGroup}>
                      <label style={styles.fieldLabel}>Linked Target Project</label>
                      <input
                        type="text"
                        value={newTaskProject}
                        onChange={(e) => setNewTaskProject(e.target.value)}
                        placeholder="e.g., Portfolio API, Task Manager"
                        style={styles.textInput}
                      />
                    </div>
                  )}

                  <div style={styles.modalFooterActions}>
                    <button
                      type="button"
                      onClick={() => setIsTaskModalOpen(false)}
                      style={styles.cancelBtn}
                    >
                      Cancel
                    </button>
                    <button type="submit" style={styles.primaryActionBtn}>
                      Save Task
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ADD CAREER TARGET GOAL MODAL */}
        <AnimatePresence>
          {isAddGoalModalOpen && (
            <div style={styles.modalOverlay}>
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                style={{ ...styles.modalContentCard, width: '480px' }}
              >
                <div style={styles.modalHeader}>
                  <h3 style={styles.modalTitle}>🏆 Add Target Career Goal</h3>
                  <button onClick={() => setIsAddGoalModalOpen(false)} style={styles.modalCloseBtn}>✕</button>
                </div>

                <form onSubmit={handleAddCareerGoal}>
                  <div style={styles.fieldGroup}>
                    <label style={styles.fieldLabel}>Goal Title / Objective *</label>
                    <input
                      type="text"
                      required
                      value={newGoalTitle}
                      onChange={(e) => setNewGoalTitle(e.target.value)}
                      placeholder="e.g., Become a Senior Full Stack Engineer, Land $120k Remote Role"
                      style={styles.textInput}
                    />
                  </div>

                  <div style={styles.fieldGroup}>
                    <label style={styles.fieldLabel}>Goal Category</label>
                    <select
                      value={newGoalCategory}
                      onChange={(e) => setNewGoalCategory(e.target.value)}
                      style={styles.selectInput}
                    >
                      <option value="Career Goal">🎯 Career Goal</option>
                      <option value="Job Target">💼 Job Target</option>
                      <option value="Skill Mastery">⚡ Skill Mastery</option>
                      <option value="Personal Milestone">🌟 Personal Milestone</option>
                    </select>
                  </div>

                  <div style={styles.fieldGroup}>
                    <label style={styles.fieldLabel}>Target Date</label>
                    <input
                      type="date"
                      value={newGoalTargetDate}
                      onChange={(e) => setNewGoalTargetDate(e.target.value)}
                      style={styles.textInput}
                    />
                  </div>

                  <div style={styles.modalFooterActions}>
                    <button
                      type="button"
                      onClick={() => setIsAddGoalModalOpen(false)}
                      style={styles.cancelBtn}
                    >
                      Cancel
                    </button>
                    <button type="submit" style={{ ...styles.primaryActionBtn, backgroundColor: '#10b981' }}>
                      Save Target Goal
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* VIDEO ANSWER RECORDING & UPLOAD MODAL */}
        <AnimatePresence>
          {videoModalTask && (
            <VideoAnswerModal
              task={videoModalTask}
              onClose={() => setVideoModalTask(null)}
              onSaveVideo={handleSaveTaskVideo}
            />
          )}
        </AnimatePresence>

        {/* INCOMPLETE TASK WARNING POPUP MODAL */}
        <AnimatePresence>
          {warningPopupTask && (
            <WarningPopupModal
              task={warningPopupTask}
              onClose={() => setWarningPopupTask(null)}
              onRecordVideo={(t) => setVideoModalTask(t)}
              onStartTimer={(t) => startTaskTimer(t)}
              onSetReminder={(id) => setTaskReminder(id)}
            />
          )}
        </AnimatePresence>

        {/* TASK COMPLETED CELEBRATION POPUP MODAL */}
        <AnimatePresence>
          {completionPopupTask && (
            <CompletionCelebrationModal
              task={completionPopupTask}
              onClose={() => setCompletionPopupTask(null)}
              formatHoursMins={formatHoursMins}
              careerGoals={careerGoals}
            />
          )}
        </AnimatePresence>

        {/* WATCH SAVED VIDEO MODAL */}
        <AnimatePresence>
          {viewingVideoTask && (
            <WatchVideoModal
              task={viewingVideoTask}
              onClose={() => setViewingVideoTask(null)}
              onReRecord={(t) => {
                setViewingVideoTask(null);
                setVideoModalTask(t);
              }}
              onDeleteVideo={handleDeleteTaskVideo}
            />
          )}
        </AnimatePresence>

        {/* TASK DETAILS FULL OVERVIEW MODAL */}
        <AnimatePresence>
          {selectedDetailTask && (
            <TaskDetailsModal
              task={selectedDetailTask}
              onClose={() => setSelectedDetailTask(null)}
              onStartTimer={(t) => startTaskTimer(t)}
              onRecordVideo={(t) => setVideoModalTask(t)}
                  onViewVideo={(t) => setViewingVideoTask(t)}
              onToggleComplete={(t) => handleTaskCheck(t)}
              formatHoursMins={formatHoursMins}
            />
          )}
        </AnimatePresence>


      </main>
    </div>
  );
}

const styles = {
  appContainer: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: '#f1f5f9',
    backgroundImage: 'none',
    color: '#0f172a',
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  sidebar: {
    width: '260px',
    backgroundColor: '#ffffff',
    borderRight: '1px solid #e2e8f0',
    display: 'flex',
    flexDirection: 'column',
    padding: '24px 16px',
    boxShadow: '4px 0 20px rgba(0, 0, 0, 0.02)',
  },
  logoSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    paddingBottom: '24px',
    borderBottom: '1px solid #e2e8f0',
    marginBottom: '24px',
  },
  logoIcon: {
    fontSize: '28px',
  },
  logoText: {
    fontSize: '18px',
    fontWeight: '800',
    color: '#4f46e5',
    margin: 0,
    lineHeight: '1',
    letterSpacing: '0.5px',
  },
  logoSubtext: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: '1px',
  },
  navMenu: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    flex: 1,
  },
  navButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    borderRadius: '12px',
    backgroundColor: 'transparent',
    border: '1px solid transparent',
    color: '#475569',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.2s ease',
  },
  navButtonActive: {
    background: 'linear-gradient(135deg, #818cf8 0%, #6366f1 100%)',
    border: '1px solid #4f46e5',
    color: '#ffffff',
    boxShadow: '0 4px 16px rgba(99, 102, 241, 0.3)',
    fontWeight: '700',
  },
  navIcon: {
    fontSize: '16px',
  },
  navLabel: {
    letterSpacing: '0.5px',
  },
  sidebarFooter: {
    paddingTop: '16px',
    borderTop: '1px solid #e2e8f0',
  },
  userBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  userAvatar: {
    fontSize: '24px',
  },
  userName: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#0f172a',
  },
  userRole: {
    fontSize: '11px',
    color: '#64748b',
  },
  mainContent: {
    flex: 1,
    padding: '32px',
    overflowY: 'auto',
    backgroundColor: '#f8fafc',
  },
  headerBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '28px',
  },
  dateSelectorRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '4px',
  },
  dateNavBtn: {
    backgroundColor: '#ffffff',
    color: '#0f172a',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    padding: '6px 14px',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
  },
  datePickerInput: {
    backgroundColor: '#ffffff',
    border: '1px solid #cbd5e1',
    color: '#0f172a',
    borderRadius: '8px',
    padding: '5px 12px',
    fontSize: '13px',
    fontWeight: '700',
    outline: 'none',
  },
  todayResetBtn: {
    backgroundColor: '#22c55e',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    padding: '6px 14px',
    fontSize: '11px',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(34, 197, 94, 0.3)',
  },
  headerTitle: {
    fontSize: '24px',
    fontWeight: '800',
    color: '#0f172a',
    margin: '4px 0 0 0',
  },
  headerRightGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  completionRingWidget: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: '#ffffff',
    padding: '8px 16px',
    borderRadius: '14px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.04)',
  },
  completionTextGroup: {
    display: 'flex',
    flexDirection: 'column',
  },
  completionRatioText: {
    fontSize: '14px',
    fontWeight: '800',
    color: '#16a34a',
  },
  completionSubLabel: {
    fontSize: '10px',
    fontWeight: '700',
    color: '#64748b',
  },
  quickAddBtn: {
    background: 'linear-gradient(135deg, #a855f7 0%, #8b5cf6 100%)',
    color: '#ffffff',
    border: 'none',
    padding: '12px 22px',
    borderRadius: '12px',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(168, 85, 247, 0.35)',
  },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '20px',
    marginBottom: '28px',
  },
  statCard: {
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '16px',
    padding: '20px',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
  },
  statHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  statLabel: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#475569',
    letterSpacing: '0.5px',
  },
  timerToggleBtn: {
    color: '#fff',
    border: 'none',
    padding: '5px 14px',
    borderRadius: '8px',
    fontSize: '11px',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)',
  },
  incrementBtn: {
    backgroundColor: '#f1f5f9',
    color: '#4338ca',
    border: '1px solid #c7d2fe',
    padding: '5px 12px',
    borderRadius: '8px',
    fontSize: '11px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  fireBadge: {
    backgroundColor: '#fef3c7',
    color: '#b45309',
    fontSize: '11px',
    fontWeight: '700',
    padding: '3px 10px',
    borderRadius: '8px',
    border: '1px solid #fcd34d',
  },
  statValueRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  statIcon: {
    fontSize: '26px',
  },
  statMainValue: {
    fontSize: '24px',
    fontWeight: '800',
    color: '#0f172a',
  },
  taskColumnsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '20px',
    marginBottom: '28px',
  },
  taskColumnCard: {
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '18px',
    padding: '22px',
    display: 'flex',
    flexDirection: 'column',
    minHeight: '400px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
  },
  columnTitleHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '18px',
  },
  blueDot: { fontSize: '14px' },
  greenDot: { fontSize: '14px' },
  orangeDot: { fontSize: '14px' },
  columnTitleText: {
    fontSize: '14px',
    fontWeight: '800',
    color: '#0f172a',
    margin: 0,
    letterSpacing: '0.5px',
  },
  taskList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    flex: 1,
  },
  emptyStateNotice: {
    color: '#94a3b8',
    fontSize: '12px',
    fontStyle: 'italic',
    padding: '16px 0',
    textAlign: 'center',
  },
  taskCardItemContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    backgroundColor: '#ffffff',
    padding: '14px 16px',
    borderRadius: '14px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
    transition: 'all 0.15s ease',
  },
  taskItemRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    backgroundColor: '#ffffff',
    padding: '12px',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  checkboxInput: {
    width: '18px',
    height: '18px',
    accentColor: '#16a34a',
    cursor: 'pointer',
  },
  taskItemTitle: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#0f172a',
  },
  timeBadge: {
    marginLeft: 'auto',
    backgroundColor: '#f1f5f9',
    color: '#475569',
    fontSize: '11px',
    fontWeight: '700',
    padding: '3px 10px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
  },
  projectTagLink: {
    fontSize: '11px',
    color: '#6366f1',
    marginTop: '2px',
    display: 'inline-block',
    fontWeight: '600',
  },
  addChecklistBtn: {
    marginTop: '16px',
    backgroundColor: '#f8fafc',
    border: '1px dashed #cbd5e1',
    color: '#475569',
    padding: '10px',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    width: '100%',
    textAlign: 'center',
  },
  quickNotesCard: {
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '18px',
    padding: '20px',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
  },
  quickNotesTitle: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#475569',
    margin: '0 0 12px 0',
    letterSpacing: '0.5px',
  },
  quickNotesTextarea: {
    width: '100%',
    height: '80px',
    backgroundColor: '#f8fafc',
    border: '1px solid #cbd5e1',
    borderRadius: '10px',
    color: '#0f172a',
    padding: '12px',
    fontSize: '13px',
    fontFamily: 'inherit',
    resize: 'none',
    boxSizing: 'border-box',
  },
  vaultLayoutGrid: {
    display: 'flex',
    gap: '24px',
  },
  cardBox: {
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
  },
  emptyCardBox: {
    backgroundColor: '#f8fafc',
    borderRadius: '12px',
    padding: '20px',
    color: '#64748b',
    fontSize: '13px',
    textAlign: 'center',
    border: '1px dashed #cbd5e1',
  },
  cardTitle: {
    fontSize: '16px',
    fontWeight: '800',
    color: '#0f172a',
    margin: '0 0 4px 0',
  },
  cardSubtext: {
    fontSize: '12px',
    color: '#64748b',
    margin: '0 0 16px 0',
  },
  importerForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  formRow: {
    display: 'flex',
    gap: '12px',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#ffffff',
    border: '1px solid #cbd5e1',
    borderRadius: '10px',
    color: '#0f172a',
    padding: '12px',
    fontSize: '13px',
    boxSizing: 'border-box',
  },
  importerTextarea: {
    width: '100%',
    height: '70px',
    backgroundColor: '#ffffff',
    border: '1px solid #cbd5e1',
    borderRadius: '10px',
    color: '#0f172a',
    padding: '12px',
    fontSize: '13px',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  },
  primaryActionBtn: {
    background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
    color: '#ffffff',
    border: 'none',
    padding: '12px 18px',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
  },
  sectionHeading: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#475569',
    margin: '0 0 12px 0',
    letterSpacing: '0.5px',
  },
  vaultCard: {
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '16px',
    padding: '20px',
    marginBottom: '16px',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.03)',
  },
  vaultCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '14px',
  },
  projectBadge: {
    backgroundColor: '#e0e7ff',
    color: '#4338ca',
    fontSize: '11px',
    fontWeight: '700',
    padding: '4px 10px',
    borderRadius: '6px',
  },
  bulletTitleText: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#0f172a',
    margin: '8px 0 0 0',
  },
  statusBadgeGroup: {
    display: 'flex',
    alignItems: 'center',
  },
  statusSelect: {
    backgroundColor: '#ffffff',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  questionsContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: '10px',
    padding: '14px',
    marginBottom: '14px',
    border: '1px solid #e2e8f0',
  },
  questionsLabel: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  questionsList: {
    margin: '8px 0 0 0',
    paddingLeft: '0',
    listStyle: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  questionItem: {
    fontSize: '13px',
    color: '#1e293b',
  },
  starDrawerWrapper: {
    borderTop: '1px solid #e2e8f0',
    paddingTop: '12px',
  },
  starToggleButton: {
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'transparent',
    border: 'none',
    color: '#4f46e5',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  starBadgeText: {
    backgroundColor: '#e0e7ff',
    color: '#4338ca',
    fontSize: '11px',
    padding: '2px 8px',
    borderRadius: '4px',
  },
  starContentBox: {
    marginTop: '12px',
    overflow: 'hidden',
  },
  starGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
  },
  starField: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  starLabel: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#6366f1',
  },
  starInput: {
    backgroundColor: '#ffffff',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    color: '#0f172a',
    padding: '8px 10px',
    fontSize: '12px',
    height: '60px',
    fontFamily: 'inherit',
    resize: 'none',
    boxSizing: 'border-box',
  },
  rightActionSidebar: {
    width: '280px',
  },
  sidebarFilterTitle: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#64748b',
    margin: '0 0 4px 0',
  },
  filterBtnGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginTop: '12px',
  },
  filterTabBtn: {
    width: '100%',
    padding: '10px',
    borderRadius: '8px',
    border: 'none',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    textAlign: 'left',
  },
  masteryStatRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13px',
    fontWeight: '600',
    marginTop: '8px',
  },
  splitRoadmapGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1.3fr',
    gap: '24px',
  },
  skillTreeList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    marginTop: '16px',
  },
  skillTreeItem: {
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    padding: '16px',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
  },
  skillTreeHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  skillNameText: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#0f172a',
  },
  skillStatusBadge: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#4338ca',
    backgroundColor: '#e0e7ff',
    padding: '2px 8px',
    borderRadius: '6px',
  },
  progressBarBg: {
    height: '8px',
    backgroundColor: '#f1f5f9',
    borderRadius: '4px',
    overflow: 'hidden',
    marginBottom: '6px',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: '4px',
    transition: 'width 0.5s ease',
  },
  progressTicksRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '10px',
    color: '#64748b',
    fontWeight: '600',
    marginBottom: '10px',
  },
  resourceLink: {
    fontSize: '12px',
    color: '#4f46e5',
    textDecoration: 'none',
    fontWeight: '600',
  },
  kanbanHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  addKanbanForm: {
    display: 'flex',
    gap: '8px',
    marginBottom: '16px',
  },
  selectInput: {
    backgroundColor: '#ffffff',
    border: '1px solid #cbd5e1',
    borderRadius: '10px',
    color: '#0f172a',
    padding: '10px 12px',
    fontSize: '13px',
    boxSizing: 'border-box',
  },
  kanbanColumnsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '12px',
  },
  kanbanCol: {
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '14px',
    padding: '14px',
    minHeight: '340px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  kanbanColHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '11px',
    fontWeight: '700',
    color: '#475569',
    marginBottom: '6px',
  },
  countBadge: {
    backgroundColor: '#e0e7ff',
    color: '#4338ca',
    borderRadius: '10px',
    padding: '2px 8px',
    fontSize: '10px',
  },
  kanbanCard: {
    backgroundColor: '#ffffff',
    borderRadius: '10px',
    padding: '12px',
    border: '1px solid #cbd5e1',
    boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
  },
  kanbanCardTitle: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#0f172a',
    marginTop: '6px',
  },
  getCategoryTagStyle: (cat) => {
    const colors = {
      Frontend: { bg: '#dbeafe', text: '#1e40af' },
      Backend: { bg: '#dcfce7', text: '#15803d' },
      Bugfix: { bg: '#fee2e2', text: '#b91c1c' },
      Deploy: { bg: '#fef3c7', text: '#b45309' },
    };
    const c = colors[cat] || colors.Frontend;
    return {
      backgroundColor: c.bg,
      color: c.text,
      fontSize: '10px',
      fontWeight: '700',
      padding: '2px 6px',
      borderRadius: '4px',
      display: 'inline-block',
    };
  },
  moveBtn: {
    backgroundColor: '#f1f5f9',
    color: '#475569',
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    padding: '4px 8px',
    fontSize: '10px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '8px',
  },
  weeklyReviewGrid: {
    display: 'flex',
    gap: '24px',
  },
  activityGridRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: '10px',
    marginTop: '16px',
  },
  activityDayCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px',
    padding: '6px',
    borderRadius: '10px',
    transition: 'all 0.15s ease',
  },
  activityDayName: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#475569',
  },
  activitySquare: {
    width: '44px',
    height: '44px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityDateNum: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#0f172a',
  },
  activityHoursText: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#4f46e5',
  },
  activityTaskCount: {
    fontSize: '10px',
    color: '#64748b',
  },
  jumpToDateBtn: {
    backgroundColor: '#ffffff',
    color: '#4f46e5',
    border: '1px solid #818cf8',
    padding: '6px 12px',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  historyMetricsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '12px',
    marginTop: '16px',
  },
  historyMetricCard: {
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    padding: '12px',
    borderRadius: '10px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  histMetricLbl: {
    fontSize: '11px',
    color: '#64748b',
    fontWeight: '600',
  },
  histMetricVal: {
    fontSize: '16px',
    fontWeight: '800',
    color: '#4f46e5',
  },
  historySectionTitle: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#475569',
    margin: '0 0 8px 0',
  },
  historyTasksList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  historyTaskItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    padding: '10px 14px',
    borderRadius: '8px',
  },
  historyBadge: {
    marginLeft: 'auto',
    backgroundColor: '#e0e7ff',
    color: '#4338ca',
    fontSize: '10px',
    fontWeight: '700',
    padding: '2px 6px',
    borderRadius: '4px',
  },
  emptyHistoryNotice: {
    color: '#94a3b8',
    fontSize: '12px',
    fontStyle: 'italic',
  },
  historyNotesBox: {
    marginTop: '16px',
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    padding: '12px',
  },
  historyNotesTitle: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#4338ca',
    margin: '0 0 4px 0',
  },
  historyNotesText: {
    fontSize: '12px',
    color: '#334155',
    margin: 0,
    fontStyle: 'italic',
  },
  radarGaugeWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    margin: '20px 0',
  },
  gaugeCenterText: {
    position: 'absolute',
    bottom: '10px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  gaugePercentNumber: {
    fontSize: '28px',
    fontWeight: '800',
    color: '#16a34a',
  },
  gaugeStatusLabel: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: '1px',
  },
  radarMetricsRow: {
    display: 'flex',
    justifyContent: 'space-around',
    borderTop: '1px solid #e2e8f0',
    paddingTop: '16px',
  },
  radarMetricCell: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  metricVal: {
    fontSize: '16px',
    fontWeight: '800',
    color: '#0f172a',
  },
  metricLbl: {
    fontSize: '11px',
    color: '#64748b',
  },
  addGoalForm: {
    display: 'flex',
    gap: '8px',
    marginBottom: '16px',
  },
  weeklyGoalsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    margin: '16px 0',
  },
  emptyGoalNotice: {
    color: '#64748b',
    fontSize: '12px',
    fontStyle: 'italic',
    padding: '8px 0',
  },
  goalItemRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    padding: '12px',
    borderRadius: '10px',
    cursor: 'pointer',
  },
  goalText: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#0f172a',
  },
  cohortCommitmentBox: {
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    padding: '14px',
    marginTop: '20px',
  },
  cohortTitle: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#4338ca',
    margin: '0 0 4px 0',
  },
  cohortText: {
    fontSize: '11px',
    color: '#64748b',
    margin: 0,
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modalContentCard: {
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '18px',
    padding: '24px',
    width: '420px',
    maxWidth: '90%',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.12)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  modalTitle: {
    fontSize: '16px',
    fontWeight: '800',
    color: '#0f172a',
    margin: 0,
  },
  modalCloseBtn: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#64748b',
    fontSize: '18px',
    cursor: 'pointer',
  },
  modalForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  fieldLabel: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#475569',
  },
  modalFooterActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    marginTop: '10px',
  },
  cancelBtn: {
    backgroundColor: '#1e293b',
    color: '#94a3b8',
    border: 'none',
    padding: '10px 16px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  timerTriggerBtn: {
    border: 'none',
    color: '#ffffff',
    borderRadius: '6px',
    padding: '4px 10px',
    fontSize: '12px',
    cursor: 'pointer',
    fontWeight: '600',
    transition: 'all 0.2s ease',
  },
  videoRecordBtn: {
    border: 'none',
    color: '#ffffff',
    borderRadius: '6px',
    padding: '4px 10px',
    fontSize: '12px',
    cursor: 'pointer',
    fontWeight: '600',
    transition: 'all 0.2s ease',
  },
  reminderBadge: {
    backgroundColor: '#312e81',
    color: '#a5b4fc',
    fontSize: '11px',
    padding: '2px 6px',
    borderRadius: '4px',
    fontWeight: '600',
  },
  videoBadge: {
    backgroundColor: '#064e3b',
    color: '#6ee7b7',
    fontSize: '11px',
    padding: '2px 6px',
    borderRadius: '4px',
    fontWeight: '600',
  },
  fileInputStyle: {
    border: '1px dashed #475569',
    padding: '16px',
    borderRadius: '8px',
    width: '100%',
    cursor: 'pointer',
    color: '#94a3b8',
    backgroundColor: '#0f172a',
  },
};

// ========================================================
// HELPER MODAL POPUP COMPONENTS
// ========================================================

function VideoAnswerModal({ task, onClose, onSaveVideo }) {
  const [activeTab, setActiveTab] = useState('record'); // 'record' | 'upload'
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSec, setRecordingSec] = useState(0);
  const [recordedBlobUrl, setRecordedBlobUrl] = useState(task.videoUrl || null);
  const [uploadedFileUrl, setUploadedFileUrl] = useState(null);
  const [cameraError, setCameraError] = useState(null);

  const videoPreviewRef = React.useRef(null);
  const mediaRecorderRef = React.useRef(null);
  const mediaStreamRef = React.useRef(null);
  const recordedChunksRef = React.useRef([]);
  const timerRef = React.useRef(null);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      mediaStreamRef.current = stream;
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn('Camera access error:', err);
      setCameraError('Camera access denied or unavailable. You can upload a video file instead.');
    }
  };

  const startRecording = () => {
    if (!mediaStreamRef.current) return;
    recordedChunksRef.current = [];
    try {
      const recorder = new MediaRecorder(mediaStreamRef.current);
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };
      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setRecordedBlobUrl(url);
      };
      recorder.start(100);
      setIsRecording(true);
      setRecordingSec(0);
      timerRef.current = setInterval(() => {
        setRecordingSec((s) => s + 1);
      }, 1000);
    } catch (err) {
      setCameraError('Recording error: ' + err.message);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setIsRecording(false);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setUploadedFileUrl(url);
      setRecordedBlobUrl(url);
    }
  };

  const handleSave = () => {
    const finalUrl = recordedBlobUrl || uploadedFileUrl;
    if (finalUrl) {
      onSaveVideo(task.id, finalUrl);
    }
    onClose();
  };

  useEffect(() => {
    if (activeTab === 'record') {
      startCamera();
    }
    return () => {
      stopRecording();
    };
  }, [activeTab]);

  return (
    <div style={styles.modalOverlay}>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        style={{ ...styles.modalContentCard, width: '560px', maxWidth: '90%' }}
      >
        <div style={styles.modalHeader}>
          <div>
            <h3 style={styles.modalTitle}>📷 Camera Video Recording Section</h3>
            <p style={{ ...styles.cardSubtext, margin: 0 }}>Target Question/Task: "{task.title}"</p>
          </div>
          <button onClick={onClose} style={styles.modalCloseBtn}>✕</button>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
          <button
            onClick={() => setActiveTab('record')}
            style={{
              ...styles.filterTabBtn,
              backgroundColor: activeTab === 'record' ? '#6366f1' : '#1e293b',
              color: '#ffffff',
              flex: 1,
              fontWeight: 'bold',
            }}
          >
            📷 Live Camera Recorder
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            style={{
              ...styles.filterTabBtn,
              backgroundColor: activeTab === 'upload' ? '#6366f1' : '#1e293b',
              color: '#ffffff',
              flex: 1,
            }}
          >
            📁 Upload Video File
          </button>
        </div>

        {activeTab === 'record' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ background: '#312e81', color: '#c7d2fe', padding: '8px 12px', borderRadius: '6px', fontSize: '12px', marginBottom: '12px', fontWeight: '500' }}>
              🎥 Camera Section Active - Click <strong>Start Recording</strong> to capture your answer!
            </div>
            {cameraError ? (
              <div style={{ color: '#ef4444', padding: '16px', background: '#291215', border: '1px solid #7f1d1d', borderRadius: '8px', marginBottom: '12px', fontSize: '13px', textAlign: 'center' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '6px' }}>📷 {cameraError}</div>
                <div style={{ fontSize: '12px', color: '#cbd5e1', marginTop: '6px' }}>
                  Please enable camera permissions in your browser or use the <strong>📁 Upload Video File</strong> tab.
                </div>
              </div>
            ) : recordedBlobUrl && !isRecording ? (
              <div style={{ marginBottom: '12px' }}>
                <video src={recordedBlobUrl} controls style={{ width: '100%', borderRadius: '8px', maxHeight: '260px', background: '#000' }} />
                <p style={{ fontSize: '12px', color: '#10b981', marginTop: '6px', fontWeight: 'bold' }}>✅ Video Answer Preview Ready!</p>
              </div>
            ) : (
              <div style={{ position: 'relative', marginBottom: '12px' }}>
                <video ref={videoPreviewRef} autoPlay muted style={{ width: '100%', borderRadius: '8px', maxHeight: '260px', background: '#000', transform: 'scaleX(-1)' }} />
                {isRecording && (
                  <div style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(239, 68, 68, 0.95)', color: '#fff', padding: '4px 12px', borderRadius: '20px', fontWeight: 'bold', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />
                    Recording in Progress ({recordingSec}s)
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '10px' }}>
              {!isRecording ? (
                <button onClick={startRecording} style={{ ...styles.primaryActionBtn, backgroundColor: '#ef4444', fontWeight: 'bold' }}>
                  🔴 Start Camera Recording
                </button>
              ) : (
                <button onClick={stopRecording} style={{ ...styles.primaryActionBtn, backgroundColor: '#64748b', fontWeight: 'bold' }}>
                  ⏹️ Stop Recording
                </button>
              )}
              {recordedBlobUrl && (
                <button onClick={startCamera} style={styles.cancelBtn}>
                  🔄 Re-record
                </button>
              )}
            </div>
          </div>
        )}

        {activeTab === 'upload' && (
          <div style={{ padding: '16px 0', textAlign: 'center' }}>
            <input type="file" accept="video/*" onChange={handleFileUpload} style={styles.fileInputStyle} />
            {uploadedFileUrl && (
              <div style={{ marginTop: '16px' }}>
                <video src={uploadedFileUrl} controls style={{ width: '100%', borderRadius: '8px', maxHeight: '260px' }} />
                <p style={{ fontSize: '12px', color: '#10b981', marginTop: '6px' }}>✅ Uploaded video ready</p>
              </div>
            )}
          </div>
        )}

        <div style={{ ...styles.modalFooterActions, marginTop: '20px' }}>
          <button onClick={onClose} style={styles.cancelBtn}>Cancel</button>
          <button
            onClick={handleSave}
            disabled={!recordedBlobUrl && !uploadedFileUrl}
            style={{
              ...styles.primaryActionBtn,
              opacity: (!recordedBlobUrl && !uploadedFileUrl) ? 0.5 : 1,
            }}
          >
            💾 Save Video Answer
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function WarningPopupModal({ task, onClose, onRecordVideo, onStartTimer, onSetReminder }) {
  if (!task) return null;
  return (
    <div style={styles.modalOverlay}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ ...styles.modalContentCard, width: '480px' }}>
        <div style={{ textAlign: 'center', padding: '10px 0' }}>
          <div style={{ fontSize: '48px', marginBottom: '10px' }}>⚠️</div>
          <h3 style={{ ...styles.modalTitle, color: '#f59e0b', fontSize: '18px' }}>Please Complete First That Task</h3>
          <p style={{ color: '#cbd5e1', fontSize: '14px', margin: '12px 0 20px 0', lineHeight: 1.5 }}>
            To mark <strong>"{task.title}"</strong> as completed, please record or upload your video answer or complete the task countdown timer first! A reminder has been set for this task.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              onClick={() => {
                onClose();
                onRecordVideo(task);
              }}
              style={{ ...styles.primaryActionBtn, backgroundColor: '#f59e0b', color: '#0f172a', fontWeight: 'bold' }}
            >
              📹 Record Video Answer Now
            </button>
            <button
              onClick={() => {
                onClose();
                onStartTimer(task);
              }}
              style={{ ...styles.primaryActionBtn, backgroundColor: '#3b82f6' }}
            >
              ⏱️ Start Task Countdown Timer
            </button>
            <button
              onClick={() => {
                onSetReminder(task.id);
                onClose();
              }}
              style={styles.cancelBtn}
            >
              🔔 Set Reminder & Close
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function CompletionCelebrationModal({ task, onClose, formatHoursMins, careerGoals = [] }) {
  if (!task) return null;

  const activeGoal = careerGoals.find((g) => !g.isAchieved) || careerGoals[0];
  const goalTitle = activeGoal ? activeGoal.title : 'Target Career Success';

  return (
    <div style={styles.modalOverlay}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ ...styles.modalContentCard, width: '480px', textAlign: 'center' }}>
        <div style={{ fontSize: '54px', marginBottom: '10px' }}>🎉</div>
        <h3 style={{ ...styles.modalTitle, color: '#10b981', fontSize: '20px' }}>Task Completed!</h3>
        <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '16px' }}>Great job on completing your scheduled task!</p>

        <div style={{ background: '#1e293b', padding: '16px', borderRadius: '10px', textAlign: 'left', marginBottom: '16px', border: '1px solid #334155' }}>
          <div style={{ fontWeight: '600', color: '#f8fafc', marginBottom: '10px', fontSize: '15px' }}>📋 {task.title}</div>
          <div style={{ fontSize: '13px', color: '#cbd5e1', display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span>⏱️ Estimated Time:</span>
            <strong style={{ color: '#818cf8' }}>{task.estTime || '30m'}</strong>
          </div>
          <div style={{ fontSize: '13px', color: '#cbd5e1', display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span>⏱️ Actual Time Spent:</span>
            <strong style={{ color: '#10b981' }}>{formatHoursMins ? formatHoursMins(task.elapsedSeconds || 1800) : '30m'}</strong>
          </div>
          {task.videoUrl && (
            <div style={{ fontSize: '13px', color: '#10b981', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #334155' }}>
              📹 Video Answer Response Saved ✅
            </div>
          )}
        </div>

        {/* GOAL-DRIVEN MOTIVATION MESSAGE CARD */}
        <div style={{ background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%)', border: '1px solid #0ea5e9', padding: '14px', borderRadius: '10px', textAlign: 'left', marginBottom: '20px', boxShadow: '0 4px 14px rgba(14, 165, 233, 0.2)' }}>
          <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#38bdf8', textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.5px' }}>
            🏆 Goal Milestone Progress
          </div>
          <div style={{ fontSize: '13px', fontWeight: '600', color: '#ffffff', marginBottom: '6px' }}>
            Target Goal: "{goalTitle}"
          </div>
          <div style={{ fontSize: '12px', color: '#e0e7ff', fontStyle: 'italic', lineHeight: 1.4 }}>
            ✨ "1 step closer! Completing your daily task '{task.title}' day by day builds real momentum towards achieving '{goalTitle}'!"
          </div>
        </div>

        <button onClick={onClose} style={{ ...styles.primaryActionBtn, backgroundColor: '#10b981', width: '100%', padding: '12px' }}>
          Awesome! Keep Going 🚀
        </button>
      </motion.div>
    </div>
  );
}

function WatchVideoModal({ task, onClose, onReRecord, onDeleteVideo }) {
  if (!task || !task.videoUrl) return null;
  return (
    <div style={styles.modalOverlay}>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        style={{ ...styles.modalContentCard, width: '600px', maxWidth: '92%' }}
      >
        <div style={styles.modalHeader}>
          <div>
            <h3 style={{ ...styles.modalTitle, color: '#10b981', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🎬 Saved Video Answer Response
            </h3>
            <p style={{ ...styles.cardSubtext, margin: '4px 0 0 0' }}>Target Task / Question: "{task.title}"</p>
          </div>
          <button onClick={onClose} style={styles.modalCloseBtn}>✕</button>
        </div>

        <div style={{ margin: '16px 0', textAlign: 'center' }}>
          <video
            src={task.videoUrl}
            controls
            autoPlay
            style={{ width: '100%', borderRadius: '12px', maxHeight: '360px', background: '#000', border: '1px solid #334155' }}
          />
          {task.videoRecordedAt && (
            <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px' }}>
              📅 Recorded on: {new Date(task.videoRecordedAt).toLocaleString()}
            </p>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', flexWrap: 'wrap', gap: '10px' }}>
          <button
            onClick={() => {
              if (window.confirm("Are you sure you want to delete this saved video answer?")) {
                onDeleteVideo(task.id);
                onClose();
              }
            }}
            style={{ ...styles.cancelBtn, color: '#ef4444', backgroundColor: '#291215', border: '1px solid #7f1d1d' }}
          >
            🗑️ Delete Video
          </button>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => {
                onClose();
                onReRecord(task);
              }}
              style={{ ...styles.primaryActionBtn, backgroundColor: '#6366f1' }}
            >
              🔄 Re-record New Video
            </button>
            <button onClick={onClose} style={styles.cancelBtn}>
              Close
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function TaskDetailsModal({
  task,
  onClose,
  onStartTimer,
  onRecordVideo,
  onViewVideo,
  onToggleComplete,
  formatHoursMins,
}) {
  if (!task) return null;

  const categoryLabel =
    task.type === 'skill'
      ? '🔵 Skill Learning'
      : task.type === 'coding'
      ? '🟢 Project Coding'
      : '🟠 Interview Rehearsal';

  return (
    <div style={styles.modalOverlay}>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        style={{ ...styles.modalContentCard, width: '580px', maxWidth: '92%' }}
      >
        {/* Header */}
        <div style={styles.modalHeader}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#6366f1', textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.5px' }}>
              📋 Task Comprehensive Details
            </div>
            <h3 style={{ ...styles.modalTitle, fontSize: '18px', color: '#f8fafc', margin: 0 }}>
              {task.title}
            </h3>
          </div>
          <button onClick={onClose} style={styles.modalCloseBtn}>✕</button>
        </div>

        {/* Content Body */}
        <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {/* Category & Status Badges */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ background: '#1e1b4b', color: '#a5b4fc', border: '1px solid #4338ca', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>
              {categoryLabel}
            </span>
            <span style={{ background: task.isCompleted ? '#064e3b' : '#312e81', color: task.isCompleted ? '#6ee7b7' : '#c7d2fe', border: task.isCompleted ? '1px solid #059669' : '1px solid #4f46e5', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>
              {task.isCompleted ? '✅ Task Completed' : '⏳ Pending Task'}
            </span>
            {task.project && (
              <span style={{ background: '#064e3b', color: '#a7f3d0', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '500' }}>
                🔗 Project: {task.project}
              </span>
            )}
          </div>

          {/* Time & Stats Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
            <div style={{ background: '#1e293b', border: '1px solid #334155', padding: '12px', borderRadius: '8px' }}>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>⏱️ Estimated Time</div>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#818cf8' }}>
                {task.estTime || '30m'}
              </div>
            </div>

            <div style={{ background: '#1e293b', border: '1px solid #334155', padding: '12px', borderRadius: '8px' }}>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>⏱️ Logged Time Spent</div>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#10b981' }}>
                {formatHoursMins ? formatHoursMins(task.elapsedSeconds || 0) : '0m'}
              </div>
            </div>

            <div style={{ background: '#1e293b', border: '1px solid #334155', padding: '12px', borderRadius: '8px' }}>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>🔔 Reminder Status</div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: task.reminderSet ? '#f59e0b' : '#64748b' }}>
                {task.reminderSet ? 'Active 🔔' : 'Not Set'}
              </div>
            </div>
          </div>

          {/* Video Answer Section */}
          <div style={{ background: '#0f172a', border: '1px solid #1e293b', padding: '14px', borderRadius: '10px' }}>
            <div style={{ fontWeight: '600', color: '#f8fafc', fontSize: '13px', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>📹 Video Practice Response:</span>
              {task.videoUrl ? (
                <span style={{ color: '#10b981', fontSize: '12px', fontWeight: 'bold' }}>✅ Video Response Saved</span>
              ) : (
                <span style={{ color: '#f59e0b', fontSize: '12px', fontWeight: 'bold' }}>⚠️ No Video Recorded Yet</span>
              )}
            </div>

            {task.videoUrl ? (
              <div>
                <video
                  src={task.videoUrl}
                  controls
                  style={{ width: '100%', borderRadius: '8px', maxHeight: '240px', background: '#000', border: '1px solid #334155' }}
                />
                {task.videoRecordedAt && (
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px' }}>
                    📅 Captured: {new Date(task.videoRecordedAt).toLocaleString()}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '12px 0' }}>
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 10px 0' }}>
                  Record a camera video response to complete your task drill!
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onRecordVideo(task);
                  }}
                  style={{ ...styles.primaryActionBtn, backgroundColor: '#6366f1', fontSize: '12px', padding: '8px 16px' }}
                >
                  📷 Record / Upload Video Now
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', flexWrap: 'wrap', gap: '10px' }}>
          <button
            type="button"
            onClick={() => {
              onToggleComplete(task);
              onClose();
            }}
            style={{
              ...styles.primaryActionBtn,
              backgroundColor: task.isCompleted ? '#475569' : '#10b981',
              fontSize: '13px',
            }}
          >
            {task.isCompleted ? '↩️ Mark Pending' : '✅ Mark Task Completed'}
          </button>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => {
                onClose();
                onStartTimer(task);
              }}
              style={{ ...styles.primaryActionBtn, backgroundColor: '#3b82f6', fontSize: '13px' }}
            >
              ▶ Start Countdown Timer
            </button>

            <button type="button" onClick={onClose} style={styles.cancelBtn}>
              Close
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
