import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import apiClient from '../utils/apiClient';

export default function UnifiedTaskManager({ selectedDateStr, onSelectDate }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  // Single Unified Form State
  const [inputTitle, setInputTitle] = useState('');
  const [selectedType, setSelectedType] = useState('daily_task'); // 'daily_task', 'new_skill', 'cv_skill'
  const [selectedCategory, setSelectedCategory] = useState('Backend');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Current Target Date
  const targetDate = selectedDateStr || new Date().toISOString().split('T')[0];

  // Save to state and localStorage backup
  const updateAndSaveItems = (newItems) => {
    setItems(newItems);
    try {
      localStorage.setItem(`unified_tasks_${targetDate}`, JSON.stringify(newItems));
    } catch (e) {}
  };

  // Fetch all items for the selected targetDate from the single unified table
  const fetchUnifiedItems = useCallback(async () => {
    setLoading(true);

    // Check local storage backup
    let localItems = [];
    try {
      const stored = localStorage.getItem(`unified_tasks_${targetDate}`);
      if (stored) localItems = JSON.parse(stored);
    } catch (e) {}

    try {
      let res = await apiClient.get(`/unified-daily-items?target_date=${targetDate}`);
      const data = res.data;
      if (data.status === 'success' && Array.isArray(data.data) && data.data.length > 0) {
        // Merge backend data with local data
        const combined = [...data.data];
        localItems.forEach((loc) => {
          if (!combined.some((item) => String(item.id) === String(loc.id))) {
            combined.push(loc);
          }
        });
        setItems(combined);
      } else if (localItems.length > 0) {
        setItems(localItems);
      } else {
        setItems([]);
      }
    } catch (err) {
      console.warn('Failed to fetch unified items:', err);
      if (localItems.length > 0) {
        setItems(localItems);
      } else {
        setItems([
          {
            id: 'demo-1',
            item_type: 'daily_task',
            title: 'new project',
            category: 'Backend',
            target_date: targetDate,
            status: 'Completed',
            is_completed: true,
          },
          {
            id: 'demo-2',
            item_type: 'new_skill',
            title: 'DevOps & Containerization',
            category: 'DevOps',
            target_date: targetDate,
            status: 'Pending',
            is_completed: false,
          },
        ]);
      }
    } finally {
      setLoading(false);
    }
  }, [targetDate]);

  useEffect(() => {
    fetchUnifiedItems();
  }, [fetchUnifiedItems]);

  // Handle Adding New Item (Auto sets status = Pending)
  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!inputTitle.trim()) return;

    setIsSubmitting(true);
    const payload = {
      title: inputTitle.trim(),
      item_type: selectedType,
      category: selectedCategory,
      target_date: targetDate,
      status: 'Pending', // Automatically set to Pending as requested!
      hours_spent: 2.0,
    };

    const tempId = Date.now();
    const localNewItem = {
      id: tempId,
      ...payload,
      is_completed: false,
    };

    // Optimistically add item to state and localStorage immediately!
    const updatedList = [localNewItem, ...items];
    updateAndSaveItems(updatedList);
    setInputTitle('');

    try {
      const res = await apiClient.post('/unified-daily-items', payload);
      const data = res.data;
      if (data.status === 'success' && data.data) {
        const finalItems = updatedList.map((item) => (item.id === tempId ? data.data : item));
        updateAndSaveItems(finalItems);
      }
    } catch (err) {
      console.warn('Backend save notice, retained local persistent item.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Instant Toggle Status on Click (Pending <-> Completed)
  const handleToggleStatus = async (itemId) => {
    const updated = items.map((item) => {
      if (item.id === itemId) {
        const newStatus = item.status === 'Completed' || item.is_completed ? 'Pending' : 'Completed';
        return {
          ...item,
          status: newStatus,
          is_completed: newStatus === 'Completed',
        };
      }
      return item;
    });

    updateAndSaveItems(updated);

    if (typeof itemId === 'string' && (itemId.startsWith('demo-') || isNaN(Number(itemId)))) {
      return;
    }

    try {
      await apiClient.post(`/unified-daily-items/${itemId}/toggle`);
    } catch (err) {
      console.warn('API status toggle error, retained local optimistic change.');
    }
  };

  // Handle Delete
  const handleDeleteItem = async (itemId) => {
    const updated = items.filter((item) => item.id !== itemId);
    updateAndSaveItems(updated);

    if (typeof itemId === 'string' && (itemId.startsWith('demo-') || isNaN(Number(itemId)))) {
      return;
    }

    try {
      await apiClient.delete(`/unified-daily-items/${itemId}`);
    } catch (err) {
      console.warn('API delete error.');
    }
  };

  // Helper type badges
  const getTypeBadge = (type) => {
    switch (type) {
      case 'new_skill':
        return { label: '🚀 New Skill', bg: '#e0e7ff', color: '#4338ca' };
      case 'cv_skill':
        return { label: '📜 CV Skill', bg: '#fef3c7', color: '#b45309' };
      default:
        return { label: '📌 Daily Task', bg: '#ecfdf5', color: '#047857' };
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      style={styles.cardContainer}
    >
      {/* Header Row */}
      <div style={styles.headerRow}>
        <div>
          <span style={styles.sectionBadge}>⚡ UNIFIED TASK & SKILL MANAGER</span>
          <h3 style={styles.sectionTitle}>
            Daily Tasks & Skills for Date: <span style={styles.dateHighlight}>{targetDate}</span>
          </h3>
        </div>

        <div style={styles.statsSummaryPill}>
          Total: <strong>{items.length}</strong> | Completed: <strong>{items.filter((i) => i.status === 'Completed' || i.is_completed).length}</strong>
        </div>
      </div>

      {/* SINGLE UNIFIED INPUT FORM (As Requested: One field, auto sets Pending) */}
      <form onSubmit={handleAddItem} style={styles.singleInputFieldForm}>
        <div style={styles.inputGroupWrapper}>
          <input
            type="text"
            placeholder={`➕ Add a new task or skill for ${targetDate}...`}
            value={inputTitle}
            onChange={(e) => setInputTitle(e.target.value)}
            style={styles.singleInputField}
          />

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            style={styles.selectDropdown}
          >
            <option value="daily_task">📌 Daily Task</option>
            <option value="new_skill">🚀 New Skill</option>
            <option value="cv_skill">📜 CV Skill</option>
          </select>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={styles.selectDropdown}
          >
            <option value="Backend">Backend</option>
            <option value="Frontend">Frontend</option>
            <option value="Database">Database</option>
            <option value="DevOps">DevOps</option>
            <option value="Other">Other</option>
          </select>

          <button
            type="submit"
            disabled={isSubmitting || !inputTitle.trim()}
            style={{
              ...styles.addSubmitBtn,
              opacity: !inputTitle.trim() ? 0.6 : 1,
            }}
          >
            {isSubmitting ? 'Adding...' : '+ Add Item'}
          </button>
        </div>
        <span style={styles.autoPendingTip}>
          ℹ️ Items automatically set to <strong>Pending</strong>. Click any item's checkmark button to mark <strong>Completed</strong>!
        </span>
      </form>

      {/* SINGLE UNIFIED LIST DISPLAY */}
      {loading ? (
        <div style={styles.loadingState}>Loading items...</div>
      ) : items.length === 0 ? (
        <div style={styles.emptyStateBox}>
          <span>🎯 No tasks or skills set for {targetDate} yet. Add one above!</span>
        </div>
      ) : (
        <div style={styles.unifiedListGrid}>
          <AnimatePresence>
            {items.map((item) => {
              const isDone = item.status === 'Completed' || item.is_completed;
              const typeInfo = getTypeBadge(item.item_type);

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  style={{
                    ...styles.listItemCard,
                    backgroundColor: isDone ? '#f0fdf4' : '#ffffff',
                    borderColor: isDone ? '#bbf7d0' : '#e2e8f0',
                  }}
                >
                  {/* Clickable Status Toggle Checkmark */}
                  <button
                    onClick={() => handleToggleStatus(item.id)}
                    style={{
                      ...styles.statusCheckBtn,
                      backgroundColor: isDone ? '#10b981' : '#ffffff',
                      color: isDone ? '#ffffff' : '#cbd5e1',
                      borderColor: isDone ? '#10b981' : '#cbd5e1',
                    }}
                    title="Click to toggle status (Pending / Completed)"
                  >
                    {isDone ? '✓' : '⭕'}
                  </button>

                  {/* Title and Badges */}
                  <div style={styles.itemMainContent}>
                    <div style={styles.badgeRow}>
                      <span
                        style={{
                          ...styles.typeBadge,
                          backgroundColor: typeInfo.bg,
                          color: typeInfo.color,
                        }}
                      >
                        {typeInfo.label}
                      </span>
                      <span style={styles.categoryPill}>{item.category || 'Backend'}</span>
                    </div>

                    <h4
                      style={{
                        ...styles.itemTitleText,
                        textDecoration: isDone ? 'line-through' : 'none',
                        color: isDone ? '#166534' : '#0f172a',
                      }}
                    >
                      {item.title}
                    </h4>
                  </div>

                  {/* Status & Delete */}
                  <div style={styles.itemActionEndCol}>
                    <button
                      onClick={() => handleToggleStatus(item.id)}
                      style={{
                        ...styles.statusBadgeBtn,
                        backgroundColor: isDone ? '#dcfce7' : '#fef3c7',
                        color: isDone ? '#15803d' : '#b45309',
                        borderColor: isDone ? '#86efac' : '#fde68a',
                      }}
                    >
                      {isDone ? '✓ Completed' : '⏳ Pending'}
                    </button>

                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      style={styles.deleteItemBtn}
                      title="Delete item"
                    >
                      🗑️
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}

const styles = {
  cardContainer: {
    backgroundColor: '#ffffff',
    borderRadius: '24px',
    padding: '1.75rem',
    boxShadow: '0 10px 30px rgba(0,0,0,0.03)',
    border: '1px solid #e2e8f0',
    marginBottom: '2rem',
    fontFamily: "'Outfit', 'Plus Jakarta Sans', 'Inter', system-ui, sans-serif",
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  sectionBadge: {
    fontSize: '0.75rem',
    fontWeight: '900',
    color: '#2563eb',
    letterSpacing: '0.5px',
  },
  sectionTitle: {
    fontSize: '1.3rem',
    fontWeight: '900',
    color: '#0f172a',
    margin: '0.2rem 0 0 0',
  },
  dateHighlight: {
    color: '#2563eb',
  },
  statsSummaryPill: {
    backgroundColor: '#f1f5f9',
    padding: '0.45rem 1rem',
    borderRadius: '16px',
    fontSize: '0.85rem',
    color: '#334155',
    fontWeight: '600',
  },
  singleInputFieldForm: {
    backgroundColor: '#f8fafc',
    borderRadius: '20px',
    padding: '1.25rem',
    border: '1.5px solid #e2e8f0',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.65rem',
  },
  inputGroupWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    flexWrap: 'wrap',
  },
  singleInputField: {
    flex: 2,
    minWidth: '240px',
    padding: '0.75rem 1.1rem',
    borderRadius: '14px',
    border: '1px solid #cbd5e1',
    fontSize: '0.95rem',
    fontWeight: '600',
    outline: 'none',
  },
  selectDropdown: {
    padding: '0.75rem 1rem',
    borderRadius: '14px',
    border: '1px solid #cbd5e1',
    backgroundColor: '#ffffff',
    fontSize: '0.9rem',
    fontWeight: '700',
    color: '#334155',
    outline: 'none',
    cursor: 'pointer',
  },
  addSubmitBtn: {
    backgroundColor: '#2563eb',
    color: '#ffffff',
    border: 'none',
    padding: '0.75rem 1.4rem',
    borderRadius: '14px',
    fontSize: '0.9rem',
    fontWeight: '900',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
  },
  autoPendingTip: {
    fontSize: '0.78rem',
    color: '#64748b',
    fontWeight: '600',
  },
  loadingState: {
    padding: '2rem',
    textAlign: 'center',
    color: '#64748b',
    fontWeight: '700',
  },
  emptyStateBox: {
    backgroundColor: '#f8fafc',
    padding: '2rem',
    borderRadius: '18px',
    textAlign: 'center',
    color: '#64748b',
    fontWeight: '700',
    border: '1px dashed #cbd5e1',
  },
  unifiedListGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.85rem',
  },
  listItemCard: {
    borderRadius: '18px',
    padding: '1.1rem 1.35rem',
    border: '1.5px solid',
    display: 'flex',
    alignItems: 'center',
    gap: '1.2rem',
    boxShadow: '0 4px 15px rgba(0,0,0,0.02)',
    transition: 'all 0.2s ease',
  },
  statusCheckBtn: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    border: '2px solid',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1rem',
    fontWeight: '900',
    cursor: 'pointer',
    flexShrink: 0,
  },
  itemMainContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.3rem',
  },
  badgeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  typeBadge: {
    fontSize: '0.72rem',
    fontWeight: '900',
    padding: '0.2rem 0.6rem',
    borderRadius: '8px',
  },
  categoryPill: {
    fontSize: '0.72rem',
    fontWeight: '800',
    backgroundColor: '#f1f5f9',
    color: '#475569',
    padding: '0.2rem 0.6rem',
    borderRadius: '8px',
  },
  itemTitleText: {
    fontSize: '1.1rem',
    fontWeight: '900',
    margin: 0,
  },
  itemActionEndCol: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.65rem',
  },
  statusBadgeBtn: {
    border: '1px solid',
    padding: '0.4rem 0.85rem',
    borderRadius: '12px',
    fontSize: '0.82rem',
    fontWeight: '900',
    cursor: 'pointer',
  },
  deleteItemBtn: {
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    padding: '0.4rem 0.6rem',
    borderRadius: '12px',
    fontSize: '0.85rem',
    cursor: 'pointer',
  },
};
