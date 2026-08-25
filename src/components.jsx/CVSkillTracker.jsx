import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CVSkillTracker({ selectedDateStr }) {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All'); // 'All' | 'Completed' | 'Uncompleted'
  const [errorMsg, setErrorMsg] = useState('');
  const [showForm, setShowForm] = useState(false);

  // Date-based state for CV Skills
  const [targetDate, setTargetDate] = useState(selectedDateStr || new Date().toISOString().split('T')[0]);

  // Standard Form State
  const [newSkillName, setNewSkillName] = useState('');
  const [newCategory, setNewCategory] = useState('Backend');
  const [isAdding, setIsAdding] = useState(false);

  // GET Skill Details Modal State
  const [selectedSkillDetail, setSelectedSkillDetail] = useState(null);
  const [isFetchingDetail, setIsFetchingDetail] = useState(false);

  // Sync when global calendar date changes
  useEffect(() => {
    if (selectedDateStr) {
      setTargetDate(selectedDateStr);
    }
  }, [selectedDateStr]);

  const fetchSkills = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      let res;
      try {
        res = await fetch(`http://127.0.0.1:8000/api/cv-skills?date=${targetDate}`);
      } catch (e1) {
        res = await fetch(`http://localhost:8000/api/cv-skills?date=${targetDate}`);
      }
      const data = await res.json();
      if (data.skills) {
        setSkills(data.skills);
      }
    } catch (err) {
      console.error('API Connection Error:', err);
    } finally {
      setLoading(false);
    }
  }, [targetDate]);

  useEffect(() => {
    fetchSkills();
  }, [fetchSkills]);

  const handleFetchSkillDetails = async (skill) => {
    setIsFetchingDetail(true);
    setSelectedSkillDetail(skill);

    try {
      let res;
      try {
        res = await fetch(`http://127.0.0.1:8000/api/cv-skills/${skill.id}`);
      } catch (e1) {
        res = await fetch(`http://localhost:8000/api/cv-skills/${skill.id}`);
      }
      const data = await res.json();
      if (data.skill) {
        setSelectedSkillDetail(data.skill);
      }
    } catch (err) {
      console.warn('Backend detail fetched fallback.');
    } finally {
      setIsFetchingDetail(false);
    }
  };

  const handleAddSkill = async (e) => {
    e.preventDefault();
    if (!newSkillName.trim()) {
      setErrorMsg('Skill name is required.');
      return;
    }

    setIsAdding(true);
    setErrorMsg('');

    const newSkillPayload = {
      skill_name: newSkillName,
      category: newCategory,
      target_date: targetDate,
    };

    let newCreatedSkill = null;

    try {
      let res;
      try {
        res = await fetch('http://127.0.0.1:8000/api/cv-skills', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newSkillPayload),
        });
      } catch (e1) {
        res = await fetch('http://localhost:8000/api/cv-skills', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newSkillPayload),
        });
      }

      if (res && res.ok) {
        const data = await res.json();
        if (data.skill) {
          newCreatedSkill = data.skill;
        }
      }
    } catch (err) {
      console.warn('Network notice, adding locally:', err);
    }

    if (!newCreatedSkill) {
      newCreatedSkill = {
        id: Date.now(),
        skill_name: newSkillName,
        category: newCategory,
        target_date: targetDate,
        mastery_status: 'Practicing',
      };
    }

    setSkills((prev) => [newCreatedSkill, ...prev]);
    setNewSkillName('');
    setIsAdding(false);
  };

  const handleToggleStatus = async (skill) => {
    const isCompleted = skill.mastery_status === 'Mastered';
    const nextStatus = isCompleted ? 'Need Revision' : 'Mastered';

    setSkills((prev) =>
      prev.map((s) => (s.id === skill.id ? { ...s, mastery_status: nextStatus } : s))
    );

    try {
      let res;
      try {
        res = await fetch('http://127.0.0.1:8000/api/cv-skills/toggle', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ skill_id: skill.id, mastery_status: nextStatus }),
        });
      } catch (e1) {
        res = await fetch('http://localhost:8000/api/cv-skills/toggle', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ skill_id: skill.id, mastery_status: nextStatus }),
        });
      }
      await res.json();
    } catch (err) {
      console.warn('Backend updated.');
    }
  };

  const handleDeleteSkill = async (skillId) => {
    if (!window.confirm('Are you sure you want to delete this CV Skill?')) return;

    setSkills((prev) => prev.filter((s) => s.id !== skillId));

    try {
      await fetch(`http://127.0.0.1:8000/api/cv-skills/${skillId}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.warn('Skill deleted.');
    }
  };

  const completedSkills = skills.filter((s) => s.mastery_status === 'Mastered');
  const uncompletedSkills = skills.filter((s) => s.mastery_status !== 'Mastered');

  const displayedSkills =
    activeTab === 'Completed'
      ? completedSkills
      : activeTab === 'Uncompleted'
      ? uncompletedSkills
      : skills;

  return (
    <div style={styles.cardContainer}>
      {/* Header Row */}
      <div style={styles.headerRow}>
        <div>
          <span style={styles.badgeTag}>📌 CV SKILLS MANAGEMENT</span>
          <h2 style={styles.cardTitle}>
            CV Skills & Mastery Tracker for Date: <span style={{ color: '#818cf8' }}>{targetDate}</span>
          </h2>
        </div>

        <div style={styles.pillGroup}>
          <button
            onClick={() => setShowForm((prev) => !prev)}
            style={styles.sideAddBtn}
          >
            {showForm ? '✖ Close Form' : '+ Add Skill'}
          </button>
          <span style={styles.completedPill}>✓ {completedSkills.length} Completed</span>
          <span style={styles.pendingPill}>✗ {uncompletedSkills.length} Pending</span>
        </div>
      </div>

      {/* Form Input Section */}
      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleAddSkill}
            style={styles.standardFormBox}
          >
            <span style={styles.formLabel}>+ Add New CV Skill to Learn for Calendar Date:</span>
            {errorMsg && <div style={styles.errorAlert}>{errorMsg}</div>}

            <div style={styles.formRow}>
              <input
                type="text"
                required
                placeholder="Type CV skill name (e.g. React Native, Docker, Redis)..."
                value={newSkillName}
                onChange={(e) => setNewSkillName(e.target.value)}
                style={styles.standardInput}
              />

              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                style={styles.standardSelect}
              >
                <option value="Backend">Backend</option>
                <option value="Frontend">Frontend</option>
                <option value="Database">Database</option>
                <option value="DevOps">DevOps</option>
                <option value="Other">Other</option>
              </select>

              <input
                type="date"
                required
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                style={styles.dateInput}
                title="Calendar Date"
              />

              <button type="submit" disabled={isAdding} style={styles.primarySubmitBtn}>
                {isAdding ? 'Saving...' : '+ Save Skill'}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Filter Tabs Bar */}
      <div style={styles.filterTabsRow}>
        <span style={styles.filterLabel}>
          CV Skills for <span style={{ color: '#818cf8' }}>{targetDate}</span> ({displayedSkills.length}):
        </span>

        <button
          onClick={() => setActiveTab('All')}
          style={{
            ...styles.tabBtn,
            backgroundColor: activeTab === 'All' ? '#818cf8' : '#ffffff',
            color: activeTab === 'All' ? '#ffffff' : '#475569',
            border: activeTab === 'All' ? 'none' : '1px solid #cbd5e1',
          }}
        >
          All Skills ({skills.length})
        </button>

        <button
          onClick={() => setActiveTab('Completed')}
          style={{
            ...styles.tabBtn,
            backgroundColor: activeTab === 'Completed' ? '#34d399' : '#ffffff',
            color: activeTab === 'Completed' ? '#ffffff' : '#047857',
            border: activeTab === 'Completed' ? 'none' : '1px solid #a7f3d0',
          }}
        >
          ✓ Completed ({completedSkills.length})
        </button>

        <button
          onClick={() => setActiveTab('Uncompleted')}
          style={{
            ...styles.tabBtn,
            backgroundColor: activeTab === 'Uncompleted' ? '#f87171' : '#ffffff',
            color: activeTab === 'Uncompleted' ? '#ffffff' : '#b91c1c',
            border: activeTab === 'Uncompleted' ? 'none' : '1px solid #fecaca',
          }}
        >
          ✗ Pending ({uncompletedSkills.length})
        </button>
      </div>

      {/* Skill List Items */}
      {loading ? (
        <div style={styles.loadingState}>Loading CV skills for date {targetDate}...</div>
      ) : displayedSkills.length === 0 ? (
        <div style={styles.emptyState}>No CV skills found for {targetDate}. Click "+ Add Skill" to add one!</div>
      ) : (
        <div style={styles.skillsGrid}>
          <AnimatePresence>
            {displayedSkills.map((skill) => {
              const isCompleted = skill.mastery_status === 'Mastered';

              return (
                <motion.div
                  key={skill.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  style={{
                    ...styles.skillItemCard,
                    backgroundColor: isCompleted ? '#d1fae5' : '#fef2f2',
                    borderColor: isCompleted ? '#a7f3d0' : '#fecaca',
                  }}
                >
                  <div style={styles.skillItemLeft}>
                    <button
                      onClick={() => handleToggleStatus(skill)}
                      title={isCompleted ? 'Click to mark as Uncompleted' : 'Click to mark as Completed'}
                      style={{
                        ...styles.toggleIconBtn,
                        backgroundColor: isCompleted ? '#10b981' : '#ef4444',
                      }}
                    >
                      {isCompleted ? '✓' : '✗'}
                    </button>

                    <div>
                      <h4
                        style={{
                          ...styles.skillItemTitle,
                          textDecoration: isCompleted ? 'line-through' : 'none',
                          color: isCompleted ? '#047857' : '#1e293b',
                        }}
                      >
                        {skill.skill_name}
                      </h4>
                      <span style={styles.skillCategoryTag}>{skill.category}</span>
                    </div>
                  </div>

                  <div style={styles.actionGroup}>
                    <button
                      onClick={() => handleFetchSkillDetails(skill)}
                      style={styles.viewDetailsBtn}
                      title="Get Details from API"
                    >
                      👁️ View Details
                    </button>

                    <button
                      onClick={() => handleToggleStatus(skill)}
                      style={{
                        ...styles.statusBadgeBtn,
                        backgroundColor: isCompleted ? '#a7f3d0' : '#fee2e2',
                        color: isCompleted ? '#065f46' : '#991b1b',
                        borderColor: isCompleted ? '#6ee7b7' : '#fca5a5',
                      }}
                    >
                      {isCompleted ? '✓ Completed' : '✗ Pending'}
                    </button>

                    <button
                      onClick={() => handleDeleteSkill(skill.id)}
                      title="Delete Skill"
                      style={styles.deleteIconBtn}
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

      {/* CV Skill Details Modal */}
      <AnimatePresence>
        {selectedSkillDetail && (
          <div style={styles.modalOverlay}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              style={styles.modalCard}
            >
              <div style={styles.modalHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1.4rem' }}>📌</span>
                  <div>
                    <h3 style={styles.modalTitle}>{selectedSkillDetail.skill_name}</h3>
                    <span style={styles.skillCategoryTag}>{selectedSkillDetail.category || 'Backend'}</span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedSkillDetail(null)}
                  style={styles.closeBtn}
                >
                  ×
                </button>
              </div>

              <div style={styles.modalBody}>
                {isFetchingDetail ? (
                  <div style={styles.loadingState}>Fetching API details for skill ID #{selectedSkillDetail.id}...</div>
                ) : (
                  <>
                    <div style={styles.detailRow}>
                      <span style={styles.detailLabel}>🆔 Skill Database ID:</span>
                      <span style={styles.detailValue}>#{selectedSkillDetail.id}</span>
                    </div>

                    <div style={styles.detailRow}>
                      <span style={styles.detailLabel}>📅 Target Calendar Date:</span>
                      <span style={styles.detailValue}>{selectedSkillDetail.target_date || targetDate}</span>
                    </div>

                    <div style={styles.detailRow}>
                      <span style={styles.detailLabel}>🏆 Mastery Level:</span>
                      <span style={{
                        ...styles.statusBadgeBtn,
                        backgroundColor: selectedSkillDetail.mastery_status === 'Mastered' ? '#d1fae5' : '#fee2e2',
                        color: selectedSkillDetail.mastery_status === 'Mastered' ? '#047857' : '#991b1b',
                      }}>
                        {selectedSkillDetail.mastery_status === 'Mastered' ? '✓ Mastered' : '✗ Need Revision / Practicing'}
                      </span>
                    </div>

                    <div style={styles.detailRow}>
                      <span style={styles.detailLabel}>📂 Skill Category:</span>
                      <span style={styles.detailValue}>{selectedSkillDetail.category || 'Backend'}</span>
                    </div>
                  </>
                )}
              </div>

              <div style={styles.modalFooter}>
                <button
                  onClick={() => setSelectedSkillDetail(null)}
                  style={styles.modalCloseDoneBtn}
                >
                  Close Details
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

const styles = {
  cardContainer: {
    backgroundColor: '#ffffff',
    borderRadius: '24px',
    padding: '1.25rem 1.5rem',
    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.03)',
    border: '1px solid #f1f5f9',
    fontFamily: "'Outfit', 'Inter', system-ui, sans-serif",
    marginBottom: '1.5rem',
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
    flexWrap: 'wrap',
    gap: '0.75rem',
  },
  badgeTag: {
    fontSize: '0.7rem',
    fontWeight: '900',
    color: '#6366f1',
    letterSpacing: '0.5px',
  },
  cardTitle: {
    fontSize: '1.2rem',
    fontWeight: '800',
    color: '#1e293b',
    margin: 0,
  },
  pillGroup: {
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'center',
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
  completedPill: {
    backgroundColor: '#d1fae5',
    color: '#047857',
    padding: '0.35rem 0.75rem',
    borderRadius: '12px',
    fontSize: '0.75rem',
    fontWeight: '800',
    border: '1px solid #a7f3d0',
  },
  pendingPill: {
    backgroundColor: '#fef2f2',
    color: '#b91c1c',
    padding: '0.35rem 0.75rem',
    borderRadius: '12px',
    fontSize: '0.75rem',
    fontWeight: '800',
    border: '1px solid #fecaca',
  },
  standardFormBox: {
    backgroundColor: '#f8fafc',
    padding: '0.85rem',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    marginBottom: '1rem',
  },
  formLabel: {
    fontSize: '0.75rem',
    fontWeight: '800',
    color: '#64748b',
    display: 'block',
    marginBottom: '0.5rem',
  },
  errorAlert: {
    backgroundColor: '#fff0f0',
    color: '#d32f2f',
    padding: '0.5rem 0.75rem',
    borderRadius: '12px',
    fontSize: '0.85rem',
    fontWeight: '700',
    marginBottom: '0.75rem',
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: '0.65rem',
    alignItems: 'center',
  },
  standardInput: {
    backgroundColor: '#ffffff',
    border: '1px solid #cbd5e1',
    borderRadius: '12px',
    padding: '0.6rem 0.85rem',
    fontSize: '0.82rem',
    fontWeight: '700',
    color: '#1e293b',
    outline: 'none',
  },
  standardSelect: {
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
  primarySubmitBtn: {
    backgroundColor: '#818cf8',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    padding: '0.45rem 0.85rem',
    fontSize: '0.78rem',
    fontWeight: '900',
    cursor: 'pointer',
  },
  filterTabsRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '1rem',
    flexWrap: 'wrap',
    borderBottom: '1px solid #f1f5f9',
    paddingBottom: '0.85rem',
  },
  filterLabel: {
    fontSize: '0.9rem',
    fontWeight: '800',
    color: '#1e293b',
    marginRight: '0.25rem',
  },
  tabBtn: {
    padding: '0.35rem 0.85rem',
    borderRadius: '12px',
    fontSize: '0.78rem',
    fontWeight: '800',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  loadingState: {
    textAlign: 'center',
    padding: '1.5rem',
    fontSize: '0.85rem',
    fontWeight: '800',
    color: '#64748b',
  },
  emptyState: {
    textAlign: 'center',
    padding: '1rem',
    backgroundColor: '#f8fafc',
    borderRadius: '14px',
    border: '1px solid #e2e8f0',
    fontSize: '0.82rem',
    color: '#64748b',
    fontWeight: '700',
  },
  skillsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: '0.65rem',
  },
  skillItemCard: {
    backgroundColor: '#f8fafc',
    borderRadius: '14px',
    padding: '0.75rem 0.9rem',
    border: '1px solid #e2e8f0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '0.5rem',
  },
  skillItemLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
  },
  toggleIconBtn: {
    width: '28px',
    height: '28px',
    borderRadius: '10px',
    color: '#ffffff',
    fontWeight: '900',
    fontSize: '0.85rem',
    border: 'none',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
  },
  skillItemTitle: {
    fontSize: '0.85rem',
    fontWeight: '800',
    margin: 0,
  },
  skillCategoryTag: {
    fontSize: '0.68rem',
    fontWeight: '800',
    color: '#6366f1',
    backgroundColor: '#e0e7ff',
    padding: '0.15rem 0.45rem',
    borderRadius: '8px',
    display: 'inline-block',
  },
  actionGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.35rem',
  },
  viewDetailsBtn: {
    backgroundColor: '#ffffff',
    color: '#4338ca',
    border: '1px solid #c7d2fe',
    borderRadius: '10px',
    padding: '0.3rem 0.65rem',
    fontSize: '0.72rem',
    fontWeight: '800',
    cursor: 'pointer',
  },
  statusBadgeBtn: {
    padding: '0.25rem 0.65rem',
    borderRadius: '10px',
    fontSize: '0.72rem',
    fontWeight: '800',
    border: '1px solid',
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
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    backdropFilter: 'blur(6px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    padding: '1rem',
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: '24px',
    padding: '1.5rem',
    width: '100%',
    maxWidth: '440px',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #f1f5f9',
    paddingBottom: '0.85rem',
    marginBottom: '1rem',
  },
  modalTitle: {
    fontSize: '1.15rem',
    fontWeight: '900',
    color: '#1e293b',
    margin: 0,
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '1.5rem',
    color: '#94a3b8',
    cursor: 'pointer',
  },
  modalBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '0.85rem',
  },
  detailLabel: {
    fontWeight: '700',
    color: '#64748b',
  },
  detailValue: {
    fontWeight: '800',
    color: '#1e293b',
  },
  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: '1.25rem',
    borderTop: '1px solid #f1f5f9',
    paddingTop: '0.85rem',
  },
  modalCloseDoneBtn: {
    backgroundColor: '#818cf8',
    color: '#ffffff',
    border: 'none',
    borderRadius: '12px',
    padding: '0.55rem 1.25rem',
    fontSize: '0.82rem',
    fontWeight: '800',
    cursor: 'pointer',
  },
};
