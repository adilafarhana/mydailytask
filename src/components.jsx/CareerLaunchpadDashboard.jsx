import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE = 'http://127.0.0.1:8000/api';

export default function CareerLaunchpadDashboard() {
  // Navigation active tab: 'focus' | 'vault' | 'roadmap' | 'review'
  const [activeTab, setActiveTab] = useState('focus');

  // Mobile Responsiveness state
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Selected date string (YYYY-MM-DD) for Day-by-Day view
  const todayIso = new Date().toISOString().split('T')[0];
  const [selectedDateStr, setSelectedDateStr] = useState(todayIso);
  const [showCalendar, setShowCalendar] = useState(true);

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
  const [isSiteOpenModalOpen, setIsSiteOpenModalOpen] = useState(true);



  const formatSecToMinSecStr = (totalSec = 0) => {
    const sec = Math.max(0, parseInt(totalSec, 10) || 0);
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    if (m > 0 && s > 0) return `${m} min and ${s} sec`;
    if (m > 0) return `${m} min`;
    return `${s} sec`;
  };

  // Notification State for Estimated Time Alerts
  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem('clp_task_notifications_v1');
    return saved ? JSON.parse(saved) : [];
  });
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  useEffect(() => {
    localStorage.setItem('clp_task_notifications_v1', JSON.stringify(notifications));
  }, [notifications]);

  // Web Audio API notification alert sound chime (2-tone warning ping)
  const playNotificationSound = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      // Tone 1 (A5 - 880Hz warning ping)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(880, now);
      gain1.gain.setValueAtTime(0.3, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.18);

      // Tone 2 (E5 - 659Hz follow-up ping)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(659.25, now + 0.12);
      gain2.gain.setValueAtTime(0.35, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.4);
    } catch (e) {
      console.log('Audio playback error:', e);
    }
  };

  const addNotification = (item) => {
    playNotificationSound();
    setNotifications((prev) => [item, ...prev]);
  };

  const markNotificationRead = (notifId) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notifId ? { ...n, read: true } : n))
    );
  };

  const removeNotification = (notifId) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notifId));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };
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

  const [newKanbanTitle, setNewKanbanTitle] = useState('');

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
            const targetTask = dailyTasks.find((t) => t.id === activeTaskTimerId);
            if (targetTask && !targetTask.isCompleted) {
              // Add header notification bell alert item
              addNotification({
                id: Date.now(),
                taskId: targetTask.id,
                taskTitle: targetTask.title,
                estTime: targetTask.estTime,
                message: `⚠️ Time Expired! You started the timer for '${targetTask.title}', but estimated time (${targetTask.estTime}) finished without completion. Please complete your task!`,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                read: false,
              });

              // Trigger backend Brevo SMTP email notification
              fetch(`${API_BASE}/send-task-due-email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  task_title: targetTask.title,
                  email: 'adilafarhanavv1@gmail.com',
                }),
              }).catch(() => {});

              // Show incomplete task notification popup modal
              setWarningPopupTask(targetTask);
            }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const skillDone = skillTasks.filter((t) => t.isCompleted).length;
  const codingDone = codingTasks.filter((t) => t.isCompleted).length;
  const interviewDone = interviewTasks.filter((t) => t.isCompleted).length;

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

  // Format Seconds to Hours/Mins (e.g., "0h 0m" or "1h 30m")
  const formatHoursMins = (totalSec = 0) => {
    const sec = Math.max(0, parseInt(totalSec, 10) || 0);
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    return `${h}h ${m}m`;
  };

  // ----------------------------------------------------
  // FULL MONTHLY CALENDAR GRID & ACTIVITY TRACKER
  // ----------------------------------------------------
  const [calendarYearMonth, setCalendarYearMonth] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });

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

  // ----------------------------------------------------
  // Poothiri Sparkler Celebration & Sound Effect State
  const [poothiriActive, setPoothiriActive] = useState(false);
  const [poothiriTaskTitle, setPoothiriTaskTitle] = useState('');

  // Web Audio API victory sound chime (ascending 3-tone sparkler chime)
  const playCompletionSound = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      // Note 1 (E5 - 659Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, now);
      gain1.gain.setValueAtTime(0.25, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.2);

      // Note 2 (B5 - 987Hz)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(987.77, now + 0.1);
      gain2.gain.setValueAtTime(0.3, now + 0.1);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.1);
      osc2.stop(now + 0.4);

      // Note 3 (E6 - 1318Hz Sparkler Shimmer)
      const osc3 = ctx.createOscillator();
      const gain3 = ctx.createGain();
      osc3.type = 'triangle';
      osc3.frequency.setValueAtTime(1318.51, now + 0.22);
      gain3.gain.setValueAtTime(0.35, now + 0.22);
      gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
      osc3.connect(gain3);
      gain3.connect(ctx.destination);
      osc3.start(now + 0.22);
      osc3.stop(now + 0.65);
    } catch (e) {
      console.log('Audio playback error:', e);
    }
  };

  const triggerPoothiri = (taskTitle) => {
    setPoothiriTaskTitle(taskTitle || 'Task Completed');
    setPoothiriActive(true);
    playCompletionSound();
    setTimeout(() => {
      setPoothiriActive(false);
    }, 2500);
  };

  // HANDLERS
  // ----------------------------------------------------

  const toggleTaskCompletion = (id) => {
    const target = dailyTasks.find((t) => t.id === id);
    const becomingCompleted = target ? !target.isCompleted : false;

    if (becomingCompleted && target) {
      triggerPoothiri(target.title);
    }

    setDailyTasks((prev) => {
      const updated = prev.map((task) =>
        task.id === id ? { ...task, isCompleted: !task.isCompleted } : task
      );
      localStorage.setItem('clp_daily_tasks_v2', JSON.stringify(updated));
      return updated;
    });

    // Try backend sync
    try {
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

  const handleAddInterviewTaskFromDrill = (questionTitle) => {
    const exists = dailyTasks.some(
      (t) => t.taskDate === selectedDateStr && t.type === 'interview' && t.title === questionTitle
    );

    if (!exists) {
      const item = {
        id: Date.now(),
        taskDate: selectedDateStr,
        type: 'interview',
        title: questionTitle,
        estTime: '30m',
        project: 'CV Drill',
        isCompleted: false,
      };
      setDailyTasks((prev) => {
        const updated = [...prev, item];
        localStorage.setItem('clp_daily_tasks_v2', JSON.stringify(updated));
        return updated;
      });

      const newNotif = {
        id: Date.now(),
        taskTitle: questionTitle,
        message: 'Added question to Interview Preparation tasks! 🟠',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'add',
      };
      setNotifications((prev) => [newNotif, ...prev]);

      try {
        fetch(`${API_BASE}/daily-tasks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            task_date: selectedDateStr,
            task_title: questionTitle,
            category: 'Interview',
            is_completed: false,
          }),
        });
      } catch (e) {}
    }
  };

  return (
    <div style={{ ...styles.appContainer, flexDirection: isMobile ? 'column' : 'row' }}>
      {/* ==================================================== */}
      {/* NAVIGATION SIDEBAR / MOBILE NAVIGATION               */}
      {/* ==================================================== */}
      {isMobile ? (
        <header style={mobileStyles.mobileTopHeader}>
          <div style={styles.logoSection}>
            <span style={styles.logoIcon}>🚀</span>
            <div>
              <h1 style={styles.logoText}>CAREER</h1>
              <span style={styles.logoSubtext}>LAUNCHPAD</span>
            </div>
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={mobileStyles.menuToggleBtn}
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </header>
      ) : (
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
              onClick={() => setActiveTab('calendar')}
              style={{
                ...styles.navButton,
                ...(activeTab === 'calendar' ? styles.navButtonActive : {}),
              }}
            >
              <span style={styles.navIcon}>📅</span>
              <span style={styles.navLabel}>CALENDAR VIEW</span>
            </button>
            <button
              onClick={() => setActiveTab('cv_drills')}
              style={{
                ...styles.navButton,
                ...(activeTab === 'cv_drills' ? styles.navButtonActive : {}),
              }}
            >
              <span style={styles.navIcon}>🎮</span>
              <span style={styles.navLabel}>CV INTERVIEW DRILLS</span>
            </button>
            <button
              onClick={() => setActiveTab('relax')}
              style={{
                ...styles.navButton,
                ...(activeTab === 'relax' ? styles.navButtonActive : {}),
              }}
            >
              <span style={styles.navIcon}>🧘</span>
              <span style={styles.navLabel}>MIND RELAXING</span>
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
      )}

      {/* MOBILE DRAWER OVERLAY */}
      {isMobile && mobileMenuOpen && (
        <div style={mobileStyles.drawerOverlay} onClick={() => setMobileMenuOpen(false)}>
          <div style={mobileStyles.drawerContent} onClick={(e) => e.stopPropagation()}>
            <nav style={styles.navMenu}>
              <button
                onClick={() => { setActiveTab('focus'); setMobileMenuOpen(false); }}
                style={{ ...styles.navButton, ...(activeTab === 'focus' ? styles.navButtonActive : {}) }}
              >
                <span style={styles.navIcon}>🎯</span>
                <span style={styles.navLabel}>TODAY'S FOCUS</span>
              </button>
              <button
                onClick={() => { setActiveTab('calendar'); setMobileMenuOpen(false); }}
                style={{ ...styles.navButton, ...(activeTab === 'calendar' ? styles.navButtonActive : {}) }}
              >
                <span style={styles.navIcon}>📅</span>
                <span style={styles.navLabel}>CALENDAR VIEW</span>
              </button>
              <button
                onClick={() => { setActiveTab('cv_drills'); setMobileMenuOpen(false); }}
                style={{ ...styles.navButton, ...(activeTab === 'cv_drills' ? styles.navButtonActive : {}) }}
              >
                <span style={styles.navIcon}>🎮</span>
                <span style={styles.navLabel}>CV INTERVIEW DRILLS</span>
              </button>
              <button
                onClick={() => { setActiveTab('relax'); setMobileMenuOpen(false); }}
                style={{ ...styles.navButton, ...(activeTab === 'relax' ? styles.navButtonActive : {}) }}
              >
                <span style={styles.navIcon}>🧘</span>
                <span style={styles.navLabel}>MIND RELAXING</span>
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
          </div>
        </div>
      )}

      {/* FIXED MOBILE BOTTOM NAVIGATION BAR */}
      {isMobile && (
        <div style={mobileStyles.bottomNavContainer}>
          <button
            onClick={() => setActiveTab('focus')}
            style={{
              ...mobileStyles.bottomNavItem,
              color: activeTab === 'focus' ? '#4f46e5' : '#64748b',
              fontWeight: '700',
            }}
          >
            <span style={{ fontSize: '18px' }}>🎯</span>
            <span style={{ fontSize: '11px' }}>Focus</span>
          </button>

          <button
            onClick={() => setActiveTab('calendar')}
            style={{
              ...mobileStyles.bottomNavItem,
              color: activeTab === 'calendar' ? '#4f46e5' : '#64748b',
              fontWeight: '700',
            }}
          >
            <span style={{ fontSize: '18px' }}>📅</span>
            <span style={{ fontSize: '11px' }}>Calendar</span>
          </button>

          <button
            onClick={() => setActiveTab('relax')}
            style={{
              ...mobileStyles.bottomNavItem,
              color: activeTab === 'relax' ? '#4f46e5' : '#64748b',
              fontWeight: '700',
            }}
          >
            <span style={{ fontSize: '18px' }}>🧘</span>
            <span style={{ fontSize: '11px' }}>Relax</span>
          </button>

          <button
            onClick={() => setIsTaskModalOpen(true)}
            style={mobileStyles.bottomNavAddBtn}
            title="Add Task"
          >
            <span style={{ fontSize: '20px', color: '#ffffff', fontWeight: 'bold' }}>+</span>
          </button>
        </div>
      )}

      {/* ==================================================== */}
      {/* MAIN CONTENT AREA                                    */}
      {/* ==================================================== */}
      <main style={{ ...styles.mainContent, padding: isMobile ? '16px 12px 90px 12px' : '32px' }}>
        {/* TOP HEADER BAR WITH DAY-BY-DAY DATE SELECTOR */}
        <header style={{ ...styles.headerBar, flexWrap: 'wrap', gap: '12px' }}>
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
              {`${formatHeaderDate(selectedDateStr).toUpperCase()} FOCUS`}
            </h2>
          </div>

          <div style={styles.headerRightGroup}>
            {/* NOTIFICATION BELL ICON WITH UNREAD BADGE (MINIMIZED BUTTON SIZE) */}
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                style={{
                  backgroundColor: showNotifDropdown ? '#e0e7ff' : '#ffffff',
                  border: '1.5px solid #cbd5e1',
                  borderRadius: '10px',
                  padding: '5px 8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  position: 'relative',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
                }}
                title="Task Time Notifications"
              >
                <span>🔔</span>
                {notifications.filter((n) => !n.read).length > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '-5px',
                      right: '-5px',
                      backgroundColor: '#ef4444',
                      color: '#ffffff',
                      borderRadius: '10px',
                      padding: '1px 5px',
                      fontSize: '9px',
                      fontWeight: '800',
                      border: '1.5px solid #ffffff',
                    }}
                  >
                    {notifications.filter((n) => !n.read).length}
                  </span>
                )}
              </button>

              {/* NOTIFICATION DROPDOWN POPOVER */}
              {showNotifDropdown && (
                <div
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: '40px',
                    width: '320px',
                    backgroundColor: '#ffffff',
                    border: '1.5px solid #cbd5e1',
                    borderRadius: '16px',
                    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)',
                    zIndex: 1000,
                    padding: '14px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', paddingBottom: '6px', borderBottom: '1px solid #e2e8f0' }}>
                    <h4 style={{ fontSize: '12px', fontWeight: '800', color: '#1e1b4b', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      🔔 Estimated Time Alerts ({notifications.length})
                    </h4>
                    {notifications.length > 0 && (
                      <button
                        type="button"
                        onClick={clearAllNotifications}
                        style={{ border: 'none', background: 'none', color: '#ef4444', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
                      >
                        Clear All
                      </button>
                    )}
                  </div>

                  {notifications.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '14px 6px', color: '#64748b', fontSize: '12px', fontWeight: '600' }}>
                      ✨ No time alerts! All tasks running on schedule.
                    </div>
                  ) : (
                    <div style={{ maxHeight: '260px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {notifications.map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => markNotificationRead(notif.id)}
                          style={{
                            backgroundColor: notif.read ? '#f8fafc' : '#fef2f2',
                            border: notif.read ? '1px solid #e2e8f0' : '1px solid #fca5a5',
                            borderRadius: '10px',
                            padding: '10px 12px',
                            position: 'relative',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                            <span style={{ fontSize: '11px', fontWeight: '800', color: '#dc2626' }}>
                              ⏱️ Task Time Expired
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '600' }}>
                                {notif.time}
                              </span>
                              {/* CLOSE / DISMISS ICON (✕) */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeNotification(notif.id);
                                }}
                                style={{
                                  border: 'none',
                                  background: 'none',
                                  color: '#94a3b8',
                                  fontSize: '12px',
                                  fontWeight: '800',
                                  cursor: 'pointer',
                                  padding: '0 2px',
                                }}
                                title="Dismiss notification"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                          <p style={{ fontSize: '12px', color: '#1e1b4b', fontWeight: '600', margin: '4px 0 0 0', lineHeight: '1.4' }}>
                            {notif.message}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Daily Completion Ring Widget */}
            <div style={styles.completionRingWidget}>
              <svg width="48" height="48" viewBox="0 0 48 48">
                <circle cx="24" cy="24" r="18" fill="none" stroke="#e2e8f0" strokeWidth="4" />
                <circle
                  cx="24"
                  cy="24"
                  r="18"
                  fill="none"
                  stroke="#ef4444"
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
            {/* CLEAN TASK COMPLETED CELEBRATION POPUP */}
            <AnimatePresence>
              {poothiriActive && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, y: -20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: -20 }}
                  style={{
                    position: 'fixed',
                    top: '24px',
                    right: '24px',
                    zIndex: 9999,
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    border: '1.5px solid #6ee7b7',
                    borderRadius: '16px',
                    padding: '12px 20px',
                    boxShadow: '0 10px 25px rgba(16, 185, 129, 0.4)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    pointerEvents: 'none',
                  }}
                >
                  <div style={{ fontSize: '24px' }}>🎉</div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '900', color: '#ffffff' }}>
                      Task Completed! 🎉
                    </div>
                    {poothiriTaskTitle && (
                      <div style={{ fontSize: '12px', color: '#ecfdf5', fontWeight: '700', marginTop: '2px' }}>
                        "{poothiriTaskTitle}"
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ULTRA-SIMPLE MINIMAL GOAL STRIP */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justify: 'space-between',
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '10px',
                padding: '8px 14px',
                marginBottom: '16px',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>🎯</span> <span><strong>Goal:</strong> Land a Good Job, Master Skills & Build Projects 🚀</span>
              </div>

              <div style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <span>Skill: <strong>{skillDone}/{skillTasks.length}</strong></span>
                <span>Drills: <strong>{interviewDone}/{interviewTasks.length}</strong></span>
                <span>Coding: <strong>{codingDone}/{codingTasks.length}</strong></span>
                <span style={{ color: '#10b981', fontWeight: '800', backgroundColor: '#dcfce7', padding: '2px 8px', borderRadius: '6px' }}>
                  {completionPercentage}% Done
                </span>
              </div>
            </div>

            {/* TOP STATS ROW FOR SELECTED DATE */}
            <div style={styles.statsRow}>
              {/* Mini Card 1: Today's Coding Time & LeetCode Problem Solved Counter */}
              <motion.div
                whileHover={{ y: -4, scale: 1.015, boxShadow: '0 8px 24px rgba(99, 102, 241, 0.25)' }}
                whileTap={{ scale: 0.985 }}
                transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                style={{ ...styles.statCard, background: 'linear-gradient(135deg, #c7d2fe 0%, #a5b4fc 100%)', border: '1px solid #818cf8', boxShadow: '0 4px 16px rgba(99, 102, 241, 0.15)' }}
              >
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
              </motion.div>

              {/* Mini Card 2: Interview Drills Completed */}
              <motion.div
                whileHover={{ y: -4, scale: 1.015, boxShadow: '0 8px 24px rgba(217, 70, 239, 0.25)' }}
                whileTap={{ scale: 0.985 }}
                transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                style={{ ...styles.statCard, background: 'linear-gradient(135deg, #f5d0fe 0%, #f0abfc 100%)', border: '1px solid #e879f9', boxShadow: '0 4px 16px rgba(217, 70, 239, 0.15)' }}
              >
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
              </motion.div>

              {/* Mini Card 3: Active Streak */}
              <motion.div
                whileHover={{ y: -4, scale: 1.015, boxShadow: '0 8px 24px rgba(245, 158, 11, 0.25)' }}
                whileTap={{ scale: 0.985 }}
                transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                style={{ ...styles.statCard, background: 'linear-gradient(135deg, #fde68a 0%, #fcd34d 100%)', border: '1px solid #fbbf24', boxShadow: '0 4px 16px rgba(245, 158, 11, 0.15)' }}
              >
                <div style={styles.statHeader}>
                  <span style={{ ...styles.statLabel, color: '#78350f' }}>ACTIVE STREAK</span>
                  <span style={{ ...styles.fireBadge, backgroundColor: '#ffffff', color: '#b45309', border: '1px solid #f59e0b' }}>Active</span>
                </div>
                <div style={styles.statValueRow}>
                  <span style={styles.statIcon}>🔥</span>
                  <span style={{ ...styles.statMainValue, color: '#78350f' }}>{activeStreak} days</span>
                </div>
              </motion.div>
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
                        <motion.div
                          key={task.id}
                          layout
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          whileHover={{ y: -3, scale: 1.01, boxShadow: '0 8px 20px rgba(99, 102, 241, 0.16)' }}
                          whileTap={{ scale: 0.985 }}
                          transition={{ type: 'spring', stiffness: 350, damping: 25 }}
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
                        </motion.div>
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
                        <motion.div
                          key={task.id}
                          layout
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          whileHover={{ y: -3, scale: 1.01, boxShadow: '0 8px 20px rgba(99, 102, 241, 0.16)' }}
                          whileTap={{ scale: 0.985 }}
                          transition={{ type: 'spring', stiffness: 350, damping: 25 }}
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
                        </motion.div>
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

              {/* COLUMN 3: 🟠 Interview Preparation */}
              <div style={styles.taskColumnCard}>
                <div style={{ ...styles.columnTitleHeader, backgroundColor: '#fef3c7', padding: '6px 12px', borderRadius: '10px', borderLeft: '4px solid #f59e0b' }}>
                  <span style={styles.orangeDot}>🟠</span>
                  <h3 style={{ ...styles.columnTitleText, color: '#78350f' }}>INTERVIEW PREPARATION</h3>
                </div>

                <div style={styles.taskList}>
                  {interviewTasks.length === 0 ? (
                    <div style={styles.emptyStateNotice}>No interview drills for this date</div>
                  ) : (
                    interviewTasks.map((task) => {
                      const isTimerActiveForThis = activeTaskTimerId === task.id && taskTimerIsRunning;
                      return (
                        <motion.div
                          key={task.id}
                          layout
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          whileHover={{ y: -3, scale: 1.01, boxShadow: '0 8px 20px rgba(99, 102, 241, 0.16)' }}
                          whileTap={{ scale: 0.985 }}
                          transition={{ type: 'spring', stiffness: 350, damping: 25 }}
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
                        </motion.div>
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

        {/* PAGE 2: SEPARATE DEDICATED CALENDAR VIEW PAGE */}
        {activeTab === 'calendar' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1.5px solid #cbd5e1',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 4px 18px rgba(0, 0, 0, 0.05)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#1e1b4b', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    📅 Task Activity Calendar
                  </h2>
                  <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0', fontWeight: '600' }}>
                    Click on any date to immediately switch to Today's Focus and view all tasks logged for that day.
                  </p>
                </div>

                {/* Month navigation controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#f1f5f9', padding: '6px 14px', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
                  <button
                    type="button"
                    onClick={() => shiftCalendarMonth(-1)}
                    style={{ border: 'none', background: 'none', cursor: 'pointer', fontWeight: '800', color: '#4338ca', fontSize: '13px' }}
                  >
                    ◀ Prev
                  </button>
                  <span style={{ fontSize: '14px', fontWeight: '800', color: '#1e1b4b', minWidth: '130px', textAlign: 'center' }}>
                    {new Date(calendarYearMonth.year, calendarYearMonth.month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase()}
                  </span>
                  <button
                    type="button"
                    onClick={() => shiftCalendarMonth(1)}
                    style={{ border: 'none', background: 'none', cursor: 'pointer', fontWeight: '800', color: '#4338ca', fontSize: '13px' }}
                  >
                    Next ▶
                  </button>
                </div>
              </div>

              {/* Day-of-week headers */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '10px', marginBottom: '10px', textAlign: 'center' }}>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                  <div key={d} style={{ fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>
                    {d}
                  </div>
                ))}
              </div>

              {/* Monthly days grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '10px' }}>
                {monthlyCalendarDays.map((cell, idx) => {
                  if (!cell) {
                    return <div key={`empty-${idx}`} style={{ minHeight: '75px', opacity: 0 }} />;
                  }
                  const isSelected = cell.dateStr === selectedDateStr;
                  const hasTasks = cell.totalCount > 0;

                  return (
                    <div
                      key={cell.dateStr}
                      onClick={() => {
                        setSelectedDateStr(cell.dateStr);
                        setActiveTab('focus');
                      }}
                      style={{
                        backgroundColor: isSelected ? '#e0e7ff' : hasTasks ? '#f0fdf4' : '#f8fafc',
                        border: isSelected ? '2.5px solid #4f46e5' : hasTasks ? '1.5px solid #86efac' : '1px solid #cbd5e1',
                        borderRadius: '12px',
                        padding: '10px 8px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justify: 'space-between',
                        minHeight: '75px',
                        cursor: 'pointer',
                        boxShadow: isSelected ? '0 4px 14px rgba(79, 70, 229, 0.3)' : 'none',
                        transform: isSelected ? 'scale(1.03)' : 'none',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <span style={{ fontSize: '14px', fontWeight: '800', color: isSelected ? '#4338ca' : '#0f172a' }}>
                        {cell.dayNum}
                      </span>

                      <div style={{ textAlign: 'center' }}>
                        <span style={{ fontSize: '10px', fontWeight: '700', display: 'block', color: isSelected ? '#4338ca' : hasTasks ? '#15803d' : '#94a3b8' }}>
                          {hasTasks ? `${cell.completedCount}/${cell.totalCount} Done` : '0 Tasks'}
                        </span>
                        {hasTasks && (
                          <span style={{ fontSize: '9px', fontWeight: '600', color: '#64748b' }}>
                            🎯 Click to view
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* PAGE 3: GAMIFIED CV INTERVIEW DRILLS */}
        {activeTab === 'cv_drills' && (
          <CvInterviewDrillsSection
            onAddInterviewTask={handleAddInterviewTaskFromDrill}
            addedTaskTitles={dailyTasks.filter((t) => t.taskDate === selectedDateStr && t.type === 'interview').map((t) => t.title)}
          />
        )}

        {/* PAGE 4: DEDICATED MIND RELAXING MENU PAGE */}
        {activeTab === 'relax' && <MindRelaxingSection />}

        {/* SIMPLE SITE OPEN MOTIVATIONAL POPUP MODAL */}
        <AnimatePresence>
          {isSiteOpenModalOpen && (
            <div style={styles.modalOverlay}>
              <motion.div
                initial={{ scale: 0.88, opacity: 0, y: -15 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.88, opacity: 0, y: -15 }}
                style={{
                  ...styles.modalContentCard,
                  width: '420px',
                  backgroundColor: '#ffffff',
                  border: '2px solid #6366f1',
                  boxShadow: '0 16px 36px rgba(99, 102, 241, 0.2)',
                  padding: '22px',
                  borderRadius: '18px',
                  position: 'relative',
                }}
              >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '24px' }}>👋</span>
                    <div>
                      <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#1e1b4b', margin: 0 }}>
                        Hi Adila! Let's Start Your Daily Tasks
                      </h3>
                      <span style={{ fontSize: '11px', color: '#4f46e5', fontWeight: '700' }}>
                        🎯 Goal: Land a Good Job & Master Skills!
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsSiteOpenModalOpen(false)}
                    style={{ border: 'none', background: '#f1f5f9', color: '#64748b', fontSize: '13px', fontWeight: '800', borderRadius: '50%', width: '26px', height: '26px', cursor: 'pointer' }}
                  >
                    ✕
                  </button>
                </div>

                {/* Simple Genuine Motivational Update Card */}
                <div style={{ backgroundColor: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: '12px', padding: '14px', marginBottom: '16px' }}>
                  <div style={{ fontSize: '13px', color: '#166534', fontWeight: '700', lineHeight: '1.5' }}>
                    💪 <strong>Daily Motivation Update:</strong>
                  </div>
                  <p style={{ fontSize: '12px', color: '#1f2937', fontWeight: '600', margin: '6px 0 0 0', lineHeight: '1.5' }}>
                    Right now the time is <strong>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>. Today you have completed <strong>{completedTodayTasks}</strong> out of <strong>{totalTodayTasks}</strong> tasks ({formatSecToMinSecStr((currentDateLog.codingSeconds || 0) + tasksForSelectedDate.reduce((acc, t) => acc + (t.elapsedSeconds || 0), 0))} focus time). Please complete your remaining tasks and keep practicing!
                  </p>
                </div>

                {/* Action Button */}
                <button
                  type="button"
                  onClick={() => {
                    playCompletionSound();
                    setIsSiteOpenModalOpen(false);
                  }}
                  style={{
                    width: '100%',
                    backgroundColor: '#4f46e5',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '11px',
                    fontSize: '13px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)',
                  }}
                >
                  🎯 Let's Start Today's Focus!
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>



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
                      <option value="interview">🟠 Interview Preparation</option>
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
    color: '#ef4444',
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
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
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
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
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
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
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
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
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
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: '24px',
  },
  activityGridRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(75px, 1fr))',
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
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
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

function CompletionCelebrationModal({ task, onClose }) {
  if (!task) return null;

  return (
    <div style={styles.modalOverlay}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ ...styles.modalContentCard, width: '400px', textAlign: 'center', padding: '28px 24px' }}>
        <div style={{ fontSize: '56px', marginBottom: '12px' }}>🎉</div>
        <h3 style={{ ...styles.modalTitle, color: '#10b981', fontSize: '22px', margin: '0 0 6px 0', fontWeight: '800' }}>Task Completed!</h3>
        <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '24px', fontWeight: '500' }}>Great job on completing your scheduled task!</p>

        <button onClick={onClose} style={{ ...styles.primaryActionBtn, backgroundColor: '#6366f1', width: '100%', padding: '12px', fontSize: '14px', fontWeight: '700', borderRadius: '12px' }}>
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
      : '🟠 Interview Preparation';

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

const mobileStyles = {
  mobileTopHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e2e8f0',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
  },
  menuToggleBtn: {
    backgroundColor: '#f1f5f9',
    border: '1px solid #cbd5e1',
    borderRadius: '10px',
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    color: '#0f172a',
    cursor: 'pointer',
  },
  drawerOverlay: {
    position: 'fixed',
    top: '60px',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    backdropFilter: 'blur(4px)',
    zIndex: 999,
    display: 'flex',
    flexDirection: 'column',
  },
  drawerContent: {
    backgroundColor: '#ffffff',
    padding: '20px 16px',
    borderBottomLeftRadius: '20px',
    borderBottomRightRadius: '20px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
    maxHeight: '80vh',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  bottomNavContainer: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    height: '65px',
    backgroundColor: '#ffffff',
    borderTop: '1px solid #e2e8f0',
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: '0 8px',
    boxShadow: '0 -4px 20px rgba(0,0,0,0.06)',
    zIndex: 1000,
  },
  bottomNavItem: {
    background: 'none',
    border: 'none',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px',
    padding: '6px 10px',
    borderRadius: '10px',
    cursor: 'pointer',
    flex: 1,
  },
  bottomNavAddBtn: {
    width: '46px',
    height: '46px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)',
    cursor: 'pointer',
    marginTop: '-15px',
  },
};

// ====================================================
// 🎮 GAMIFIED CV INTERVIEW DRILLS DATA & COMPONENT
// ====================================================
const CV_DRILL_QUESTIONS = [
  // CATEGORY 1: PHP & LARAVEL EXPERIENCE (Bpract Software Solutions)
  {
    id: 'php_1',
    category: 'PHP & Laravel (Bpract)',
    topic: 'MLM Architecture',
    question: 'How did you design the MySQL schema to represent referral trees (Binary/Unilevel) and calculate multi-tier commissions efficiently without crashing the DB?',
    talkingPoints: [
      'Used Materialized Path (`path` e.g., 1/4/12) and Adjacency Lists for O(1) ancestor/descendant tree queries.',
      'Batch commission calculations processed asynchronously using Laravel Queues & Database Transactions.',
      'Indexed `parent_id`, `sponsor_id`, `path`, and `user_id` columns to guarantee fast execution under < 20ms.'
    ]
  },
  {
    id: 'php_2',
    category: 'PHP & Laravel (Bpract)',
    topic: 'Race Conditions & Transactions',
    question: 'How did you handle wallet balance updates and transactions to ensure data consistency under high concurrent load?',
    talkingPoints: [
      'Implemented pessimistic locking (`DB::table(...)->lockForUpdate()`) wrapped inside `DB::transaction()`.',
      'Used double-entry ledger bookkeeping records instead of direct inplace mutations.',
      'Integrated Redis distributed locks (`Cache::lock()`) to guarantee idempotency across concurrent payment API hits.'
    ]
  },
  {
    id: 'php_3',
    category: 'PHP & Laravel (Bpract)',
    topic: 'Authentication & RBAC',
    question: 'How did you configure Laravel Sanctum/Passport alongside Role-Based Access Control (RBAC) to protect sensitive administrative routes?',
    talkingPoints: [
      'Issued bearer tokens via Sanctum API tokens with scoped permissions.',
      'Built custom HTTP Middleware (`CheckRolePermission`) combined with Laravel Gates/Policies.',
      'Enforced spatie/laravel-permission for granular role/permission enforcement across admin API routes.'
    ]
  },
  {
    id: 'php_4',
    category: 'PHP & Laravel (Bpract)',
    topic: 'Query Optimization',
    question: 'Can you give an example of an Eloquent query you refactored to solve an N+1 performance issue or optimize database execution times?',
    talkingPoints: [
      'Replaced loop queries with Eloquent eager loading (`User::with(["referrals", "wallet"])`).',
      'Used `select()` constraints to avoid fetching heavy unused columns.',
      'Added composite database indexes on filter columns (`created_at`, `status`, `user_id`).'
    ]
  },
  {
    id: 'php_5',
    category: 'PHP & Laravel (Bpract)',
    topic: 'REST APIs',
    question: 'What standard design rules did you follow when creating RESTful APIs for communication between frontend and backend components?',
    talkingPoints: [
      'Standardized HTTP status codes (200 OK, 201 Created, 400 Bad Request, 401 Unauthorized, 422 Unprocessable Entity).',
      'Used Eloquent API Resources for predictable JSON response payload formatting.',
      'Implemented API versioning (`/api/v1/`) and FormRequest validation classes.'
    ]
  },

  // CATEGORY 2: MERN STACK EXPERIENCE (Ipix Technologies)
  {
    id: 'mern_1',
    category: 'MERN Stack (Ipix)',
    topic: 'React State Management',
    question: 'How did you manage dynamic data binding and complex application state across your React interfaces?',
    talkingPoints: [
      'Used React Hooks (`useState`, `useReducer`, `useContext`) alongside modular custom hooks.',
      'Optimized component re-renders with `useMemo`, `useCallback`, and layout state lifting.',
      'Synced server state efficiently with REST endpoints and local storage persistence.'
    ]
  },
  {
    id: 'mern_2',
    category: 'MERN Stack (Ipix)',
    topic: 'Express & Node Architecture',
    question: 'How did you structure your Express route handlers, custom middleware, and asynchronous error handling?',
    talkingPoints: [
      'Followed Controller-Service-Repository pattern with separated modular router modules.',
      'Created centralized async error handler wrapper (`asyncHandler`) to catch unhandled promise rejections.',
      'Applied JWT authentication middleware and CORS security configuration.'
    ]
  },
  {
    id: 'mern_3',
    category: 'MERN Stack (Ipix)',
    topic: 'Integration & Workflows',
    question: 'How did you debug API integration issues between Node backends and React frontends during team development?',
    talkingPoints: [
      'Used Postman & Chrome DevTools Network Tab for HTTP payload and header inspection.',
      'Implemented standardized API error response schemas `{ success: false, message, errors }`.',
      'Configured Axios interceptors for global JWT token injection and automated error toasts.'
    ]
  },
  {
    id: 'mern_4',
    category: 'MERN Stack (Ipix)',
    topic: 'Performance Testing',
    question: 'What specific debugging techniques and performance tools did you use during your internship testing routines?',
    talkingPoints: [
      'Used React Profiler to audit expensive re-renders and component bottlenecks.',
      'Tested REST API response benchmarks using Postman and Node memory diagnostics.',
      'Inspected Chrome Lighthouse for CWV (LCP, CLS, INP) performance optimization.'
    ]
  },

  // CATEGORY 3: PROJECT-SPECIFIC QUESTIONS
  {
    id: 'proj_1',
    category: 'Project Deep Dives',
    topic: 'Vehicle Marketplace - Forecasting Model',
    question: 'What logic or algorithm did you use to build the sales/demand forecasting model in the admin dashboard?',
    talkingPoints: [
      'Implemented Moving Average & Linear Trend Regression algorithms on historical booking logs.',
      'Aggregated monthly vehicle sales trends by category, brand, and pricing tier.',
      'Computed seasonal demand multipliers to project prospective inventory requirements.'
    ]
  },
  {
    id: 'proj_2',
    category: 'Project Deep Dives',
    topic: 'Vehicle Marketplace - Payment Integration',
    question: 'How did you handle payment gateway webhooks securely to update booking and order statuses reliably?',
    talkingPoints: [
      'Verified HMAC-SHA256 signature headers from payment gateway before processing payload.',
      'Maintained idempotent webhook processor (`webhook_logs` DB table) to ignore duplicate events.',
      'Used atomic DB transactions to switch booking status to `CONFIRMED` upon payment success.'
    ]
  },
  {
    id: 'proj_3',
    category: 'Project Deep Dives',
    topic: 'Vehicle Marketplace - Complaint Handling',
    question: 'How was the complaint management module architected from a database status-flow perspective?',
    talkingPoints: [
      'Finite State Machine (FSM): `OPEN` -> `IN_REVIEW` -> `RESOLVED` / `REJECTED`.',
      'Logged complete audit history in `complaint_history` with timestamp and admin user ID.',
      'Triggered automated email notifications upon each state transition.'
    ]
  },
  {
    id: 'proj_4',
    category: 'Project Deep Dives',
    topic: 'Academic Task System - Mark Calculation',
    question: 'How did you automate internal mark calculations scalably, and how did you handle edge cases (missing assignments, re-evaluations)?',
    talkingPoints: [
      'Built formula engines evaluating weights (e.g. 20% Assignment, 30% Midterm, 50% Final).',
      'Handled null/missing entries via configurable fallback policies (zero vs excuse code).',
      'Re-evaluation triggers automated asynchronous recalculation of affected student GPAs.'
    ]
  },
  {
    id: 'proj_5',
    category: 'Project Deep Dives',
    topic: 'Academic Task System - Workflow & Permissions',
    question: 'How did the architecture support different academic roles (students, teachers, admins) with varying access permissions?',
    talkingPoints: [
      'Role-Based Authorization matrix for Student, Teacher, HOD, and Admin.',
      'Scoped queries (e.g., Teachers only access enrolled courses; Students only view own grades).',
      'Front-end route guards paired with server-side middleware enforcement.'
    ]
  },

  // CATEGORY 4: CORE TECHNICAL & LANGUAGE DEEP DIVES
  {
    id: 'core_1',
    category: 'Core Tech & Languages',
    topic: 'MySQL vs. MongoDB',
    question: 'Having used both MySQL and MongoDB, how do you decide between a relational model and a document-based schema for a new feature?',
    talkingPoints: [
      'MySQL for ACID compliance, complex relational integrity, and financial ledgers.',
      'MongoDB for unstructured dynamic catalogs, rapid prototyping, and high-read document trees.',
      'Evaluated query access patterns: join heavy (MySQL) vs embedded document (MongoDB).'
    ]
  },
  {
    id: 'core_2',
    category: 'Core Tech & Languages',
    topic: 'JavaScript ES6+ & Event Loop',
    question: 'Explain closures, prototypal inheritance, and how Promises interact with the Node.js Event Loop under the hood.',
    talkingPoints: [
      'Closure: Function retains access to lexical scope variable scope even after parent execution.',
      'Prototypal Inheritance: Objects inherit properties via `__proto__` prototype chain.',
      'Event Loop & Promises: Microtask Queue (Promises, process.nextTick) executes BEFORE Macrotask Queue (setTimeout, setInterval).'
    ]
  },
  {
    id: 'core_3',
    category: 'Core Tech & Languages',
    topic: 'C & Python Memory Management',
    question: 'How does manual memory management in C compare to automatic garbage collection in PHP or Node.js?',
    talkingPoints: [
      'C requires explicit `malloc()` and `free()`; risk of memory leaks and dangling pointers.',
      'PHP / Node.js use Reference Counting & Mark-and-Sweep Garbage Collection automatically.',
      'Manual memory gives precise low-level control; automatic GC trades minor latency overhead for safety.'
    ]
  },
  {
    id: 'core_4',
    category: 'Core Tech & Languages',
    topic: 'Git Collaboration',
    question: 'Walk me through your team\'s Git workflow—how do you handle feature branches, code reviews, and resolving merge conflicts?',
    talkingPoints: [
      'Git Flow / Feature Branching: `main` ➔ `develop` ➔ `feature/feature-name`.',
      'Pull Requests require peer review and passing automated CI build tests before merging.',
      'Conflicts resolved locally via `git rebase develop` or interactive merge resolution.'
    ]
  }
];

const CvInterviewDrillsSection = ({ onAddInterviewTask, addedTaskTitles = [] }) => {
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [revealedIds, setRevealedIds] = useState([]);
  const [addedIds, setAddedIds] = useState([]);

  const categories = [
    'ALL',
    'PHP & Laravel (Bpract)',
    'MERN Stack (Ipix)',
    'Project Deep Dives',
    'Core Tech & Languages'
  ];

  const filteredQuestions = selectedCategory === 'ALL'
    ? CV_DRILL_QUESTIONS
    : CV_DRILL_QUESTIONS.filter((q) => q.category === selectedCategory);

  const handleCardClick = (q) => {
    // Toggle reveal
    setRevealedIds((prev) =>
      prev.includes(q.id) ? prev.filter((item) => item !== q.id) : [...prev, q.id]
    );

    // Track added
    if (!addedIds.includes(q.id)) {
      setAddedIds((prev) => [...prev, q.id]);
    }

    // Call parent handler to add into Column 3: INTERVIEW PREPARATION tasks
    if (onAddInterviewTask) {
      onAddInterviewTask(q.question);
    }
  };

  const addedCount = addedIds.length || addedTaskTitles.length;
  const totalCount = CV_DRILL_QUESTIONS.length;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      {/* HEADER GAMIFIED SCORE BAR */}
      <div style={{ backgroundColor: '#ffffff', border: '1.5px solid #cbd5e1', borderRadius: '16px', padding: '18px', marginBottom: '20px', boxShadow: '0 4px 14px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ fontSize: '17px', fontWeight: '900', color: '#1e1b4b', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              🎮 CV-Based Technical Interview Drills
            </h3>
            <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0 0', fontWeight: '600' }}>
              Click any question card to automatically add it into your <strong>Interview Preparation</strong> tasks!
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: '#fef3c7', padding: '8px 14px', borderRadius: '12px', border: '1.5px solid #f59e0b' }}>
            <span style={{ fontSize: '20px' }}>🟠</span>
            <div>
              <span style={{ fontSize: '10px', fontWeight: '800', color: '#78350f', display: 'block' }}>ADDED TO PREPARATION</span>
              <span style={{ fontSize: '14px', fontWeight: '900', color: '#b45309' }}>
                {addedCount} / {totalCount} Drills
              </span>
            </div>
          </div>
        </div>

        {/* Category Filters */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '16px', flexWrap: 'wrap' }}>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              style={{
                backgroundColor: selectedCategory === cat ? '#6366f1' : '#f1f5f9',
                color: selectedCategory === cat ? '#ffffff' : '#475569',
                border: selectedCategory === cat ? 'none' : '1px solid #cbd5e1',
                borderRadius: '20px',
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: '800',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* QUESTIONS GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '16px' }}>
        {filteredQuestions.map((q) => {
          const isRevealed = revealedIds.includes(q.id);
          const isAdded = addedIds.includes(q.id) || addedTaskTitles.includes(q.question);

          return (
            <motion.div
              key={q.id}
              onClick={() => handleCardClick(q)}
              whileHover={{ y: -4, scale: 1.01, boxShadow: '0 10px 24px rgba(245, 158, 11, 0.2)' }}
              whileTap={{ scale: 0.985 }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              style={{
                backgroundColor: '#ffffff',
                border: isAdded ? '2px solid #f59e0b' : '1.5px solid #cbd5e1',
                borderRadius: '16px',
                padding: '18px',
                boxShadow: isAdded ? '0 4px 14px rgba(245, 158, 11, 0.15)' : '0 4px 12px rgba(0,0,0,0.03)',
                display: 'flex',
                flexDirection: 'column',
                justify: 'space-between',
                cursor: 'pointer',
                userSelect: 'none',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '10px', fontWeight: '800', color: '#6366f1', backgroundColor: '#e0e7ff', padding: '3px 8px', borderRadius: '6px' }}>
                    {q.category}
                  </span>
                  <span style={{ fontSize: '11px', fontWeight: '800', color: '#b45309', backgroundColor: '#fef3c7', padding: '3px 8px', borderRadius: '6px' }}>
                    📌 {q.topic}
                  </span>
                </div>

                <h4 style={{ fontSize: '13.5px', fontWeight: '800', color: '#0f172a', margin: '0 0 12px 0', lineHeight: '1.45' }}>
                  {q.question}
                </h4>

                {isRevealed && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', padding: '12px', marginBottom: '12px' }}
                  >
                    <div style={{ fontSize: '11px', fontWeight: '800', color: '#78350f', marginBottom: '6px' }}>
                      💡 Key Talking Points & Model Answer:
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '11px', color: '#451a03', fontWeight: '600', lineHeight: '1.5' }}>
                      {q.talkingPoints.map((pt, i) => (
                        <li key={i} style={{ marginBottom: '4px' }}>{pt}</li>
                      ))}
                    </ul>
                  </motion.div>
                )}
              </div>

              {/* CARD STATUS BADGE */}
              <div style={{
                marginTop: '12px',
                padding: '8px 12px',
                borderRadius: '10px',
                backgroundColor: isAdded ? '#fef3c7' : '#f1f5f9',
                color: isAdded ? '#b45309' : '#64748b',
                border: isAdded ? '1px solid #fde68a' : '1px solid #cbd5e1',
                fontSize: '11.5px',
                fontWeight: '800',
                display: 'flex',
                alignItems: 'center',
                justify: 'center',
                gap: '6px',
                textAlign: 'center',
              }}>
                {isAdded
                  ? '🟠 Added to Interview Preparation! (Click to toggle answer)'
                  : '➕ Click card to add to Interview Preparation tasks'}
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

// ====================================================
// 🧩 SUDOKU MINI-GAME & MIND RELAXING COMPONENT
// ====================================================
const MindRelaxingSection = () => {
  // Pre-configured valid Sudoku Puzzles
  const SUDOKU_PUZZLES = [
    {
      initial: [
        [5, 3, 0, 0, 7, 0, 0, 0, 0],
        [6, 0, 0, 1, 9, 5, 0, 0, 0],
        [0, 9, 8, 0, 0, 0, 0, 6, 0],
        [8, 0, 0, 0, 6, 0, 0, 0, 3],
        [4, 0, 0, 8, 0, 3, 0, 0, 1],
        [7, 0, 0, 0, 2, 0, 0, 0, 6],
        [0, 6, 0, 0, 0, 0, 2, 8, 0],
        [0, 0, 0, 4, 1, 9, 0, 0, 5],
        [0, 0, 0, 0, 8, 0, 0, 7, 9],
      ],
      solution: [
        [5, 3, 4, 6, 7, 8, 9, 1, 2],
        [6, 7, 2, 1, 9, 5, 3, 4, 8],
        [1, 9, 8, 3, 4, 2, 5, 6, 7],
        [8, 5, 9, 7, 6, 1, 4, 2, 3],
        [4, 2, 6, 8, 5, 3, 7, 9, 1],
        [7, 1, 3, 9, 2, 4, 8, 5, 6],
        [9, 6, 1, 5, 3, 7, 2, 8, 4],
        [2, 8, 7, 4, 1, 9, 6, 3, 5],
        [3, 4, 5, 2, 8, 6, 1, 7, 9],
      ]
    },
    {
      initial: [
        [0, 0, 0, 2, 6, 0, 7, 0, 1],
        [6, 8, 0, 0, 7, 0, 0, 9, 0],
        [1, 9, 0, 0, 0, 4, 5, 0, 0],
        [8, 2, 0, 1, 0, 0, 0, 4, 0],
        [0, 0, 4, 6, 0, 2, 9, 0, 0],
        [0, 5, 0, 0, 0, 3, 0, 2, 8],
        [0, 0, 9, 3, 0, 0, 0, 7, 4],
        [0, 4, 0, 0, 5, 0, 0, 3, 6],
        [7, 0, 3, 0, 1, 8, 0, 0, 0],
      ],
      solution: [
        [4, 3, 5, 2, 6, 9, 7, 8, 1],
        [6, 8, 2, 5, 7, 1, 4, 9, 3],
        [1, 9, 7, 8, 3, 4, 5, 6, 2],
        [8, 2, 6, 1, 9, 5, 3, 4, 7],
        [3, 7, 4, 6, 8, 2, 9, 1, 5],
        [9, 5, 1, 7, 4, 3, 6, 2, 8],
        [5, 1, 9, 3, 2, 6, 8, 7, 4],
        [2, 4, 8, 9, 5, 7, 1, 3, 6],
        [7, 6, 3, 4, 1, 8, 2, 5, 9],
      ]
    }
  ];

  const [puzzleIndex, setPuzzleIndex] = useState(0);
  const [grid, setGrid] = useState(() => JSON.parse(JSON.stringify(SUDOKU_PUZZLES[0].initial)));
  const [selectedCell, setSelectedCell] = useState(null); // [r, c]
  const [statusMsg, setStatusMsg] = useState('');
  const [breathPhase, setBreathPhase] = useState('🫁 Inhale (4s)');
  const [isBreathingActive, setIsBreathingActive] = useState(false);

  const initialPuzzle = SUDOKU_PUZZLES[puzzleIndex].initial;
  const solutionPuzzle = SUDOKU_PUZZLES[puzzleIndex].solution;

  const handleCellClick = (r, c) => {
    setSelectedCell([r, c]);
  };

  const handleNumberInput = (num) => {
    if (!selectedCell) return;
    const [r, c] = selectedCell;
    if (initialPuzzle[r][c] !== 0) return; // Fixed clue cell

    setGrid((prev) => {
      const copy = JSON.parse(JSON.stringify(prev));
      copy[r][c] = num;
      return copy;
    });
    setStatusMsg('');
  };

  const newSudokuGame = () => {
    const nextIdx = (puzzleIndex + 1) % SUDOKU_PUZZLES.length;
    setPuzzleIndex(nextIdx);
    setGrid(JSON.parse(JSON.stringify(SUDOKU_PUZZLES[nextIdx].initial)));
    setSelectedCell(null);
    setStatusMsg('✨ New Sudoku game loaded!');
  };

  const checkSudokuSolution = () => {
    let isCorrect = true;
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (grid[r][c] === 0 || grid[r][c] !== solutionPuzzle[r][c]) {
          isCorrect = false;
          break;
        }
      }
    }
    if (isCorrect) {
      setStatusMsg('🎉 Congratulations! You solved the Sudoku puzzle!');
    } else {
      setStatusMsg('⚠️ Some numbers are incorrect or missing. Keep trying!');
    }
  };

  // Keyboard input for Sudoku
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!selectedCell) return;
      const num = parseInt(e.key, 10);
      if (!isNaN(num) && num >= 1 && num <= 9) {
        handleNumberInput(num);
      } else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
        handleNumberInput(0);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCell, grid]);

  // Box Breathing Guide Timer
  useEffect(() => {
    if (!isBreathingActive) return;
    const phases = ['🫁 Inhale (4s)', '⏸️ Hold (4s)', '🌬️ Exhale (4s)', '⏸️ Hold (4s)'];
    let idx = 0;
    const interval = setInterval(() => {
      idx = (idx + 1) % phases.length;
      setBreathPhase(phases[idx]);
    }, 4000);
    return () => clearInterval(interval);
  }, [isBreathingActive]);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
        {/* CARD 1: SUDOKU GAME */}
        <div style={{ backgroundColor: '#ffffff', border: '1.5px solid #cbd5e1', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 14px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#1e1b4b', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                🧩 Sudoku Puzzle
              </h3>
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>
                Fill 1-9 in each row, column & 3x3 block
              </span>
            </div>
            <button
              type="button"
              onClick={newSudokuGame}
              style={{
                backgroundColor: '#4f46e5',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '11px',
                fontWeight: '800',
                cursor: 'pointer',
              }}
            >
              🔄 New Game
            </button>
          </div>

          {/* 9x9 Sudoku Board */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(9, 1fr)',
              border: '2px solid #334155',
              borderRadius: '8px',
              overflow: 'hidden',
              maxWidth: '340px',
              margin: '0 auto',
            }}
          >
            {grid.map((row, r) =>
              row.map((val, c) => {
                const isClue = initialPuzzle[r][c] !== 0;
                const isSelected = selectedCell && selectedCell[0] === r && selectedCell[1] === c;
                const borderRight = (c + 1) % 3 === 0 && c < 8 ? '2px solid #334155' : '1px solid #cbd5e1';
                const borderBottom = (r + 1) % 3 === 0 && r < 8 ? '2px solid #334155' : '1px solid #cbd5e1';

                return (
                  <div
                    key={`${r}-${c}`}
                    onClick={() => handleCellClick(r, c)}
                    style={{
                      width: '36px',
                      height: '36px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px',
                      fontWeight: isClue ? '900' : '700',
                      color: isClue ? '#0f172a' : '#4f46e5',
                      backgroundColor: isSelected
                        ? '#c7d2fe'
                        : isClue
                        ? '#f1f5f9'
                        : '#ffffff',
                      borderRight,
                      borderBottom,
                      cursor: 'pointer',
                      userSelect: 'none',
                    }}
                  >
                    {val !== 0 ? val : ''}
                  </div>
                );
              })
            )}
          </div>

          {/* Number Pad Selection (1 to 9 & Clear) */}
          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginTop: '14px', flexWrap: 'wrap' }}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleNumberInput(num)}
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '6px',
                  border: '1px solid #c7d2fe',
                  backgroundColor: '#e0e7ff',
                  color: '#4338ca',
                  fontWeight: '800',
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              onClick={() => handleNumberInput(0)}
              style={{
                borderRadius: '6px',
                border: '1px solid #fca5a5',
                backgroundColor: '#fef2f2',
                color: '#ef4444',
                fontWeight: '800',
                fontSize: '11px',
                padding: '0 8px',
                cursor: 'pointer',
              }}
            >
              Clear ✕
            </button>
          </div>

          {statusMsg && (
            <div style={{ textAlign: 'center', fontSize: '12px', fontWeight: '700', color: '#1e1b4b', marginTop: '10px' }}>
              {statusMsg}
            </div>
          )}

          <button
            type="button"
            onClick={checkSudokuSolution}
            style={{
              width: '100%',
              backgroundColor: '#10b981',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              padding: '8px',
              fontSize: '12px',
              fontWeight: '800',
              cursor: 'pointer',
              marginTop: '12px',
            }}
          >
            ✓ Check Sudoku Solution
          </button>
        </div>

        {/* CARD 2: MIND RELAXING BOX BREATHING */}
        <div style={{ backgroundColor: '#ffffff', border: '1.5px solid #cbd5e1', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 14px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#1e1b4b', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
              🫁 Box Breathing Relaxer
            </h3>
            <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 16px 0', fontWeight: '600' }}>
              Reduce study burnout & restore energy with guided 4-second box breathing.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
              <motion.div
                animate={{ scale: isBreathingActive ? [1, 1.35, 1.35, 1] : 1 }}
                transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                  width: '110px',
                  height: '110px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #a5b4fc 0%, #6366f1 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  fontWeight: '800',
                  fontSize: '13px',
                  boxShadow: '0 10px 25px rgba(99, 102, 241, 0.35)',
                  textAlign: 'center',
                  padding: '8px',
                }}
              >
                {isBreathingActive ? breathPhase : 'Start Box Breathing'}
              </motion.div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsBreathingActive(!isBreathingActive)}
            style={{
              width: '100%',
              backgroundColor: isBreathingActive ? '#ef4444' : '#10b981',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              padding: '10px',
              fontWeight: '800',
              cursor: 'pointer',
              fontSize: '13px',
            }}
          >
            {isBreathingActive ? '⏹️ Stop Breathing Guide' : '▶ Start Breathing Exercise'}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

