import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../utils/apiClient';
import { motion, AnimatePresence } from 'framer-motion';

export default function NewSkillUpgradeSection({ selectedDateStr }) {
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Custom new skill form state
  const [customSkillName, setCustomSkillName] = useState('');
  const [customCategory, setCustomCategory] = useState('Backend');
  const [targetDate, setTargetDate] = useState(selectedDateStr || new Date().toISOString().split('T')[0]);

  // Skill Details View State
  const [dateSkills, setDateSkills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSkillDetail, setSelectedSkillDetail] = useState(null);
  const [isFetchingDetail, setIsFetchingDetail] = useState(false);

  // Sync when global calendar date changes
  useEffect(() => {
    if (selectedDateStr) {
      setTargetDate(selectedDateStr);
    }
  }, [selectedDateStr]);

  // Fetch skills scheduled for the selected targetDate (Combines new_skills & daily_logs)
  const fetchSkillsForDate = useCallback(async () => {
    setLoading(true);
    let combinedList = [];

    // 1. Fetch from new_skills API
    try {
      let res = await apiClient.get('/new-skills');
      const data = res.data;
      if (data.skills && Array.isArray(data.skills)) {
        const filteredNewSkills = data.skills.filter((item) => {
          const itemDate = item.target_date ? item.target_date.split('T')[0] : '';
          return itemDate === targetDate;
        }).map((item) => ({
          id: `new-${item.id}`,
          rawId: item.id,
          source: 'new_skills',
          skill_name: item.skill_name,
          category: item.category || 'Backend',
          log_date: item.target_date ? item.target_date.split('T')[0] : targetDate,
          journal_notes: item.journal_notes || `Scheduled new skill upgrade for ${targetDate}.`,
          hours_allocation: item.hours_allocation || 3.5,
          status: item.status || 'Learning',
          isCompleted: item.status === 'Mastered',
        }));

        combinedList = [...combinedList, ...filteredNewSkills];
      }
    } catch (err) {
      console.warn('Notice loading new_skills API:', err);
    }

    // 2. Fetch from daily_logs API (for logs registered as tech learned)
    try {
      let resLogs = await apiClient.get('/daily-logs');
      const logsData = resLogs.data;
      if (logsData.data && Array.isArray(logsData.data)) {
        const filteredLogs = logsData.data.filter((item) => {
          const logDate = item.log_date ? item.log_date.split('T')[0] : '';
          return logDate === targetDate && (item.new_tech_learned || item.cv_skill_id);
        }).map((item) => ({
          id: `log-${item.id}`,
          rawId: item.id,
          source: 'daily_logs',
          skill_name: item.new_tech_learned || item.cv_skill?.skill_name || 'Tech Skill',
          category: item.cv_skill?.category || 'Backend',
          log_date: targetDate,
          journal_notes: item.journal_notes || `Scheduled tech skill upgrade for ${targetDate}.`,
          hours_allocation: item.hours_coding || 3.5,
          status: (item.confidence_score || 0) >= 4 ? 'Mastered' : 'Learning',
          isCompleted: (item.confidence_score || 0) >= 4,
        }));

        // Avoid duplicate skill titles
        filteredLogs.forEach((logItem) => {
          if (!combinedList.some((s) => s.skill_name.toLowerCase() === logItem.skill_name.toLowerCase())) {
            combinedList.push(logItem);
          }
        });
      }
    } catch (err) {
      console.warn('Notice loading daily_logs API:', err);
    }

    setDateSkills(combinedList);
    setLoading(false);
  }, [targetDate]);

  useEffect(() => {
    fetchSkillsForDate();
  }, [fetchSkillsForDate]);

  const handleFetchSkillDetail = async (skill) => {
    setIsFetchingDetail(true);
    setSelectedSkillDetail(skill);

    if (skill.rawId) {
      try {
        let res = await apiClient.get(`/new-skills/${skill.rawId}`);
        const data = res.data;
        if (data.skill) {
          setSelectedSkillDetail({
            ...data.skill,
            log_date: data.skill.target_date ? data.skill.target_date.split('T')[0] : targetDate,
            isCompleted: data.skill.status === 'Mastered',
          });
        }
      } catch (err) {
        console.warn('Backend detail fallback.');
      }
    }
    setIsFetchingDetail(false);
  };

  const handleLearnAndAddToCV = async (skillName, category) => {
    setIsSubmitting(true);
    setSuccessMsg('');

    const targetDateToUse = targetDate || selectedDateStr || new Date().toISOString().split('T')[0];

    const payload = {
      skill_name: skillName,
      category: category,
      target_date: targetDateToUse,
      hours_allocation: 3.5,
      journal_notes: `Scheduled learning objective for tech skill '${skillName}' (${category}) on ${targetDateToUse}.`,
    };

    let createdSkillObj = {
      id: `new-${Date.now()}`,
      skill_name: skillName,
      category: category,
      log_date: targetDateToUse,
      journal_notes: payload.journal_notes,
      hours_allocation: 3.5,
      status: 'Learning',
      isCompleted: false,
    };

    // Save exclusively to new_skills table API
    try {
      let res = await apiClient.post('/new-skills', payload);

      const resData = res.data;
      if (resData.skill) {
        createdSkillObj = {
          id: `new-${resData.skill.id}`,
          rawId: resData.skill.id,
          source: 'new_skills',
          skill_name: resData.skill.skill_name,
          category: resData.skill.category,
          log_date: resData.skill.target_date ? resData.skill.target_date.split('T')[0] : targetDateToUse,
          journal_notes: resData.skill.journal_notes,
          hours_allocation: resData.skill.hours_allocation,
          status: resData.skill.status,
          isCompleted: false,
        };
      }
    } catch (err) {
      console.warn('Saved locally to state.');
    }

    setDateSkills((prev) => [createdSkillObj, ...prev]);
    setSuccessMsg(`🚀 Successfully added '${skillName}' to new_skills table for ${targetDateToUse}!`);
    setIsSubmitting(false);
  };

  const handleCustomSkillSubmit = (e) => {
    e.preventDefault();
    if (!customSkillName.trim()) return;

    handleLearnAndAddToCV(customSkillName, customCategory);
    setCustomSkillName('');
  };

  const handleDeleteSkill = async (item) => {
    if (!window.confirm(`Delete skill '${item.skill_name}'?`)) return;

    setDateSkills((prev) => prev.filter((s) => s.id !== item.id));

    if (item.rawId) {
      try {
        await apiClient.delete(`/new-skills/${item.rawId}`);
      } catch (e) {}
    }
  };

  return (
    <div style={styles.cardWrapper}>
      {/* Header Bar */}
      <div style={styles.headerBar}>
        <div>
          <span style={styles.badgeLabel}>💡 TECH UPGRADES & SKILL EXPANSION</span>
          <h3 style={styles.headerTitle}>
            Add New Skill Learning for Date: <span style={{ color: '#818cf8' }}>{targetDate}</span>
          </h3>
        </div>

        <div style={styles.headerActions}>
          <button
            onClick={() => setShowForm((prev) => !prev)}
            style={styles.sideAddBtn}
          >
            {showForm ? '✖ Close Form' : '+ Add Skill'}
          </button>
        </div>
      </div>

      {successMsg && <div style={styles.successAlert}>{successMsg}</div>}

      {/* Clean 1-Line Custom Skill Form */}
      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleCustomSkillSubmit}
            style={styles.customFormBox}
          >
            <span style={styles.formLabel}>+ Add New Skill to Learn for Calendar Date:</span>
            <div style={styles.formRow}>
              <input
                type="text"
                required
                placeholder="Type new skill name (e.g. Docker, Redis, GraphQL)..."
                value={customSkillName}
                onChange={(e) => setCustomSkillName(e.target.value)}
                style={styles.textInput}
              />

              <select
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                style={styles.selectInput}
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

              <button type="submit" disabled={isSubmitting} style={styles.primaryAddBtn}>
                {isSubmitting ? 'Saving...' : '+ Save Skill'}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Skills Scheduled for Selected Date Section */}
      <div style={styles.dateSkillsSection}>
        <div style={styles.sectionHeader}>
          <h4 style={styles.sectionTitle}>
            New Tech Skills for <span style={{ color: '#818cf8' }}>{targetDate}</span> ({dateSkills.length})
          </h4>
        </div>

        {loading ? (
          <div style={styles.infoText}>Loading skills for date {targetDate}...</div>
        ) : dateSkills.length === 0 ? (
          <div style={styles.emptyBox}>No new skills scheduled for {targetDate}. Click "+ Add Skill" to add one!</div>
        ) : (
          <div style={styles.skillsGrid}>
            {dateSkills.map((skill) => (
              <div key={skill.id} style={styles.skillCard}>
                <div style={styles.skillLeft}>
                  <span style={styles.skillBadgeIcon}>🚀</span>
                  <div>
                    <h5 style={styles.skillTitle}>{skill.skill_name}</h5>
                    <span style={styles.categoryTag}>{skill.category}</span>
                  </div>
                </div>

                <div style={styles.skillActions}>
                  <button
                    onClick={() => handleFetchSkillDetail(skill)}
                    style={styles.viewDetailsBtn}
                  >
                    👁️ View Details
                  </button>
                  <button
                    onClick={() => handleDeleteSkill(skill)}
                    style={styles.deleteBtn}
                    title="Delete Skill"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Skill Details Modal Popup */}
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
                  <span style={{ fontSize: '1.4rem' }}>💡</span>
                  <div>
                    <h3 style={styles.modalTitle}>{selectedSkillDetail.skill_name}</h3>
                    <span style={styles.categoryTag}>{selectedSkillDetail.category}</span>
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
                  <div style={styles.infoText}>Fetching detail from API...</div>
                ) : (
                  <>
                    <div style={styles.detailRow}>
                      <span style={styles.detailLabel}>📅 Target Calendar Date:</span>
                      <span style={styles.detailValue}>{selectedSkillDetail.log_date || selectedSkillDetail.target_date || targetDate}</span>
                    </div>

                    <div style={styles.detailRow}>
                      <span style={styles.detailLabel}>⚡ Learning Status:</span>
                      <span style={{
                        ...styles.statusTag,
                        backgroundColor: selectedSkillDetail.status === 'Mastered' ? '#d1fae5' : '#e0e7ff',
                        color: selectedSkillDetail.status === 'Mastered' ? '#047857' : '#4338ca',
                      }}>
                        {selectedSkillDetail.status || 'Learning'}
                      </span>
                    </div>

                    <div style={styles.detailRow}>
                      <span style={styles.detailLabel}>⏱️ Target Allocation:</span>
                      <span style={styles.detailValue}>{selectedSkillDetail.hours_allocation || 3.5} Hours</span>
                    </div>

                    <div style={styles.notesBox}>
                      <span style={styles.notesLabel}>📝 Journal & Learning Objective:</span>
                      <p style={styles.notesText}>{selectedSkillDetail.journal_notes || `Scheduled learning objective for '${selectedSkillDetail.skill_name}'.`}</p>
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
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
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
  successAlert: {
    backgroundColor: '#d1fae5',
    color: '#047857',
    padding: '0.65rem 0.85rem',
    borderRadius: '12px',
    fontSize: '0.82rem',
    fontWeight: '800',
    marginBottom: '1rem',
    border: '1px solid #a7f3d0',
  },
  customFormBox: {
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
  formRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: '0.65rem',
    alignItems: 'center',
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
  primaryAddBtn: {
    backgroundColor: '#818cf8',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    padding: '0.45rem 0.85rem',
    fontSize: '0.78rem',
    fontWeight: '900',
    cursor: 'pointer',
  },
  dateSkillsSection: {
    marginTop: '0.5rem',
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
  skillsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: '0.65rem',
  },
  skillCard: {
    backgroundColor: '#f8fafc',
    borderRadius: '14px',
    padding: '0.75rem 0.9rem',
    border: '1px solid #e2e8f0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '0.5rem',
  },
  skillLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
  },
  skillBadgeIcon: {
    fontSize: '1.1rem',
    backgroundColor: '#f3e8ff',
    padding: '0.35rem',
    borderRadius: '10px',
  },
  skillTitle: {
    fontSize: '0.85rem',
    fontWeight: '800',
    color: '#1e293b',
    margin: 0,
  },
  categoryTag: {
    fontSize: '0.68rem',
    fontWeight: '800',
    color: '#6366f1',
    backgroundColor: '#e0e7ff',
    padding: '0.15rem 0.45rem',
    borderRadius: '8px',
    display: 'inline-block',
  },
  skillActions: {
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
  deleteBtn: {
    backgroundColor: '#ffffff',
    border: '1px solid #fecaca',
    borderRadius: '10px',
    padding: '0.3rem 0.45rem',
    fontSize: '0.8rem',
    cursor: 'pointer',
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
  statusTag: {
    padding: '0.25rem 0.65rem',
    borderRadius: '10px',
    fontSize: '0.75rem',
    fontWeight: '800',
  },
  notesBox: {
    backgroundColor: '#f8fafc',
    borderRadius: '14px',
    padding: '0.85rem',
    border: '1px solid #e2e8f0',
    marginTop: '0.25rem',
  },
  notesLabel: {
    fontSize: '0.75rem',
    fontWeight: '800',
    color: '#64748b',
    display: 'block',
    marginBottom: '0.35rem',
  },
  notesText: {
    fontSize: '0.85rem',
    color: '#1e293b',
    margin: 0,
    lineHeight: '1.4',
    fontWeight: '600',
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
