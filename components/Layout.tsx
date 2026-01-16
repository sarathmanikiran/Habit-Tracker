
import React, { useState } from 'react';
import { User } from '../types';
import { useTheme } from '../contexts/ThemeContext';

interface LayoutProps {
  children: React.ReactNode;
  user: User | null;
  onLogout: () => void;
  currentPage: string;
  onPageChange: (page: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, user, onLogout, currentPage, onPageChange }) => {
  const { theme, toggleTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (!user) return <>{children}</>;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#020617] text-slate-900 dark:text-slate-100 transition-colors duration-300">
      {/* Navigation - Hidden during print */}
      <nav className="border-b border-slate-200 dark:border-slate-800 px-4 md:px-6 py-4 sticky top-0 bg-white/80 dark:bg-[#020617]/80 backdrop-blur-md z-50 no-print transition-colors duration-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 md:space-x-8">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center font-bold text-white dark:text-slate-900 shadow-lg shadow-emerald-500/20">U</div>
              <span className="font-bold text-lg md:text-xl tracking-tight uppercase jetbrains-mono hidden sm:inline">Ultimate Habit Tracker</span>
              <span className="font-bold text-lg tracking-tight uppercase jetbrains-mono sm:hidden">UHT</span>
            </div>
            
            {/* Desktop Menu */}
            <div className="hidden md:flex space-x-6 text-sm font-medium">
              <button 
                onClick={() => onPageChange('dashboard')}
                className={`transition ${currentPage === 'dashboard' ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-500 dark:text-slate-400 hover:text-emerald-500'}`}
              >
                Dashboard
              </button>
              <button 
                onClick={() => onPageChange('printable')}
                className={`transition ${currentPage === 'printable' ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-500 dark:text-slate-400 hover:text-emerald-500'}`}
              >
                Printable Version
              </button>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition text-slate-600 dark:text-slate-400"
              title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {theme === 'dark' ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                </svg>
              )}
            </button>

            <span className="text-sm text-slate-500 hidden md:inline">Hi, <span className="text-slate-900 dark:text-white font-medium">{user.name}</span></span>
            
            <button 
              onClick={onLogout}
              className="hidden md:block text-xs px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Sign Out
            </button>

            {/* Mobile Menu Button */}
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 dark:text-slate-300"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"} />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {isMobileMenuOpen && (
           <div className="md:hidden mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 animate-in slide-in-from-top-2">
             <div className="flex flex-col space-y-4">
                <button 
                  onClick={() => { onPageChange('dashboard'); setIsMobileMenuOpen(false); }}
                  className={`text-left px-2 py-1 ${currentPage === 'dashboard' ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-600 dark:text-slate-400'}`}
                >
                  Dashboard
                </button>
                <button 
                  onClick={() => { onPageChange('printable'); setIsMobileMenuOpen(false); }}
                  className={`text-left px-2 py-1 ${currentPage === 'printable' ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-600 dark:text-slate-400'}`}
                >
                  Printable Version
                </button>
                <div className="border-t border-slate-200 dark:border-slate-800 pt-3 flex justify-between items-center">
                   <span className="text-sm text-slate-500">Hi, {user.name}</span>
                   <button onClick={onLogout} className="text-xs text-red-500 dark:text-red-400 font-medium">Sign Out</button>
                </div>
             </div>
           </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-[1600px] mx-auto p-4 md:p-6 transition-colors duration-300">
        {children}
      </main>

      {/* Footer - Hidden during print */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-6 px-6 text-center text-xs text-slate-500 dark:text-slate-600 no-print transition-colors duration-300">
        <p>&copy; {new Date().getFullYear()} Ultimate Habit Tracker. Precision Productivity Built for Power Users.</p>
      </footer>
    </div>
  );
};

export default Layout;
