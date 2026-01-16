
import React, { useState } from 'react';

interface SignupPageProps {
  onSignup: (name: string, email: string) => void;
  onToggle: () => void;
}

const SignupPage: React.FC<SignupPageProps> = ({ onSignup, onToggle }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && email && password) {
      onSignup(name, email);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#020617] p-4 transition-colors duration-300">
      <div className="w-full max-w-md bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-8 text-center border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-900 dark:text-white">Initialize Profile</h2>
          <p className="text-slate-500 text-sm font-medium">Start your performance tracking journey</p>
        </div>
        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Display Name</label>
            <input 
              required
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-3 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 transition-colors"
              placeholder="Your Name"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Identification (Email)</label>
            <input 
              required
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-3 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 transition-colors"
              placeholder="user@protocol.net"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Security Key (Password)</label>
            <input 
              required
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-3 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 transition-colors"
              placeholder="••••••••"
            />
          </div>
          <button 
            type="submit"
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-black uppercase tracking-widest transition shadow-lg shadow-emerald-600/20"
          >
            Create Protocol Profile
          </button>
        </form>
        <div className="p-6 bg-slate-50 dark:bg-slate-900/30 text-center border-t border-slate-200 dark:border-slate-800">
          <p className="text-xs text-slate-500">
            Already registered? <button onClick={onToggle} className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline">Log In</button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
