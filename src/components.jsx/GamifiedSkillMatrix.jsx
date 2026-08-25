import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function GamifiedSkillMatrix() {
  const [coins, setCoins] = useState(250);
  const [streak, setStreak] = useState(7);
  const [selectedLevel, setSelectedLevel] = useState('Practicing');
  const [showWinModal, setShowWinModal] = useState(false);

  // Skill Tiles Matrix matching the Wordle pastel tiles in the mockup
  const skillTiles = [
    { letter: 'L', name: 'Laravel', status: 'mastered', bg: 'bg-emerald-400' },
    { letter: 'R', name: 'React.js', status: 'practicing', bg: 'bg-amber-400' },
    { letter: 'P', name: 'PHP 8.3', status: 'mastered', bg: 'bg-emerald-400' },
    { letter: 'M', name: 'MySQL', status: 'mastered', bg: 'bg-rose-400' },
    { letter: 'J', name: 'JWT Auth', status: 'revision', bg: 'bg-amber-400' },

    { letter: 'E', name: 'Eloquent', status: 'mastered', bg: 'bg-emerald-400' },
    { letter: 'T', name: 'Tailwind', status: 'practicing', bg: 'bg-emerald-400' },
    { letter: 'N', name: 'Node.js', status: 'revision', bg: 'bg-amber-400' },
    { letter: 'D', name: 'Docker', status: 'practicing', bg: 'bg-rose-400' },
    { letter: 'G', name: 'Git', status: 'mastered', bg: 'bg-amber-400' },

    { letter: 'A', name: 'API Auth', status: 'practicing', bg: 'bg-amber-400' },
    { letter: 'S', name: 'Sanctum', status: 'mastered', bg: 'bg-emerald-400' },
    { letter: 'V', name: 'Vue.js', status: 'revision', bg: 'bg-rose-400' },
    { letter: 'C', name: 'CSS Grid', status: 'mastered', bg: 'bg-emerald-400' },
    { letter: 'U', name: 'UI Design', status: 'practicing', bg: 'bg-amber-400' },
  ];

  const handleTileClick = (tile) => {
    setShowWinModal(true);
  };

  const handleClaimReward = () => {
    setCoins((prev) => prev + 25);
    setStreak((prev) => prev + 1);
    setShowWinModal(false);
  };

  return (
    <div className="bg-slate-100 rounded-3xl p-6 shadow-xl border border-slate-300 max-w-4xl mx-auto my-6 font-sans">
      {/* Header Bar with Coins & Streak */}
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <span className="bg-amber-400 text-slate-900 font-black text-sm px-4 py-2 rounded-2xl shadow-md flex items-center gap-2">
            🪙 <span>{coins} Coins / XP</span>
          </span>
          <span className="bg-rose-500 text-white font-black text-xs px-4 py-2 rounded-2xl shadow-md flex items-center gap-2">
            🔥 <span>{streak} Day Streak</span>
          </span>
        </div>

        {/* Level Category Selector Pills matching mockup */}
        <div className="flex items-center gap-2 flex-wrap">
          {['Easy', 'Practicing', 'Hard', 'Impossible'].map((level) => (
            <button
              key={level}
              onClick={() => setSelectedLevel(level)}
              className={`px-4 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer shadow-sm ${
                selectedLevel === level
                  ? level === 'Easy'
                    ? 'bg-emerald-500 text-white'
                    : level === 'Practicing'
                    ? 'bg-amber-400 text-slate-900'
                    : level === 'Hard'
                    ? 'bg-rose-500 text-white'
                    : 'bg-slate-900 text-white'
                  : 'bg-white text-slate-700 hover:bg-slate-200'
              }`}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      {/* Gamified Skill Tile Matrix Grid */}
      <div className="mb-6">
        <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3">
          🎯 Gamified CV Skill Mastery Grid (Click to complete daily goal!)
        </h4>

        <div className="grid grid-cols-5 gap-3">
          {skillTiles.map((tile, idx) => (
            <motion.button
              key={idx}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleTileClick(tile)}
              className={`${tile.bg} text-slate-900 font-black h-16 rounded-2xl flex flex-col justify-center items-center shadow-md border-2 border-white/60 cursor-pointer transition-all hover:brightness-105`}
            >
              <span className="text-xl font-black">{tile.letter}</span>
              <span className="text-[10px] uppercase tracking-wider font-extrabold opacity-90">
                {tile.name}
              </span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Gamified "You Won! +25 Coins" Success Modal (Matching mockup!) */}
      <AnimatePresence>
        {showWinModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl border-4 border-amber-400 relative"
            >
              {/* Yellow Smiley Face Badge */}
              <div className="w-20 h-20 bg-amber-300 rounded-full flex justify-center items-center mx-auto mb-4 shadow-lg text-4xl">
                🙂
              </div>

              <h3 className="text-2xl font-black text-slate-900 mb-1">
                You Won!
              </h3>
              <p className="text-sm font-black text-amber-600 mb-6">
                +25 🪙 Coins Earned!
              </p>

              <div className="space-y-3">
                <button
                  onClick={handleClaimReward}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black py-3 rounded-2xl text-sm shadow-md transition-all cursor-pointer"
                >
                  Claim & Next Skill Goal →
                </button>
                <button
                  onClick={() => setShowWinModal(false)}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-3 rounded-2xl text-xs transition-all cursor-pointer border border-slate-300"
                >
                  Share Result 📤
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
