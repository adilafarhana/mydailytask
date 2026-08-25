import React, { useState } from 'react';

export default function PostExporter({ postData }) {
  const [platform, setPlatform] = useState('LinkedIn'); // 'LinkedIn' | 'X'
  const [copied, setCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const defaultData = {
    techLearned: 'Laravel Sanctum Token Authentication',
    codeSnippet: `Route::middleware('auth:sanctum')->get('/user', function (Request $request) {\n    return $request->user();\n});`,
    journalNotes: 'Implemented Bearer token authentication endpoints in Laravel for React SPA frontend.',
    skillName: 'Laravel Eloquent ORM',
  };

  const data = postData || defaultData;

  const generateLinkedInFormat = () => {
    return `🚀 Today's Learning Log: ${data.techLearned}\n\n💡 Key Takeaways:\n${data.journalNotes || 'Focused on building scalable web architecture.'}\n\n💻 Code Implementation:\n${data.codeSnippet || '// Code implementation notes'}\n\n#WebDevelopment #SoftwareEngineering #Backend #DailyLearning #CodingRoutine`;
  };

  const generateXThreadFormat = () => {
    const tweet1 = `🧵 1/3 Today's Learning: ${data.techLearned}\n\nExplored production implementation for modern applications.\n\n💡 Takeaways:\n${data.journalNotes || 'Building clean, scalable web applications.'}\n\n#BuildInPublic #DevCommunity`;

    const tweet2 = `🧵 2/3 Code snippet & implementation:\n\n${data.codeSnippet || '// Code implementation'}`;

    const tweet3 = `🧵 3/3 Daily Learning complete! Consistently upgrading skills one day at a time. 🚀\n\n#CodingRoutine #Tech #SoftwareEngineer`;

    return `${tweet1}\n\n========================================\n\n${tweet2}\n\n========================================\n\n${tweet3}`;
  };

  const activeContent = platform === 'LinkedIn' ? generateLinkedInFormat() : generateXThreadFormat();

  const handleCopy = () => {
    navigator.clipboard.writeText(activeContent);
    setCopied(true);
    setToastMessage(`${platform === 'LinkedIn' ? 'LinkedIn Post' : 'X Thread'} copied to clipboard! 📋`);

    setTimeout(() => {
      setCopied(false);
      setToastMessage('');
    }, 2500);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 font-sans">
      {/* Container Card */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-2xl border border-slate-800 relative">
        {/* Toast Notification */}
        {copied && (
          <div className="absolute top-4 right-4 bg-emerald-500 text-white text-xs font-black px-4 py-2 rounded-xl shadow-lg transition-all animate-bounce flex items-center gap-2 border border-emerald-400">
            <span>✅</span>
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Top Header Row with Platform Toggle Switch */}
        <div className="flex justify-between items-center mb-6 flex-wrap gap-4 border-b border-slate-800 pb-4">
          <div>
            <span className="inline-block bg-emerald-500 text-white text-xs font-black uppercase px-3 py-1 rounded-full tracking-wider mb-1">
              📱 Social Post Exporter
            </span>
            <h3 className="text-xl font-black text-white m-0">
              Generated Social Media Post Draft
            </h3>
          </div>

          {/* Toggle Switch between LinkedIn and X Thread */}
          <div className="bg-slate-800 p-1.5 rounded-2xl flex items-center border border-slate-700">
            <button
              onClick={() => setPlatform('LinkedIn')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                platform === 'LinkedIn'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              💼 LinkedIn
            </button>
            <button
              onClick={() => setPlatform('X')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                platform === 'X'
                  ? 'bg-rose-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              𝕏 Twitter Thread
            </button>
          </div>
        </div>

        {/* Format Preview Box */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-black text-slate-400 uppercase tracking-wider">
              {platform === 'LinkedIn' ? 'LinkedIn Single Post Format' : 'X (Twitter) 3-Tweet Thread Format'}
            </span>
            <span className="text-xs text-slate-400 font-mono font-bold">
              {platform === 'LinkedIn' ? 'Ready for LinkedIn' : '3 Tweets Thread'}
            </span>
          </div>

          <pre className="bg-slate-950 p-5 rounded-2xl text-slate-200 font-sans text-xs font-bold whitespace-pre-wrap leading-relaxed border border-slate-800 min-h-[160px] max-h-[350px] overflow-y-auto">
            {activeContent}
          </pre>
        </div>

        {/* Action Button Row */}
        <div className="flex justify-end items-center gap-3">
          <button
            onClick={handleCopy}
            className="bg-emerald-500 hover:bg-emerald-600 text-white font-black px-6 py-3 rounded-2xl text-sm transition-all shadow-lg shadow-emerald-500/30 flex items-center gap-2 cursor-pointer"
          >
            <span>📋 Copy to Clipboard</span>
          </button>
        </div>
      </div>
    </div>
  );
}
