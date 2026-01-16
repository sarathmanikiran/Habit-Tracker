
import React, { useState, useEffect, useMemo } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, 
  BarChart, Bar, 
  RadialBarChart, RadialBar, Legend, Cell, PieChart, Pie
} from 'recharts';
import { Habit, HabitEntry, User } from '../types';
import { storageService } from '../services/storageService';
import { 
  getDaysInMonth, 
  formatDate, 
  calculateDashboardStats, 
  getDailyStats, 
  getWeeklyStats,
  getHabitRanking,
  calculateStreaks
} from '../utils/habitUtils';
import { MONTHS, HABIT_COLORS } from '../constants';

interface DashboardProps {
  user: User;
}

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [entries, setEntries] = useState<HabitEntry[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // New Habit State
  const [isAddingHabit, setIsAddingHabit] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitColor, setNewHabitColor] = useState(HABIT_COLORS[0].value);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  useEffect(() => {
    loadData();
  }, [user.id]);

  const loadData = () => {
    const userHabits = storageService.getHabits(user.id);
    setHabits(userHabits);
    const hIds = userHabits.map(h => h.id);
    setEntries(storageService.getEntries(hIds));
  };

  const handleToggleEntry = (habitId: string, day: number) => {
    const dateStr = formatDate(year, month, day);
    const result = storageService.toggleEntry(habitId, dateStr);
    
    // Optimistic update
    setEntries(prev => {
      const idx = prev.findIndex(e => e.habitId === habitId && e.date === dateStr);
      if (idx > -1) {
        const newEntries = [...prev];
        newEntries[idx] = result;
        return newEntries;
      } else {
        return [...prev, result];
      }
    });
  };

  const handleAddHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitName.trim()) return;

    const newHabit: Habit = {
      id: Math.random().toString(36).substr(2, 9),
      userId: user.id,
      name: newHabitName,
      color: newHabitColor,
      monthlyGoal: getDaysInMonth(year, month) // default to daily
    };

    storageService.saveHabit(newHabit);
    setHabits(prev => [...prev, newHabit]);
    setNewHabitName('');
    setIsAddingHabit(false);
  };

  const handleDeleteHabit = (id: string) => {
    if (confirm('Are you sure you want to delete this habit and all its data?')) {
      storageService.deleteHabit(id);
      setHabits(prev => prev.filter(h => h.id !== id));
      setEntries(prev => prev.filter(e => e.habitId !== id));
    }
  };

  const changeMonth = (offset: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + offset);
    setCurrentDate(newDate);
  };

  // --- Derived Data for Charts ---
  const stats = useMemo(() => 
    calculateDashboardStats(habits, entries, year, month), 
    [habits, entries, year, month]
  );

  const dailyStats = useMemo(() => 
    getDailyStats(habits, entries, year, month), 
    [habits, entries, year, month]
  );

  const weeklyStatsData = useMemo(() => {
    const weeks = getWeeklyStats(habits, entries, year, month);
    // Colorful bars for the weekly chart
    const colors = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899'];
    return weeks.map((count, i) => ({ 
      name: `Week ${i+1}`, 
      count,
      fill: colors[i % colors.length]
    }));
  }, [habits, entries, year, month]);

  const rankings = useMemo(() => 
    getHabitRanking(habits, entries, year, month), 
    [habits, entries, year, month]
  );

  const overallProgressData = [
    { name: 'Completed', value: stats.overallCompletion, fill: '#10b981' },
    { name: 'Remaining', value: 100 - stats.overallCompletion, fill: '#1e293b' }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Dashboard</h2>
          <div className="flex items-center space-x-2 mt-1">
            <h1 className="text-3xl font-black uppercase tracking-tight text-slate-900 dark:text-white">{MONTHS[month]} {year}</h1>
            <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 ml-4">
              <button onClick={() => changeMonth(-1)} className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded-md transition shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <button onClick={() => changeMonth(1)} className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded-md transition shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          </div>
        </div>

        {/* KPI Cards Mini */}
        <div className="flex space-x-6">
           <div className="text-right">
              <p className="text-[10px] font-bold uppercase text-slate-500">Global Streak</p>
              <p className="text-xl font-black text-emerald-500">{stats.currentStreak} <span className="text-xs text-slate-500 font-normal">days</span></p>
           </div>
           <div className="text-right">
              <p className="text-[10px] font-bold uppercase text-slate-500">Volume</p>
              <p className="text-xl font-black text-blue-500">{stats.completedDays} <span className="text-xs text-slate-500 font-normal">reps</span></p>
           </div>
           <div className="text-right">
              <p className="text-[10px] font-bold uppercase text-slate-500">Rate</p>
              <p className="text-xl font-black text-purple-500">{stats.overallCompletion}%</p>
           </div>
        </div>
      </div>

      {/* ROW 1: Charts (Monthly Overview + Overall Progress) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-auto lg:h-80">
        
        {/* Left: Monthly Trend Area Chart */}
        <div className="lg:col-span-8 bg-white dark:bg-[#0f172a] rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
           <div className="flex justify-between items-center mb-4">
             <h3 className="font-bold text-sm uppercase tracking-wide text-slate-900 dark:text-slate-100">Monthly Performance Trend</h3>
             <span className="text-xs font-mono text-slate-500">{stats.overallCompletion}% AVG</span>
           </div>
           <div className="flex-1 w-full min-h-[200px]">
             <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyStats}>
                  <defs>
                    <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.15} />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#64748b', fontSize: 10}} 
                    tickFormatter={(val) => new Date(val).getDate().toString()}
                    interval={2}
                  />
                  <YAxis hide domain={[0, 100]} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc', fontSize: '12px', borderRadius: '8px' }}
                    itemStyle={{ color: '#10b981' }}
                    formatter={(value: number) => [`${value}%`, 'Completion']}
                    labelFormatter={(label) => new Date(label).toLocaleDateString(undefined, {weekday: 'long', month: 'short', day: 'numeric'})}
                  />
                  <Area type="monotone" dataKey="completionRate" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRate)" />
                </AreaChart>
             </ResponsiveContainer>
           </div>
        </div>

        {/* Right: Overall Progress Donut */}
        <div className="lg:col-span-4 bg-white dark:bg-[#0f172a] rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center relative">
           <h3 className="absolute top-6 left-6 font-bold text-sm uppercase tracking-wide text-slate-900 dark:text-slate-100">Overall Progress</h3>
           <div className="w-full h-48 relative flex items-center justify-center mt-4">
              <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                    <Pie
                       data={overallProgressData}
                       innerRadius={60}
                       outerRadius={80}
                       startAngle={90}
                       endAngle={-270}
                       paddingAngle={0}
                       dataKey="value"
                       stroke="none"
                    >
                      {overallProgressData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                 </PieChart>
              </ResponsiveContainer>
              {/* Center Text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                 <span className="text-3xl font-black text-slate-900 dark:text-white">{stats.overallCompletion}%</span>
                 <span className="text-[10px] uppercase font-bold text-slate-500">Efficiency</span>
              </div>
           </div>
           <div className="w-full mt-4 grid grid-cols-2 gap-2 text-center">
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded p-2">
                 <div className="text-[10px] text-slate-500 uppercase">Completed</div>
                 <div className="text-lg font-bold text-emerald-500">{stats.completedDays}</div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded p-2">
                 <div className="text-[10px] text-slate-500 uppercase">Habits</div>
                 <div className="text-lg font-bold text-slate-400">{habits.length}</div>
              </div>
           </div>
        </div>
      </div>

      {/* ROW 2: Bar Chart & Ranking */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
         
         {/* Left: Weekly Overview Bar Chart */}
         <div className="lg:col-span-8 bg-white dark:bg-[#0f172a] rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex justify-between items-center mb-6">
               <h3 className="font-bold text-sm uppercase tracking-wide text-slate-900 dark:text-slate-100">Weekly Overview</h3>
               <div className="flex space-x-2">
                  {['W1', 'W2', 'W3', 'W4', 'W5'].map((w, i) => (
                     <div key={w} className="flex items-center space-x-1">
                        <div className="w-2 h-2 rounded-full" style={{backgroundColor: ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899'][i]}}></div>
                        <span className="text-[10px] text-slate-500">{w}</span>
                     </div>
                  ))}
               </div>
            </div>
            <div className="h-48 w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyStatsData} barSize={40}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.15} />
                     <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                     <RechartsTooltip 
                        cursor={{fill: '#334155', opacity: 0.1}}
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc', fontSize: '12px', borderRadius: '8px' }}
                     />
                     <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {weeklyStatsData.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                     </Bar>
                  </BarChart>
               </ResponsiveContainer>
            </div>
         </div>

         {/* Right: Top Habits Ranking */}
         <div className="lg:col-span-4 bg-white dark:bg-[#0f172a] rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
            <h3 className="font-bold text-sm uppercase tracking-wide text-slate-900 dark:text-slate-100 mb-4">Top 5 Habits</h3>
            <div className="flex-1 overflow-y-auto pr-1 space-y-4">
               {rankings.slice(0, 5).map((habit, i) => {
                  const pct = Math.round((habit.count / daysInMonth) * 100);
                  return (
                     <div key={habit.id} className="group">
                        <div className="flex justify-between items-end mb-1">
                           <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">{i+1}. {habit.name}</span>
                           <span className="text-xs font-mono text-slate-500">{pct}%</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                           <div 
                              className="h-full rounded-full transition-all duration-500" 
                              style={{ width: `${pct}%`, backgroundColor: habit.color }}
                           ></div>
                        </div>
                     </div>
                  );
               })}
               {rankings.length === 0 && <p className="text-xs text-slate-500 italic">No data available.</p>}
            </div>
         </div>
      </div>

      {/* ROW 3: Monthly Tracking Grid */}
      <div className="bg-white dark:bg-[#0f172a] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
         <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
               <h3 className="font-bold text-lg text-slate-900 dark:text-white">Daily Habits</h3>
               <p className="text-xs text-slate-500">Track your daily protocols</p>
            </div>
            <button 
                 onClick={() => setIsAddingHabit(true)}
                 className="flex items-center space-x-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded-lg shadow-lg shadow-emerald-600/20 transition"
               >
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                   <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                 </svg>
                 <span>ADD NEW HABIT</span>
               </button>
         </div>

         {/* Add Form */}
         {isAddingHabit && (
            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
               <form onSubmit={handleAddHabit} className="flex flex-col md:flex-row gap-4 items-end">
                 <div className="flex-1 w-full">
                   <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Habit Name</label>
                   <input 
                     autoFocus
                     type="text" 
                     value={newHabitName}
                     onChange={e => setNewHabitName(e.target.value)}
                     className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                     placeholder="e.g. Morning Run"
                   />
                 </div>
                 <div>
                   <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Color</label>
                   <div className="flex space-x-1">
                     {HABIT_COLORS.map(c => (
                       <button
                         key={c.value}
                         type="button"
                         onClick={() => setNewHabitColor(c.value)}
                         className={`w-8 h-8 rounded-md transition-transform hover:scale-110 ${newHabitColor === c.value ? 'ring-2 ring-offset-2 ring-slate-400 dark:ring-slate-500 scale-110' : ''}`}
                         style={{ backgroundColor: c.value }}
                       />
                     ))}
                   </div>
                 </div>
                 <div className="flex space-x-2">
                    <button type="button" onClick={() => setIsAddingHabit(false)} className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 uppercase">Cancel</button>
                    <button type="submit" className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase rounded shadow-lg">Save</button>
                 </div>
               </form>
            </div>
         )}

         {/* Grid Body */}
         <div className="flex-1 overflow-x-auto">
            <div className="min-w-[1000px] p-4">
               {/* Header Row */}
               <div className="flex mb-2">
                  <div className="w-64 flex-shrink-0 flex items-end justify-between pr-4 pb-2 border-r border-slate-200 dark:border-slate-800">
                     <span className="text-[10px] font-bold uppercase text-slate-400">Habit Name</span>
                     <span className="text-[10px] font-bold uppercase text-slate-400 mr-2">Stats</span>
                  </div>
                  <div className="flex-1 flex justify-between px-2">
                     {daysArray.map(d => (
                       <div key={d} className={`w-8 text-center text-[9px] font-mono mb-1 ${new Date().getDate() === d && year === new Date().getFullYear() && month === new Date().getMonth() ? 'text-emerald-500 font-black underline underline-offset-4 decoration-2' : 'text-slate-500'}`}>
                         {d}
                       </div>
                     ))}
                  </div>
               </div>

               {/* Habit Rows */}
               {habits.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 text-sm">Start tracking by adding a habit above.</div>
               ) : (
                  habits.map(habit => {
                    // Calculate individual streak for this habit
                    const habitEntries = entries.filter(e => e.habitId === habit.id && e.completed).map(e => e.date);
                    const { currentStreak, bestStreak } = calculateStreaks(habitEntries);

                    return (
                     <div key={habit.id} className="flex items-center mb-1 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-lg transition-colors py-1 group/row">
                        {/* Name Col */}
                        <div className="w-64 flex-shrink-0 flex items-center justify-between pr-4 border-r border-slate-200 dark:border-slate-800 h-10">
                           <div className="flex items-center space-x-3 pl-2 overflow-hidden">
                              <div className="w-2 h-8 rounded-sm shrink-0" style={{ backgroundColor: habit.color }}></div>
                              <div className="flex flex-col min-w-0">
                                <span className="font-bold text-xs text-slate-700 dark:text-slate-300 truncate">{habit.name}</span>
                                <div className="flex items-center space-x-2 mt-0.5">
                                   <span className="text-[9px] font-bold text-emerald-500 flex items-center" title="Current Streak">
                                      🔥 {currentStreak}
                                   </span>
                                   <span className="text-[9px] text-slate-400 flex items-center" title="Best Streak">
                                      🏆 {bestStreak}
                                   </span>
                                </div>
                              </div>
                           </div>
                           
                           <button onClick={() => handleDeleteHabit(habit.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover/row:opacity-100 transition-opacity">
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                                <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
                              </svg>
                           </button>
                        </div>

                        {/* Checkboxes Grid */}
                        <div className="flex-1 flex justify-between px-2">
                           {daysArray.map(d => {
                              const dateStr = formatDate(year, month, d);
                              const isCompleted = entries.some(e => e.habitId === habit.id && e.date === dateStr && e.completed);
                              return (
                                 <button
                                    key={d}
                                    onClick={() => handleToggleEntry(habit.id, d)}
                                    className="w-8 h-8 flex items-center justify-center rounded transition-all duration-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 group/cell"
                                 >
                                    <div 
                                       className={`w-5 h-5 rounded border transition-all duration-200 flex items-center justify-center ${
                                          isCompleted 
                                          ? 'scale-100 border-transparent shadow-sm' 
                                          : 'scale-95 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 group-hover/cell:border-slate-300 dark:group-hover/cell:border-slate-600'
                                       }`}
                                       style={{ 
                                          backgroundColor: isCompleted ? habit.color : undefined,
                                          boxShadow: isCompleted ? `0 4px 6px -1px ${habit.color}33, 0 2px 4px -2px ${habit.color}33` : undefined
                                       }}
                                    >
                                       {isCompleted ? (
                                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                                             <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                          </svg>
                                       ) : (
                                          <div className="w-1 h-1 rounded-full bg-slate-100 dark:bg-slate-800 group-hover/cell:bg-slate-200 dark:group-hover/cell:bg-slate-700 transition-colors"></div>
                                       )}
                                    </div>
                                 </button>
                              );
                           })}
                        </div>
                     </div>
                  );
                })
               )}
            </div>
         </div>
      </div>
    </div>
  );
};

export default Dashboard;
