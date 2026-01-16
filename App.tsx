
import React, { useState, useEffect } from 'react';
import { User, Habit } from './types';
import { storageService } from './services/storageService';
import { ThemeProvider } from './contexts/ThemeContext';
import Layout from './components/Layout';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import PrintableTracker from './components/PrintableTracker';
import LoginPage from './components/Auth/LoginPage';
import SignupPage from './components/Auth/SignupPage';

type Page = 'landing' | 'login' | 'signup' | 'dashboard' | 'printable';

const AppContent: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState<Page>('landing');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const savedUser = storageService.getUser();
    if (savedUser) {
      setUser(savedUser);
      setCurrentPage('dashboard');
    }
    setIsLoading(false);
  }, []);

  const handleLogin = (email: string) => {
    const authenticatedUser = storageService.loginUser(email);
    if (authenticatedUser) {
      storageService.setUserSession(authenticatedUser);
      setUser(authenticatedUser);
      setCurrentPage('dashboard');
    } else {
      alert("User not found. Please register first.");
    }
  };

  const handleSignup = (name: string, email: string) => {
    const newUser = storageService.registerUser(name, email);
    storageService.setUserSession(newUser);
    setUser(newUser);
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    storageService.setUserSession(null);
    setUser(null);
    setCurrentPage('landing');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#020617] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Auth/Landing Flows
  if (!user) {
    if (currentPage === 'login') return <LoginPage onLogin={handleLogin} onToggle={() => setCurrentPage('signup')} />;
    if (currentPage === 'signup') return <SignupPage onSignup={handleSignup} onToggle={() => setCurrentPage('login')} />;
    return <LandingPage onStart={() => setCurrentPage('signup')} />;
  }

  // Dashboard Flow
  const habits = storageService.getHabits(user.id);

  return (
    <Layout 
      user={user} 
      onLogout={handleLogout} 
      currentPage={currentPage} 
      onPageChange={(page) => setCurrentPage(page as Page)}
    >
      {currentPage === 'dashboard' && <Dashboard user={user} />}
      {currentPage === 'printable' && <PrintableTracker user={user} habits={habits} />}
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
};

export default App;
