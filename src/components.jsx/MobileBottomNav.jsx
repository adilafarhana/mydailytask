import React, { useState } from 'react';

export default function MobileBottomNav({ onOpenAddModal }) {
  const [activeTab, setActiveTab] = useState('home');

  return (
    <div style={styles.bottomBarContainer}>
      {/* 🏠 Home */}
      <button
        onClick={() => setActiveTab('home')}
        style={{
          ...styles.navItem,
          backgroundColor: activeTab === 'home' ? '#ffedd5' : 'transparent',
          borderRadius: activeTab === 'home' ? '12px' : '0px',
        }}
      >
        <span style={{ fontSize: '1.25rem' }}>🏠</span>
      </button>

      {/* 📋 Tasks */}
      <button
        onClick={() => setActiveTab('tasks')}
        style={{
          ...styles.navItem,
          backgroundColor: activeTab === 'tasks' ? '#ffedd5' : 'transparent',
          borderRadius: activeTab === 'tasks' ? '12px' : '0px',
        }}
      >
        <span style={{ fontSize: '1.25rem' }}>📋</span>
      </button>

      {/* ➕ Add (+) Center Action Button */}
      <button
        onClick={onOpenAddModal}
        style={styles.centerAddBtn}
        title="Add New Task / Activity"
      >
        <span style={{ fontSize: '1.4rem', fontWeight: '900', color: '#ffffff' }}>+</span>
      </button>

      {/* 👥 Team */}
      <button
        onClick={() => setActiveTab('team')}
        style={{
          ...styles.navItem,
          backgroundColor: activeTab === 'team' ? '#ffedd5' : 'transparent',
          borderRadius: activeTab === 'team' ? '12px' : '0px',
        }}
      >
        <span style={{ fontSize: '1.25rem' }}>👥</span>
      </button>

      {/* ⚙️ Settings */}
      <button
        onClick={() => setActiveTab('settings')}
        style={{
          ...styles.navItem,
          backgroundColor: activeTab === 'settings' ? '#ffedd5' : 'transparent',
          borderRadius: activeTab === 'settings' ? '12px' : '0px',
        }}
      >
        <span style={{ fontSize: '1.25rem' }}>⚙️</span>
      </button>
    </div>
  );
}

const styles = {
  bottomBarContainer: {
    position: 'sticky',
    bottom: '0',
    left: '0',
    right: '0',
    backgroundColor: '#ffffff',
    borderTop: '1.5px solid #ffedd5',
    padding: '0.4rem 1rem',
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
    boxShadow: '0 -4px 15px rgba(255, 122, 0, 0.08)',
    zIndex: 100,
  },
  navItem: {
    border: 'none',
    background: 'none',
    padding: '0.45rem 0.75rem',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    transition: 'all 0.2s ease',
  },
  centerAddBtn: {
    width: '42px',
    height: '42px',
    borderRadius: '50%',
    backgroundColor: '#ff7a00',
    border: 'none',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(255, 122, 0, 0.4)',
    transition: 'transform 0.15s ease',
  },
};
