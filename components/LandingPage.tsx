
import React from 'react';

interface LandingPageProps {
  onStart: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020617] text-slate-900 dark:text-white flex flex-col items-center justify-center p-6 relative overflow-hidden transition-colors duration-300">
      {/* Background decoration */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-500/10 blur-[120px] rounded-full pointer-events-none"></div>
      
      <div className="max-w-4xl w-full text-center z-10">
        <div className="inline-block px-4 py-1.5 mb-8 rounded-full border border-emerald-500/30 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-widest animate-pulse">
          Professional Analytics Protocol v3.1
        </div>
        
        <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tighter leading-none uppercase text-slate-900 dark:text-white">
          Digital Power.<br/>
          <span className="text-emerald-600 dark:text-emerald-500">Analog Focus.</span>
        </h1>
        
        <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
          The ultimate habit tracking system designed for power users. Advanced data visualizations, spreadsheet-style grid management, and printable analog syncing.
        </p>
        
        <div className="flex flex-col md:flex-row items-center justify-center space-y-4 md:space-y-0 md:space-x-4">
          <button 
            onClick={onStart}
            className="w-full md:w-auto px-10 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-black uppercase tracking-widest transition shadow-lg shadow-emerald-600/20 dark:shadow-[0_0_20px_rgba(16,185,129,0.3)]"
          >
            Start Tracking for Free
          </button>
          <button className="w-full md:w-auto px-10 py-4 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-lg font-black uppercase tracking-widest transition">
            View Live Demo
          </button>
        </div>

        {/* Dashboard Mockup Preview */}
        <div className="mt-20 relative">
          <div className="w-full aspect-video bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-t from-slate-100 dark:from-slate-950 to-transparent z-10"></div>
            
            {/* Mock Dashboard UI */}
            <div className="grid grid-cols-3 gap-3 opacity-40 group-hover:opacity-100 transition duration-1000">
              <div className="h-32 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 animate-pulse"></div>
              <div className="h-32 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"></div>
              <div className="h-32 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 animate-pulse delay-75"></div>
              <div className="col-span-3 h-48 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"></div>
            </div>

            <div className="absolute inset-0 flex items-center justify-center z-20">
              <div className="bg-white/80 dark:bg-emerald-500/10 backdrop-blur-md border border-emerald-500/30 p-6 rounded-xl text-center max-w-sm shadow-xl">
                <p className="text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-widest text-sm mb-2">Clean Slate Guarantee</p>
                <p className="text-slate-600 dark:text-slate-300 text-xs">Every journey starts with zero. We never pre-fill your dashboard with dummy data. Your progress is yours alone.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
