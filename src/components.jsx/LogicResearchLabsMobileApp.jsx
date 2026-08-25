import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE = 'http://127.0.0.1:8000/api';

export default function LogicResearchLabsMobileApp() {
  const [activeScreen] = useState('dashboard'); // 'dashboard', 'welcome', 'search', 'tasks'
  const [viewMode, setViewMode] = useState('phone-simulator'); // 'phone-simulator', 'responsive'
  const [selectedFilter, setSelectedFilter] = useState('Overdue');
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Auth screen state
  const [username, setUsername] = useState('Suriya Admin');
  const [password, setPassword] = useState('••••••••');
  const [showPassword, setShowPassword] = useState(false);

  // Form state for creating new task
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('Important'); // 'Urgent', 'Important', 'Information'
  const [newTaskStatus, setNewTaskStatus] = useState('Inprogress'); // 'Overdue', 'Due Soon', 'Open', 'Accepted', 'Inprogress', 'Completed'
  const [newTaskAssignee, setNewTaskAssignee] = useState('Sahithya (UI/UX Designer)');
  const [newTaskDueDate, setNewTaskDueDate] = useState('18/09/2023');

  // Sample tasks state
  const [tasks, setTasks] = useState([
    {
      id: 1,
      priority: 'Important',
      status: 'Inprogress',
      title: 'Design the Assigned Task Page',
      assignedTo: 'Sahithya - UI/UX Designer',
      overdueText: '2 days Overdue',
      expirationDate: 'Expiration 18/09/2023',
      priorityColor: '#fef08a', // light yellow
      priorityTextColor: '#854d0e',
      statusColor: '#ffedd5',
      statusTextColor: '#c2410c',
    },
    {
      id: 2,
      priority: 'Information',
      status: 'Open',
      title: 'Design the Assigned Task Page',
      assignedTo: 'Sahithya - UI/UX Designer',
      overdueText: '5 days Overdue',
      expirationDate: 'Expiration 15/09/2023',
      priorityColor: '#e0f2fe', // light blue
      priorityTextColor: '#0369a1',
      statusColor: '#e0e7ff',
      statusTextColor: '#4338ca',
    },
    {
      id: 3,
      priority: 'Urgent',
      status: 'Overdue',
      title: 'Backend API Authentication Setup',
      assignedTo: 'Alex - Senior Dev',
      overdueText: '3 days Overdue',
      expirationDate: 'Expiration 12/09/2023',
      priorityColor: '#fee2e2', // light red
      priorityTextColor: '#991b1b',
      statusColor: '#ffedd5',
      statusTextColor: '#9a3412',
    },
    {
      id: 4,
      priority: 'Important',
      status: 'Due Soon',
      title: 'Mobile Push Notifications integration',
      assignedTo: 'Priya - Mobile Dev',
      overdueText: 'Due in 2 days',
      expirationDate: 'Expiration 28/09/2023',
      priorityColor: '#fef08a',
      priorityTextColor: '#854d0e',
      statusColor: '#fef3c7',
      statusTextColor: '#b45309',
    },
    {
      id: 5,
      priority: 'Information',
      status: 'Completed',
      title: 'Database Schema Optimization',
      assignedTo: 'Rahul - DBA',
      overdueText: 'Completed',
      expirationDate: 'Expiration 20/09/2023',
      priorityColor: '#d1fae5',
      priorityTextColor: '#065f46',
      statusColor: '#d1fae5',
      statusTextColor: '#047857',
    },
  ]);

  // Try fetching API tasks on mount
  useEffect(() => {
    async function loadTasks() {
      try {
        const res = await fetch(`${API_BASE}/unified-daily-items`);
        const data = await res.json();
        if (data.status === 'success' && Array.isArray(data.data) && data.data.length > 0) {
          const mapped = data.data.map((item, idx) => ({
            id: item.id || idx + 10,
            priority: idx % 3 === 0 ? 'Urgent' : idx % 2 === 0 ? 'Important' : 'Information',
            status: item.status === 'Completed' ? 'Completed' : 'Inprogress',
            title: item.title,
            assignedTo: 'Sahithya - UI/UX Designer',
            overdueText: item.status === 'Completed' ? 'Completed' : '2 days Overdue',
            expirationDate: 'Expiration 18/09/2023',
            priorityColor: idx % 3 === 0 ? '#fee2e2' : idx % 2 === 0 ? '#fef08a' : '#e0f2fe',
            priorityTextColor: idx % 3 === 0 ? '#991b1b' : idx % 2 === 0 ? '#854d0e' : '#0369a1',
            statusColor: '#ffedd5',
            statusTextColor: '#c2410c',
          }));
          setTasks(mapped);
        }
      } catch (err) {
        console.log('Using demo dataset matching Logic Research Labs design');
      }
    }
    loadTasks();
  }, []);

  // Filter tasks based on selected filter pill and search query
  const filteredTasks = tasks.filter((task) => {
    const matchesFilter =
      selectedFilter === 'All'
        ? true
        : selectedFilter === 'Overdue'
        ? task.status === 'Overdue' || task.overdueText.includes('Overdue')
        : selectedFilter === 'Due Soon'
        ? task.status === 'Due Soon' || task.overdueText.includes('Due')
        : task.status.toLowerCase() === selectedFilter.toLowerCase();

    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.assignedTo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.priority.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  // Calculate counters
  const overdueCount = tasks.filter((t) => t.status === 'Overdue' || t.overdueText.includes('Overdue')).length;
  const dueSoonCount = tasks.filter((t) => t.status === 'Due Soon' || t.overdueText.includes('Due')).length;
  const openCount = tasks.filter((t) => t.status === 'Open').length;
  const inprogressCount = tasks.filter((t) => t.status === 'Inprogress').length;
  const urgentCount = tasks.filter((t) => t.priority === 'Urgent').length;
  const importantCount = tasks.filter((t) => t.priority === 'Important').length;

  // Add Task Handler
  const handleAddTask = (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const newTask = {
      id: Date.now(),
      priority: newTaskPriority,
      status: newTaskStatus,
      title: newTaskTitle.trim(),
      assignedTo: newTaskAssignee,
      overdueText: newTaskStatus === 'Overdue' ? '2 days Overdue' : 'Due in 3 days',
      expirationDate: `Expiration ${newTaskDueDate}`,
      priorityColor:
        newTaskPriority === 'Urgent'
          ? '#fee2e2'
          : newTaskPriority === 'Important'
          ? '#fef08a'
          : '#e0f2fe',
      priorityTextColor:
        newTaskPriority === 'Urgent'
          ? '#991b1b'
          : newTaskPriority === 'Important'
          ? '#854d0e'
          : '#0369a1',
      statusColor: '#ffedd5',
      statusTextColor: '#c2410c',
    };

    setTasks([newTask, ...tasks]);
    setNewTaskTitle('');
    setIsAddModalOpen(false);
  };

  const handleToggleTaskStatus = (id) => {
    setTasks(
      tasks.map((t) => {
        if (t.id === id) {
          const nextStatus = t.status === 'Completed' ? 'Inprogress' : 'Completed';
          return {
            ...t,
            status: nextStatus,
            overdueText: nextStatus === 'Completed' ? 'Completed' : '2 days Overdue',
          };
        }
        return t;
      })
    );
  };

  return (
    <div style={styles.outerWrapper}>
      {/* Top Banner Control Panel */}
      <div style={styles.topControlBanner}>
        <div style={styles.brandTitleGroup}>
          <div style={styles.logoPill}>
            <span style={{ fontWeight: '900', color: '#ff7a00', fontSize: '1.1rem' }}>R</span>
          </div>
          <div>
            <h2 style={styles.brandName}>Logic Research Labs</h2>
            <span style={styles.brandSubtext}>Mobile Task & Workflow Management Interface</span>
          </div>
        </div>

        <div style={styles.viewModeToggleRow}>
          <button
            onClick={() => setViewMode('phone-simulator')}
            style={{
              ...styles.toggleBtn,
              backgroundColor: viewMode === 'phone-simulator' ? '#ff7a00' : '#ffffff',
              color: viewMode === 'phone-simulator' ? '#ffffff' : '#475569',
            }}
          >
            📱 3-Phone Showcase View
          </button>
          <button
            onClick={() => setViewMode('responsive')}
            style={{
              ...styles.toggleBtn,
              backgroundColor: viewMode === 'responsive' ? '#ff7a00' : '#ffffff',
              color: viewMode === 'responsive' ? '#ffffff' : '#475569',
            }}
          >
            💻 Interactive App View
          </button>
        </div>
      </div>

      {/* 1. THREE PHONE SHOWCASE VIEW (Exact replica of user screenshot!) */}
      {viewMode === 'phone-simulator' ? (
        <div style={styles.simulatorContainer}>
          {/* Phone 1: Assigned Tasks List & Search (Left Phone) */}
          <div style={styles.phoneMockup}>
            <div style={styles.phoneHeaderNotch}>
              <span style={styles.phoneTime}>19:02</span>
              <div style={styles.phoneSensors}>
                <span style={styles.sensorDot} />
                <span style={styles.speakerBar} />
              </div>
            </div>

            <div style={styles.phoneScreenContent}>
              <div style={styles.phoneTopTitleBar}>
                <h4 style={styles.phoneAppTitle}>Assigned Tasks</h4>
              </div>

              {/* Search Bar */}
              <div style={styles.phoneSearchBox}>
                <span style={{ marginRight: '6px', color: '#94a3b8' }}>🔍</span>
                <input
                  type="text"
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={styles.phoneSearchInput}
                />
              </div>

              {/* Counter Badges Grid */}
              <div style={styles.phoneCounterGrid}>
                <div style={styles.phoneCounterCardUrgent}>
                  <span style={styles.counterCardNumber}>{urgentCount}</span>
                  <span style={styles.counterCardLabel}>Urgent</span>
                </div>
                <div style={styles.phoneCounterCardImportant}>
                  <span style={styles.counterCardNumber}>{importantCount || 4}</span>
                  <span style={styles.counterCardLabel}>Important</span>
                </div>
              </div>

              {/* Task Items Mini List */}
              <div style={styles.phoneMiniTaskList}>
                {filteredTasks.slice(0, 3).map((task) => (
                  <div key={task.id} style={styles.phoneTaskCard}>
                    <div style={styles.phoneTaskCardHeader}>
                      <span
                        style={{
                          ...styles.phonePriorityBadge,
                          backgroundColor: task.priorityColor,
                          color: task.priorityTextColor,
                        }}
                      >
                        {task.priority}
                      </span>
                      <span style={styles.phoneStatusText}>Status - {task.status}</span>
                    </div>
                    <h5 style={styles.phoneTaskTitle}>{task.title}</h5>
                    <div style={styles.phoneTaskSubRow}>
                      <span style={styles.phoneOverdueText}>{task.overdueText}</span>
                      <span style={styles.phoneAssigneeText}>{task.assignedTo}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Bar */}
            <div style={styles.phoneBottomNav}>
              <span style={styles.phoneNavIconActive}>🏠</span>
              <span style={styles.phoneNavIcon}>📋</span>
              <span style={styles.phoneNavAddBtn}>+</span>
              <span style={styles.phoneNavIcon}>👥</span>
              <span style={styles.phoneNavIcon}>⚙️</span>
            </div>
          </div>

          {/* Phone 2: Welcome / Login Screen (Center Phone in screenshot) */}
          <div style={{ ...styles.phoneMockup, boxShadow: '0 20px 40px rgba(255, 122, 0, 0.15)', border: '2px solid #fed7aa' }}>
            <div style={styles.phoneHeaderNotch}>
              <span style={styles.phoneTime}>19:02</span>
              <div style={styles.phoneSensors}>
                <span style={styles.sensorDot} />
                <span style={styles.speakerBar} />
              </div>
            </div>

            <div style={{ ...styles.phoneScreenContent, justifyContent: 'space-between', padding: '1.25rem' }}>
              {/* Top Welcome Graphic / Vector Illustration */}
              <div style={styles.welcomeGraphicWrapper}>
                <svg width="140" height="130" viewBox="0 0 200 180" fill="none">
                  {/* Clipboard background */}
                  <rect x="50" y="30" width="100" height="130" rx="12" fill="#fff7ed" stroke="#fed7aa" strokeWidth="3" />
                  <rect x="75" y="20" width="50" height="16" rx="6" fill="#ff7a00" />
                  {/* Clock circle */}
                  <circle cx="50" cy="50" r="22" fill="#fff" stroke="#ff7a00" strokeWidth="4" />
                  <path d="M50 38 V50 H58" stroke="#ff7a00" strokeWidth="4" strokeLinecap="round" />
                  {/* Calendar widget */}
                  <rect x="125" y="55" width="45" height="45" rx="8" fill="#ff7a00" />
                  <circle cx="137" cy="70" r="3" fill="#fff" />
                  <circle cx="148" cy="70" r="3" fill="#fff" />
                  <circle cx="159" cy="70" r="3" fill="#fff" />
                  <circle cx="137" cy="85" r="3" fill="#fff" />
                  <circle cx="148" cy="85" r="3" fill="#fff" />
                  <circle cx="159" cy="85" r="3" fill="#fff" />
                  {/* Pencil */}
                  <path d="M40 140 L70 110 L80 120 L50 150 Z" fill="#ff7a00" />
                  {/* Checklist lines */}
                  <line x1="70" y1="70" x2="115" y2="70" stroke="#ff7a00" strokeWidth="4" strokeLinecap="round" />
                  <line x1="70" y1="95" x2="115" y2="95" stroke="#ff7a00" strokeWidth="4" strokeLinecap="round" />
                  <line x1="70" y1="120" x2="115" y2="120" stroke="#ff7a00" strokeWidth="4" strokeLinecap="round" />
                </svg>
              </div>

              {/* Title */}
              <h2 style={styles.welcomeHeading}>Welcome</h2>

              {/* Login Form Fields */}
              <div style={styles.welcomeFormGroup}>
                <div style={styles.welcomeInputWrapper}>
                  <span style={styles.welcomeInputIcon}>👤</span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Username"
                    style={styles.welcomeInput}
                  />
                </div>

                <div style={styles.welcomeInputWrapper}>
                  <span style={styles.welcomeInputIcon}>🔒</span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    style={styles.welcomeInput}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={styles.eyeBtn}
                  >
                    👁️
                  </button>
                </div>

                <div style={{ textAlign: 'right', margin: '4px 0 12px 0' }}>
                  <a href="#forgot" style={styles.forgotPassLink}>
                    Forgot Password?
                  </a>
                </div>

                <button
                  onClick={() => setActiveScreen('dashboard')}
                  style={styles.welcomeSignInBtn}
                >
                  Sign In
                </button>
              </div>

              {/* Footer text */}
              <div style={styles.welcomeFooterText}>
                <span>Version 1.0.0</span>
                <span>Developed By</span>
                <strong>Logic Research Labs</strong>
              </div>
            </div>

            {/* Bottom System Navigation */}
            <div style={styles.androidSystemBar}>
              <span>■</span>
              <span>●</span>
              <span>◀</span>
            </div>
          </div>

          {/* Phone 3: Status Donut Chart & Task Dashboard (Right Phone in screenshot) */}
          <div style={styles.phoneMockup}>
            <div style={styles.phoneHeaderNotch}>
              <span style={styles.phoneTime}>19:02</span>
              <div style={styles.phoneSensors}>
                <span style={styles.sensorDot} />
                <span style={styles.speakerBar} />
              </div>
            </div>

            <div style={styles.phoneScreenContent}>
              {/* Header profile row */}
              <div style={styles.phoneUserProfileRow}>
                <div style={styles.phoneUserAvatarBox}>
                  <img
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                    alt="Suriya Avatar"
                    style={styles.phoneAvatarImg}
                  />
                  <div>
                    <h5 style={styles.phoneUserName}>Suriya</h5>
                    <span style={styles.phoneUserRole}>Admin</span>
                  </div>
                </div>
                <div style={styles.phoneBellBox}>
                  <span style={{ fontSize: '1.2rem' }}>🔔</span>
                  <span style={styles.bellBadge}>2</span>
                </div>
              </div>

              {/* Interactive Donut Chart Segment */}
              <div style={styles.donutChartCard}>
                <div style={styles.donutSvgWrapper}>
                  <svg width="140" height="140" viewBox="0 0 160 160">
                    {/* Background Ring */}
                    <circle cx="80" cy="80" r="55" fill="none" stroke="#f1f5f9" strokeWidth="22" />

                    {/* Donut Segments */}
                    {/* Completed - 18% (Green) */}
                    <circle
                      cx="80"
                      cy="80"
                      r="55"
                      fill="none"
                      stroke="#4ade80"
                      strokeWidth="22"
                      strokeDasharray="62 284"
                      strokeDashoffset="0"
                    />
                    {/* Open - 11% (Light Blue) */}
                    <circle
                      cx="80"
                      cy="80"
                      r="55"
                      fill="none"
                      stroke="#60a5fa"
                      strokeWidth="22"
                      strokeDasharray="38 308"
                      strokeDashoffset="-64"
                    />
                    {/* Accepted - 25% (Cyan/Purple) */}
                    <circle
                      cx="80"
                      cy="80"
                      r="55"
                      fill="none"
                      stroke="#c084fc"
                      strokeWidth="22"
                      strokeDasharray="86 260"
                      strokeDashoffset="-104"
                    />
                    {/* Inprogress - 15% (Pink) */}
                    <circle
                      cx="80"
                      cy="80"
                      r="55"
                      fill="none"
                      stroke="#f472b6"
                      strokeWidth="22"
                      strokeDasharray="52 294"
                      strokeDashoffset="-192"
                    />
                    {/* Overdue - 20% (Orange) */}
                    <circle
                      cx="80"
                      cy="80"
                      r="55"
                      fill="none"
                      stroke="#fb923c"
                      strokeWidth="22"
                      strokeDasharray="68 278"
                      strokeDashoffset="-246"
                    />
                    {/* Due Soon - 11% (Yellow) */}
                    <circle
                      cx="80"
                      cy="80"
                      r="55"
                      fill="none"
                      stroke="#facc15"
                      strokeWidth="22"
                      strokeDasharray="38 308"
                      strokeDashoffset="-316"
                    />

                    {/* Center cutout */}
                    <circle cx="80" cy="80" r="42" fill="#ffffff" />
                  </svg>

                  {/* SVG Labels matching exact image layout */}
                  <span style={{ position: 'absolute', top: '15px', right: '45px', fontSize: '0.65rem', color: '#475569' }}>
                    Completed 18%
                  </span>
                  <span style={{ position: 'absolute', top: '50px', right: '10px', fontSize: '0.65rem', color: '#475569' }}>
                    Open 11%
                  </span>
                  <span style={{ position: 'absolute', bottom: '35px', right: '15px', fontSize: '0.65rem', color: '#475569' }}>
                    Accepted 25%
                  </span>
                  <span style={{ position: 'absolute', bottom: '15px', left: '45px', fontSize: '0.65rem', color: '#475569' }}>
                    Inprogress 15%
                  </span>
                  <span style={{ position: 'absolute', bottom: '45px', left: '10px', fontSize: '0.65rem', color: '#475569' }}>
                    Overdue 20%
                  </span>
                </div>
              </div>

              {/* Status Filter Scroll Pill Bar */}
              <div style={styles.phoneFilterBarHorizontal}>
                {[
                  { name: 'Overdue', count: overdueCount || 2, active: selectedFilter === 'Overdue' },
                  { name: 'Due Soon', count: dueSoonCount || 7, active: selectedFilter === 'Due Soon' },
                  { name: 'Open', count: openCount || 5, active: selectedFilter === 'Open' },
                  { name: 'Accepted', count: null, active: selectedFilter === 'Accepted' },
                  { name: 'Inprogress', count: inprogressCount, active: selectedFilter === 'Inprogress' },
                  { name: 'All', count: tasks.length, active: selectedFilter === 'All' },
                ].map((item) => (
                  <button
                    key={item.name}
                    onClick={() => setSelectedFilter(item.name)}
                    style={{
                      ...styles.phoneFilterPill,
                      backgroundColor: item.active ? '#ff7a00' : '#ffffff',
                      color: item.active ? '#ffffff' : '#64748b',
                      border: item.active ? 'none' : '1px solid #e2e8f0',
                    }}
                  >
                    <span>{item.name}</span>
                    {item.count !== null && (
                      <span
                        style={{
                          ...styles.filterPillBadge,
                          backgroundColor: item.active ? 'rgba(255,255,255,0.3)' : '#f1f5f9',
                          color: item.active ? '#ffffff' : '#475569',
                        }}
                      >
                        {item.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Task Items List */}
              <div style={styles.phoneTaskListContainer}>
                {filteredTasks.map((task) => (
                  <div key={task.id} style={styles.phoneFullTaskCard}>
                    <div style={styles.phoneTaskTopRow}>
                      <span
                        style={{
                          ...styles.phonePriorityTag,
                          backgroundColor: task.priorityColor,
                          color: task.priorityTextColor,
                        }}
                      >
                        {task.priority}
                      </span>
                      <span style={styles.phoneTaskStatusRight}>Status - {task.status}</span>
                    </div>
                    <h5 style={styles.phoneFullTaskTitle}>{task.title}</h5>
                    <div style={styles.phoneTaskMetaRow}>
                      <span style={styles.phoneOverdueBadge}>{task.overdueText}</span>
                      <span style={styles.phoneExpirationBadge}>{task.expirationDate}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Nav Bar */}
            <div style={styles.phoneBottomNav}>
              <span style={styles.phoneNavIconActive}>🏠</span>
              <span style={styles.phoneNavIcon}>📋</span>
              <button
                onClick={() => setIsAddModalOpen(true)}
                style={styles.phoneNavAddBtn}
              >
                +
              </button>
              <span style={styles.phoneNavIcon}>👥</span>
              <span style={styles.phoneNavIcon}>⚙️</span>
            </div>
          </div>
        </div>
      ) : (
        /* 2. RESPONSIVE FULL DASHBOARD INTERFACE MODE */
        <div style={styles.responsiveAppContainer}>
          {/* Header */}
          <div style={styles.responsiveHeader}>
            <div style={styles.userProfileSection}>
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80"
                alt="Suriya Admin Avatar"
                style={styles.largeAvatarImg}
              />
              <div>
                <h3 style={styles.userNameText}>Suriya</h3>
                <span style={styles.userRoleBadge}>Admin User</span>
              </div>
            </div>

            <div style={styles.headerRightActions}>
              <div style={styles.searchBoxDesktop}>
                <span>🔍</span>
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={styles.desktopSearchInput}
                />
              </div>

              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  style={styles.notificationBellBtn}
                >
                  🔔
                  <span style={styles.bellBadgeDesktop}>2</span>
                </button>

                <AnimatePresence>
                  {notificationsOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      style={styles.notificationDropdown}
                    >
                      <h4 style={styles.notifHeaderTitle}>Notifications (2)</h4>
                      <div style={styles.notifItem}>
                        <span style={{ color: '#ff7a00', fontWeight: 'bold' }}>⚠️ Task Overdue</span>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
                          "Design the Assigned Task Page" is 2 days overdue.
                        </p>
                      </div>
                      <div style={styles.notifItem}>
                        <span style={{ color: '#0284c7', fontWeight: 'bold' }}>📌 Task Assigned</span>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
                          Sahithya assigned a new UI/UX task to you.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button
                onClick={() => setIsAddModalOpen(true)}
                style={styles.primaryAddBtn}
              >
                + New Task
              </button>
            </div>
          </div>

          {/* Donut Chart & Stats Banner */}
          <div style={styles.desktopGridSection}>
            {/* Chart Card */}
            <div style={styles.desktopChartCard}>
              <div>
                <h4 style={styles.cardSectionTitle}>Task Status Breakdown</h4>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
                  Live visual distribution of assigned tasks
                </p>

                <div style={styles.chartLegendGrid}>
                  <div style={styles.legendItem}><span style={{ ...styles.legendDot, backgroundColor: '#4ade80' }} /> Completed (18%)</div>
                  <div style={styles.legendItem}><span style={{ ...styles.legendDot, backgroundColor: '#60a5fa' }} /> Open (11%)</div>
                  <div style={styles.legendItem}><span style={{ ...styles.legendDot, backgroundColor: '#c084fc' }} /> Accepted (25%)</div>
                  <div style={styles.legendItem}><span style={{ ...styles.legendDot, backgroundColor: '#f472b6' }} /> Inprogress (15%)</div>
                  <div style={styles.legendItem}><span style={{ ...styles.legendDot, backgroundColor: '#fb923c' }} /> Overdue (20%)</div>
                  <div style={styles.legendItem}><span style={{ ...styles.legendDot, backgroundColor: '#facc15' }} /> Due Soon (11%)</div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <svg width="180" height="180" viewBox="0 0 160 160">
                  <circle cx="80" cy="80" r="55" fill="none" stroke="#f1f5f9" strokeWidth="22" />
                  <circle cx="80" cy="80" r="55" fill="none" stroke="#4ade80" strokeWidth="22" strokeDasharray="62 284" strokeDashoffset="0" />
                  <circle cx="80" cy="80" r="55" fill="none" stroke="#60a5fa" strokeWidth="22" strokeDasharray="38 308" strokeDashoffset="-64" />
                  <circle cx="80" cy="80" r="55" fill="none" stroke="#c084fc" strokeWidth="22" strokeDasharray="86 260" strokeDashoffset="-104" />
                  <circle cx="80" cy="80" r="55" fill="none" stroke="#f472b6" strokeWidth="22" strokeDasharray="52 294" strokeDashoffset="-192" />
                  <circle cx="80" cy="80" r="55" fill="none" stroke="#fb923c" strokeWidth="22" strokeDasharray="68 278" strokeDashoffset="-246" />
                  <circle cx="80" cy="80" r="55" fill="none" stroke="#facc15" strokeWidth="22" strokeDasharray="38 308" strokeDashoffset="-316" />
                  <circle cx="80" cy="80" r="42" fill="#ffffff" />
                  <text x="80" y="75" textAnchor="middle" fontSize="16" fontWeight="900" fill="#1e293b">
                    {tasks.length}
                  </text>
                  <text x="80" y="93" textAnchor="middle" fontSize="10" fontWeight="700" fill="#94a3b8">
                    TOTAL TASKS
                  </text>
                </svg>
              </div>
            </div>

            {/* Quick Metrics Cards */}
            <div style={styles.metricsCol}>
              <div style={styles.metricCardUrgent}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '1.8rem', fontWeight: '900', color: '#dc2626' }}>{urgentCount}</span>
                  <span style={styles.metricBadgeUrgent}>Urgent</span>
                </div>
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', color: '#991b1b', fontWeight: '600' }}>
                  Tasks requiring immediate action
                </p>
              </div>

              <div style={styles.metricCardImportant}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '1.8rem', fontWeight: '900', color: '#d97706' }}>{importantCount || 4}</span>
                  <span style={styles.metricBadgeImportant}>Important</span>
                </div>
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', color: '#92400e', fontWeight: '600' }}>
                  High priority project deliverables
                </p>
              </div>
            </div>
          </div>

          {/* Filter Pills Bar */}
          <div style={styles.filterPillsRowDesktop}>
            {[
              { name: 'Overdue', count: overdueCount || 2 },
              { name: 'Due Soon', count: dueSoonCount || 7 },
              { name: 'Open', count: openCount || 5 },
              { name: 'Accepted', count: null },
              { name: 'Inprogress', count: inprogressCount },
              { name: 'Completed', count: tasks.filter(t => t.status === 'Completed').length },
              { name: 'All', count: tasks.length },
            ].map((item) => (
              <button
                key={item.name}
                onClick={() => setSelectedFilter(item.name)}
                style={{
                  ...styles.desktopFilterBtn,
                  backgroundColor: selectedFilter === item.name ? '#ff7a00' : '#ffffff',
                  color: selectedFilter === item.name ? '#ffffff' : '#475569',
                  border: selectedFilter === item.name ? 'none' : '1px solid #cbd5e1',
                }}
              >
                <span>{item.name}</span>
                {item.count !== null && (
                  <span
                    style={{
                      ...styles.desktopBadgeNumber,
                      backgroundColor: selectedFilter === item.name ? 'rgba(255,255,255,0.3)' : '#f1f5f9',
                      color: selectedFilter === item.name ? '#ffffff' : '#475569',
                    }}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Task Grid */}
          <div style={styles.tasksCardGrid}>
            {filteredTasks.map((task) => (
              <div key={task.id} style={styles.desktopTaskCard}>
                <div style={styles.desktopTaskCardHeader}>
                  <span
                    style={{
                      ...styles.desktopPriorityPill,
                      backgroundColor: task.priorityColor,
                      color: task.priorityTextColor,
                    }}
                  >
                    {task.priority}
                  </span>
                  <span style={styles.desktopStatusText}>Status - {task.status}</span>
                </div>

                <h4 style={styles.desktopTaskTitle}>{task.title}</h4>

                <div style={styles.desktopMetaFooter}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={styles.desktopOverdueTag}>{task.overdueText}</span>
                    <span style={styles.desktopExpTag}>{task.expirationDate}</span>
                  </div>

                  <button
                    onClick={() => handleToggleTaskStatus(task.id)}
                    style={{
                      ...styles.actionToggleBtn,
                      backgroundColor: task.status === 'Completed' ? '#d1fae5' : '#fff7ed',
                      color: task.status === 'Completed' ? '#047857' : '#c2410c',
                    }}
                  >
                    {task.status === 'Completed' ? '✓ Done' : 'Mark Complete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CREATE NEW TASK MODAL */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div style={styles.modalOverlay}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              style={styles.modalContentCard}
            >
              <div style={styles.modalHeaderRow}>
                <h3 style={{ margin: 0, fontWeight: '900', color: '#1e293b' }}>Create New Assigned Task</h3>
                <button onClick={() => setIsAddModalOpen(false)} style={styles.modalCloseBtn}>
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddTask} style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={styles.modalLabel}>Task Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Design the Assigned Task Page"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    style={styles.modalInput}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={styles.modalLabel}>Priority Tag</label>
                    <select
                      value={newTaskPriority}
                      onChange={(e) => setNewTaskPriority(e.target.value)}
                      style={styles.modalSelect}
                    >
                      <option value="Important">Important</option>
                      <option value="Urgent">Urgent</option>
                      <option value="Information">Information</option>
                    </select>
                  </div>

                  <div>
                    <label style={styles.modalLabel}>Initial Status</label>
                    <select
                      value={newTaskStatus}
                      onChange={(e) => setNewTaskStatus(e.target.value)}
                      style={styles.modalSelect}
                    >
                      <option value="Inprogress">Inprogress</option>
                      <option value="Overdue">Overdue</option>
                      <option value="Due Soon">Due Soon</option>
                      <option value="Open">Open</option>
                      <option value="Accepted">Accepted</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={styles.modalLabel}>Assigned Member</label>
                  <input
                    type="text"
                    value={newTaskAssignee}
                    onChange={(e) => setNewTaskAssignee(e.target.value)}
                    style={styles.modalInput}
                  />
                </div>

                <div>
                  <label style={styles.modalLabel}>Expiration Date</label>
                  <input
                    type="text"
                    value={newTaskDueDate}
                    onChange={(e) => setNewTaskDueDate(e.target.value)}
                    style={styles.modalInput}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '1rem' }}>
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    style={styles.modalCancelBtn}
                  >
                    Cancel
                  </button>
                  <button type="submit" style={styles.modalSaveBtn}>
                    Save Assigned Task
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

const styles = {
  outerWrapper: {
    minHeight: '100vh',
    backgroundColor: '#f8fafc',
    padding: '1.5rem',
    fontFamily: "'Outfit', 'Inter', system-ui, sans-serif",
    color: '#1e293b',
  },
  topControlBanner: {
    backgroundColor: '#ffffff',
    borderRadius: '20px',
    padding: '1rem 1.5rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
    boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
    border: '1px solid #e2e8f0',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  brandTitleGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  logoPill: {
    width: '42px',
    height: '42px',
    borderRadius: '12px',
    backgroundColor: '#fff7ed',
    border: '2px solid #ff7a00',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: {
    margin: 0,
    fontSize: '1.25rem',
    fontWeight: '900',
    color: '#1e293b',
  },
  brandSubtext: {
    fontSize: '0.8rem',
    color: '#64748b',
  },
  viewModeToggleRow: {
    display: 'flex',
    gap: '0.5rem',
  },
  toggleBtn: {
    padding: '0.5rem 1rem',
    borderRadius: '12px',
    fontWeight: '700',
    fontSize: '0.85rem',
    cursor: 'pointer',
    border: '1px solid #e2e8f0',
    transition: 'all 0.2s ease',
  },
  simulatorContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: '2rem',
    flexWrap: 'wrap',
    padding: '1rem 0',
  },
  phoneMockup: {
    width: '320px',
    height: '640px',
    backgroundColor: '#ffffff',
    borderRadius: '40px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    border: '8px solid #1e293b',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    position: 'relative',
  },
  phoneHeaderNotch: {
    height: '36px',
    backgroundColor: '#ffffff',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 1rem',
    borderBottom: '1px solid #f1f5f9',
  },
  phoneTime: {
    fontSize: '0.75rem',
    fontWeight: '800',
    color: '#1e293b',
  },
  phoneSensors: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  sensorDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: '#000',
  },
  speakerBar: {
    width: '30px',
    height: '4px',
    borderRadius: '2px',
    backgroundColor: '#000',
  },
  phoneScreenContent: {
    flex: 1,
    padding: '0.85rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    overflowY: 'auto',
    backgroundColor: '#ffffff',
  },
  phoneTopTitleBar: {
    padding: '0.25rem 0',
  },
  phoneAppTitle: {
    margin: 0,
    fontSize: '1rem',
    fontWeight: '900',
    color: '#1e293b',
  },
  phoneSearchBox: {
    backgroundColor: '#f8fafc',
    borderRadius: '10px',
    padding: '0.4rem 0.75rem',
    display: 'flex',
    alignItems: 'center',
    border: '1px solid #e2e8f0',
  },
  phoneSearchInput: {
    border: 'none',
    outline: 'none',
    backgroundColor: 'transparent',
    fontSize: '0.8rem',
    width: '100%',
  },
  phoneCounterGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '0.5rem',
  },
  phoneCounterCardUrgent: {
    backgroundColor: '#fee2e2',
    borderRadius: '12px',
    padding: '0.65rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    border: '1px solid #fca5a5',
  },
  phoneCounterCardImportant: {
    backgroundColor: '#fef08a',
    borderRadius: '12px',
    padding: '0.65rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    border: '1px solid #fde047',
  },
  counterCardNumber: {
    fontSize: '1.25rem',
    fontWeight: '900',
    color: '#1e293b',
  },
  counterCardLabel: {
    fontSize: '0.7rem',
    fontWeight: '700',
    color: '#475569',
  },
  phoneMiniTaskList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  phoneTaskCard: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '0.65rem',
    border: '1px solid #e2e8f0',
    boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
  },
  phoneTaskCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '4px',
  },
  phonePriorityBadge: {
    fontSize: '0.6rem',
    fontWeight: '800',
    padding: '2px 6px',
    borderRadius: '6px',
  },
  phoneStatusText: {
    fontSize: '0.6rem',
    fontWeight: '700',
    color: '#64748b',
  },
  phoneTaskTitle: {
    margin: '4px 0',
    fontSize: '0.78rem',
    fontWeight: '800',
    color: '#1e293b',
  },
  phoneTaskSubRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.65rem',
    color: '#94a3b8',
  },
  phoneOverdueText: {
    color: '#ef4444',
    fontWeight: '700',
  },
  phoneAssigneeText: {
    color: '#64748b',
  },
  welcomeGraphicWrapper: {
    display: 'flex',
    justifyContent: 'center',
    paddingTop: '0.5rem',
  },
  welcomeHeading: {
    margin: '0.25rem 0',
    fontSize: '1.5rem',
    fontWeight: '900',
    textAlign: 'center',
    color: '#431407',
  },
  welcomeFormGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.65rem',
  },
  welcomeInputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  welcomeInputIcon: {
    position: 'absolute',
    left: '10px',
    fontSize: '0.85rem',
  },
  welcomeInput: {
    width: '100%',
    padding: '0.55rem 0.75rem 0.55rem 2.2rem',
    borderRadius: '10px',
    border: '1px solid #d1d5db',
    fontSize: '0.8rem',
    outline: 'none',
    fontWeight: '600',
  },
  eyeBtn: {
    position: 'absolute',
    right: '10px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.8rem',
  },
  forgotPassLink: {
    fontSize: '0.7rem',
    color: '#94a3b8',
    textDecoration: 'none',
  },
  welcomeSignInBtn: {
    backgroundColor: '#ff7a00',
    color: '#ffffff',
    border: 'none',
    padding: '0.65rem',
    borderRadius: '12px',
    fontWeight: '900',
    fontSize: '0.85rem',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(255, 122, 0, 0.3)',
  },
  welcomeFooterText: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    fontSize: '0.65rem',
    color: '#94a3b8',
    gap: '1px',
  },
  androidSystemBar: {
    height: '24px',
    backgroundColor: '#fafafa',
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
    fontSize: '0.65rem',
    color: '#94a3b8',
    borderTop: '1px solid #f1f5f9',
  },
  phoneUserProfileRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  phoneUserAvatarBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  phoneAvatarImg: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    objectFit: 'cover',
  },
  phoneUserName: {
    margin: 0,
    fontSize: '0.85rem',
    fontWeight: '800',
  },
  phoneUserRole: {
    fontSize: '0.65rem',
    color: '#94a3b8',
  },
  phoneBellBox: {
    position: 'relative',
    cursor: 'pointer',
  },
  bellBadge: {
    position: 'absolute',
    top: '-4px',
    right: '-4px',
    backgroundColor: '#ef4444',
    color: '#fff',
    fontSize: '0.55rem',
    fontWeight: 'bold',
    width: '14px',
    height: '14px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutChartCard: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '0.5rem',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  donutSvgWrapper: {
    position: 'relative',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  phoneFilterBarHorizontal: {
    display: 'flex',
    gap: '6px',
    overflowX: 'auto',
    paddingBottom: '4px',
  },
  phoneFilterPill: {
    padding: '4px 8px',
    borderRadius: '12px',
    fontSize: '0.65rem',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    whiteSpace: 'nowrap',
    cursor: 'pointer',
  },
  filterPillBadge: {
    padding: '1px 5px',
    borderRadius: '8px',
    fontSize: '0.6rem',
    fontWeight: '800',
  },
  phoneTaskListContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  phoneFullTaskCard: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '0.65rem',
    border: '1px solid #e2e8f0',
    boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
  },
  phoneTaskTopRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '4px',
  },
  phonePriorityTag: {
    fontSize: '0.6rem',
    fontWeight: '800',
    padding: '2px 8px',
    borderRadius: '6px',
  },
  phoneTaskStatusRight: {
    fontSize: '0.6rem',
    fontWeight: '700',
    color: '#64748b',
  },
  phoneFullTaskTitle: {
    margin: '4px 0 8px 0',
    fontSize: '0.8rem',
    fontWeight: '800',
    color: '#1e293b',
  },
  phoneTaskMetaRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.6rem',
  },
  phoneOverdueBadge: {
    color: '#ef4444',
    fontWeight: '700',
  },
  phoneExpirationBadge: {
    color: '#94a3b8',
  },
  phoneBottomNav: {
    height: '46px',
    backgroundColor: '#ffffff',
    borderTop: '1px solid #f1f5f9',
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: '0 0.5rem',
  },
  phoneNavIconActive: {
    backgroundColor: '#fff7ed',
    padding: '6px 12px',
    borderRadius: '12px',
    fontSize: '0.9rem',
  },
  phoneNavIcon: {
    fontSize: '0.9rem',
    opacity: 0.6,
  },
  phoneNavAddBtn: {
    backgroundColor: '#ff7a00',
    color: '#ffffff',
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    border: 'none',
    fontSize: '1.2rem',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: '0 4px 10px rgba(255, 122, 0, 0.4)',
  },
  responsiveAppContainer: {
    backgroundColor: '#ffffff',
    borderRadius: '24px',
    padding: '2rem',
    boxShadow: '0 10px 30px rgba(0,0,0,0.04)',
    border: '1px solid #e2e8f0',
  },
  responsiveHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  userProfileSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  largeAvatarImg: {
    width: '52px',
    height: '52px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '2px solid #ff7a00',
  },
  userNameText: {
    margin: 0,
    fontSize: '1.4rem',
    fontWeight: '900',
  },
  userRoleBadge: {
    fontSize: '0.8rem',
    color: '#64748b',
    fontWeight: '600',
  },
  headerRightActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  searchBoxDesktop: {
    backgroundColor: '#f8fafc',
    borderRadius: '14px',
    padding: '0.6rem 1rem',
    display: 'flex',
    alignItems: 'center',
    border: '1px solid #cbd5e1',
    width: '240px',
  },
  desktopSearchInput: {
    border: 'none',
    outline: 'none',
    backgroundColor: 'transparent',
    fontSize: '0.88rem',
    marginLeft: '6px',
    width: '100%',
  },
  notificationBellBtn: {
    backgroundColor: '#f8fafc',
    border: '1px solid #cbd5e1',
    borderRadius: '14px',
    width: '42px',
    height: '42px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    position: 'relative',
    fontSize: '1.1rem',
  },
  bellBadgeDesktop: {
    position: 'absolute',
    top: '-4px',
    right: '-4px',
    backgroundColor: '#ef4444',
    color: '#fff',
    fontSize: '0.65rem',
    fontWeight: 'bold',
    width: '18px',
    height: '18px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationDropdown: {
    position: 'absolute',
    top: '50px',
    right: 0,
    width: '280px',
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
    border: '1px solid #e2e8f0',
    padding: '1rem',
    zIndex: 100,
  },
  notifHeaderTitle: {
    margin: '0 0 0.5rem 0',
    fontSize: '0.9rem',
    fontWeight: '800',
  },
  notifItem: {
    padding: '0.5rem 0',
    borderBottom: '1px solid #f1f5f9',
  },
  primaryAddBtn: {
    backgroundColor: '#ff7a00',
    color: '#ffffff',
    border: 'none',
    padding: '0.75rem 1.25rem',
    borderRadius: '14px',
    fontWeight: '800',
    fontSize: '0.9rem',
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(255, 122, 0, 0.35)',
  },
  desktopGridSection: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr',
    gap: '1.5rem',
    marginBottom: '2rem',
  },
  desktopChartCard: {
    backgroundColor: '#f8fafc',
    borderRadius: '20px',
    padding: '1.5rem',
    border: '1px solid #e2e8f0',
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem',
    alignItems: 'center',
  },
  cardSectionTitle: {
    margin: '0 0 0.25rem 0',
    fontSize: '1.1rem',
    fontWeight: '900',
  },
  chartLegendGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '0.5rem',
    marginTop: '1rem',
  },
  legendItem: {
    fontSize: '0.75rem',
    color: '#475569',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  legendDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
  },
  metricsCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  metricCardUrgent: {
    backgroundColor: '#fee2e2',
    borderRadius: '20px',
    padding: '1.25rem',
    border: '1px solid #fca5a5',
  },
  metricBadgeUrgent: {
    backgroundColor: '#dc2626',
    color: '#fff',
    fontSize: '0.75rem',
    fontWeight: '800',
    padding: '3px 10px',
    borderRadius: '8px',
  },
  metricCardImportant: {
    backgroundColor: '#fef08a',
    borderRadius: '20px',
    padding: '1.25rem',
    border: '1px solid #fde047',
  },
  metricBadgeImportant: {
    backgroundColor: '#d97706',
    color: '#fff',
    fontSize: '0.75rem',
    fontWeight: '800',
    padding: '3px 10px',
    borderRadius: '8px',
  },
  filterPillsRowDesktop: {
    display: 'flex',
    gap: '0.75rem',
    overflowX: 'auto',
    marginBottom: '1.5rem',
    paddingBottom: '0.5rem',
  },
  desktopFilterBtn: {
    padding: '0.6rem 1.2rem',
    borderRadius: '16px',
    fontSize: '0.85rem',
    fontWeight: '800',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  desktopBadgeNumber: {
    padding: '2px 8px',
    borderRadius: '10px',
    fontSize: '0.75rem',
    fontWeight: '800',
  },
  tasksCardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '1.25rem',
  },
  desktopTaskCard: {
    backgroundColor: '#ffffff',
    borderRadius: '18px',
    padding: '1.25rem',
    border: '1px solid #e2e8f0',
    boxShadow: '0 4px 15px rgba(0,0,0,0.02)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  desktopTaskCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.75rem',
  },
  desktopPriorityPill: {
    fontSize: '0.75rem',
    fontWeight: '800',
    padding: '4px 10px',
    borderRadius: '8px',
  },
  desktopStatusText: {
    fontSize: '0.75rem',
    fontWeight: '700',
    color: '#64748b',
  },
  desktopTaskTitle: {
    margin: '0 0 1rem 0',
    fontSize: '1rem',
    fontWeight: '900',
    color: '#1e293b',
  },
  desktopMetaFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '0.75rem',
    borderTop: '1px solid #f1f5f9',
  },
  desktopOverdueTag: {
    fontSize: '0.75rem',
    color: '#ef4444',
    fontWeight: '800',
  },
  desktopExpTag: {
    fontSize: '0.75rem',
    color: '#94a3b8',
  },
  actionToggleBtn: {
    border: 'none',
    padding: '0.4rem 0.85rem',
    borderRadius: '10px',
    fontSize: '0.75rem',
    fontWeight: '800',
    cursor: 'pointer',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    padding: '1rem',
  },
  modalContentCard: {
    backgroundColor: '#ffffff',
    borderRadius: '24px',
    padding: '1.75rem',
    width: '100%',
    maxWidth: '480px',
    boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
  },
  modalHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalCloseBtn: {
    background: 'none',
    border: 'none',
    fontSize: '1.2rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    color: '#94a3b8',
  },
  modalLabel: {
    fontSize: '0.8rem',
    fontWeight: '800',
    color: '#475569',
    marginBottom: '4px',
    display: 'block',
  },
  modalInput: {
    width: '100%',
    padding: '0.65rem 0.85rem',
    borderRadius: '12px',
    border: '1px solid #cbd5e1',
    fontSize: '0.88rem',
    outline: 'none',
    boxSizing: 'border-box',
  },
  modalSelect: {
    width: '100%',
    padding: '0.65rem 0.85rem',
    borderRadius: '12px',
    border: '1px solid #cbd5e1',
    fontSize: '0.88rem',
    outline: 'none',
    backgroundColor: '#fff',
    boxSizing: 'border-box',
  },
  modalCancelBtn: {
    backgroundColor: '#f1f5f9',
    color: '#475569',
    border: 'none',
    padding: '0.65rem 1.25rem',
    borderRadius: '12px',
    fontWeight: '800',
    cursor: 'pointer',
  },
  modalSaveBtn: {
    backgroundColor: '#ff7a00',
    color: '#ffffff',
    border: 'none',
    padding: '0.65rem 1.25rem',
    borderRadius: '12px',
    fontWeight: '800',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(255, 122, 0, 0.3)',
  },
};
