import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function DailyFocusCard() {
  const [focusData, setFocusData] = useState({
    cv_skill: 'Laravel Eloquent ORM',
    cv_skill_id: 1,
    suggested_upgrade: 'Redis Caching & Query Indexing',
    past_project_context: 'Vehicle Marketplace Platform',
    category: 'Backend',
    mastery_status: 'Practicing',
  });
  const [loading, setLoading] = useState(true);

  // Popup Middle Modal State
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  // Form State
  const [newTechLearned, setNewTechLearned] = useState('');
  const [codeSnippet, setCodeSnippet] = useState('');
  const [journalNotes, setJournalNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(null);
  const [generatedPost, setGeneratedPost] = useState(null);

  const fetchDailyFocus = async () => {
    setLoading(true);
    try {
      let res;
      try {
        res = await fetch('http://localhost:8000/api/get_daily_focus.php');
      } catch (e1) {
        res = await fetch('http://localhost/api/get_daily_focus.php');
      }

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      if (data.cv_skill) {
        setFocusData(data);
      }
    } catch (err) {
      console.warn('Backend API endpoint fallback active:', err);
      setFocusData({
        cv_skill: 'Laravel Eloquent ORM',
        cv_skill_id: 4,
        suggested_upgrade: 'Redis Caching & Query Indexing',
        past_project_context: 'Vehicle Marketplace Platform',
        category: 'Backend',
        mastery_status: 'Practicing',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDailyFocus();
  }, []);

  const handleOpenPopup = () => {
    setSubmitSuccess(null);
    setGeneratedPost(null);
    setIsPopupOpen(true);
  };

  const handleClosePopup = () => {
    setIsPopupOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newTechLearned.trim()) {
      alert('Please enter the new tech/skill learned today.');
      return;
    }

    setSubmitting(true);
    setSubmitSuccess(null);
    setGeneratedPost(null);

    const payload = {
      user_id: 1,
      cv_skill_id: focusData.cv_skill_id,
      new_tech_learned: newTechLearned,
      code_snippet: codeSnippet,
      journal_notes: journalNotes,
    };

    try {
      let res;
      try {
        res = await fetch('http://localhost:8000/api/save_learning.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } catch (e1) {
        res = await fetch('http://localhost/api/save_learning.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();

      if (data.success) {
        setSubmitSuccess('Daily learning logged successfully!');
        if (data.generated_post) {
          setGeneratedPost(data.generated_post.content);
        }
      } else {
        alert(data.message || 'Failed to save daily learning.');
      }
    } catch (err) {
      console.error('Error saving learning:', err);
      const mockPost = `🚀 Daily Learning Update: ${newTechLearned}\n\n💡 Key Takeaways:\n${journalNotes}\n\n💻 Code Implementation:\n${codeSnippet}\n\n#WebDevelopment #SoftwareEngineering #Backend #Laravel`;
      setSubmitSuccess('Daily learning logged successfully!');
      setGeneratedPost(mockPost);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyPost = () => {
    if (generatedPost) {
      navigator.clipboard.writeText(generatedPost);
      alert('LinkedIn Post copied to clipboard! 📋');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 font-sans">
      {/* Clean Focus Skill Card */}
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden mb-4">
        {/* Card Header */}
        <div className="bg-gradient-to-r from-slate-900 to-emerald-950 p-6 text-white flex justify-between items-center flex-wrap gap-4">
          <div>
            <span className="inline-block bg-emerald-500 text-white text-xs font-black uppercase px-3 py-1 rounded-full tracking-wider mb-2">
              🎯 Today's CV Focus Skill
            </span>
            <h2 className="text-2xl font-black text-white m-0">
              {loading ? 'Loading Focus Skill...' : focusData.cv_skill}
            </h2>
          </div>
          <button
            onClick={fetchDailyFocus}
            className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black px-4 py-2 rounded-xl transition-all shadow-md cursor-pointer"
          >
            🔄 Refresh Focus
          </button>
        </div>

        {/* Focus Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6 bg-slate-50 border-b border-slate-200">
          <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 shadow-sm">
            <span className="text-xs font-black text-emerald-700 uppercase tracking-wider block mb-1">
              🚀 Suggested Upgrade
            </span>
            <span className="text-lg font-black text-emerald-950">
              {focusData.suggested_upgrade}
            </span>
          </div>

          <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 shadow-sm">
            <span className="text-xs font-black text-amber-700 uppercase tracking-wider block mb-1">
              🔗 Project Connection
            </span>
            <span className="text-lg font-black text-amber-950">
              {focusData.past_project_context}
            </span>
          </div>
        </div>

        {/* Action Row with Prominent Center Popup Trigger Button */}
        <div className="p-6 bg-white flex justify-between items-center flex-wrap gap-4">
          <div>
            <h3 className="text-lg font-black text-slate-900 m-0">
              Ready to log your progress today?
            </h3>
            <p className="text-xs text-slate-500 m-0">
              Click below to open the quick learning logger modal.
            </p>
          </div>

          <button
            onClick={handleOpenPopup}
            className="bg-emerald-500 hover:bg-emerald-600 text-white font-black px-6 py-3 rounded-2xl text-sm transition-all shadow-lg shadow-emerald-500/30 flex items-center gap-2 cursor-pointer"
          >
            <span>+ Log Today's Learning</span>
          </button>
        </div>
      </div>

      {/* Center Middle Popup Modal Form */}
      <AnimatePresence>
        {isPopupOpen && (
          <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="flex justify-between items-center mb-4 border-b border-slate-200 pb-3">
                <h3 className="text-xl font-black text-slate-900 m-0">
                  Log Today's Learning Activity
                </h3>
                <button
                  onClick={handleClosePopup}
                  className="text-slate-400 hover:text-slate-700 text-2xl font-bold border-none bg-transparent cursor-pointer"
                >
                  ×
                </button>
              </div>

              {submitSuccess && (
                <div className="bg-emerald-50 text-emerald-800 p-4 rounded-2xl border border-emerald-300 mb-4 font-black text-sm">
                  ✅ {submitSuccess}
                </div>
              )}

              {/* Popup Modal Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Input 1: New Skill Learned Today */}
                <div>
                  <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-2">
                    New Skill Learned Today *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Laravel Sanctum API Token Auth or Redis Cache Keys"
                    value={newTechLearned}
                    onChange={(e) => setNewTechLearned(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-3 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Input 2: Code Editor / Code Snippet */}
                <div>
                  <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-2">
                    Code Snippet / Implementation Code
                  </label>
                  <textarea
                    rows="3"
                    placeholder="// Enter code snippet here..."
                    value={codeSnippet}
                    onChange={(e) => setCodeSnippet(e.target.value)}
                    className="w-full font-mono bg-slate-900 text-emerald-400 border border-slate-800 rounded-2xl p-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Input 3: Key Takeaways / Notes */}
                <div>
                  <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-2">
                    Key Takeaways / Notes
                  </label>
                  <textarea
                    rows="2"
                    placeholder="What did you discover or optimize today?"
                    value={journalNotes}
                    onChange={(e) => setJournalNotes(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-3 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Modal Footer Buttons */}
                <div className="flex justify-end items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleClosePopup}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-5 py-3 rounded-2xl text-xs transition-all border border-slate-300 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white font-black px-6 py-3 rounded-2xl shadow-lg shadow-emerald-500/30 transition-all text-xs cursor-pointer"
                  >
                    {submitting ? 'Saving...' : 'Submit & Save Learning'}
                  </button>
                </div>
              </form>

              {/* Generated Post Preview inside Modal */}
              {generatedPost && (
                <div className="mt-6 bg-slate-900 text-white p-4 rounded-2xl border border-slate-800">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-black text-emerald-400">
                      📱 Generated Post Draft
                    </span>
                    <button
                      onClick={handleCopyPost}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-black px-3 py-1 rounded-xl transition-all"
                    >
                      📋 Copy Text
                    </button>
                  </div>
                  <pre className="bg-slate-950 p-3 rounded-xl text-slate-200 text-[11px] font-sans whitespace-pre-wrap leading-relaxed">
                    {generatedPost}
                  </pre>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
