
import { Habit, HabitEntry, DailyStats, DashboardStats } from '../types';

export const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month + 1, 0).getDate();
};

export const formatDate = (year: number, month: number, day: number) => {
  const m = (month + 1).toString().padStart(2, '0');
  const d = day.toString().padStart(2, '0');
  return `${year}-${m}-${d}`;
};

export const calculateDashboardStats = (habits: Habit[], entries: HabitEntry[], year: number, month: number): DashboardStats => {
  if (habits.length === 0) return { totalHabits: 0, overallCompletion: 0, currentStreak: 0, bestStreak: 0, completedDays: 0 };

  const daysInMonth = getDaysInMonth(year, month);
  const totalPossible = habits.length * daysInMonth;
  
  // Timezone safe filtering: Match YYYY-MM string prefix
  const mStr = (month + 1).toString().padStart(2, '0');
  const monthPrefix = `${year}-${mStr}`;
  
  const currentMonthEntries = entries.filter(e => e.date.startsWith(monthPrefix) && e.completed);
  const totalCompleted = currentMonthEntries.length;

  const overallCompletion = totalPossible > 0 ? (totalCompleted / totalPossible) * 100 : 0;

  // Streak Calculation
  // Get all unique completed dates across all time, sorted
  const allCompletedDates = Array.from(new Set(entries.filter(e => e.completed).map(e => e.date))).sort();
  
  let currentStreak = 0;
  let bestStreak = 0;
  let tempStreak = 0;
  let lastDateStr = '';

  allCompletedDates.forEach(dateStr => {
    if (!lastDateStr) {
      tempStreak = 1;
    } else {
      // Calculate diff in days between strings YYYY-MM-DD safely
      const d1 = new Date(lastDateStr);
      const d2 = new Date(dateStr);
      const diffTime = Math.abs(d2.getTime() - d1.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      
      if (diffDays === 1) {
        tempStreak++;
      } else {
        tempStreak = 1;
      }
    }
    lastDateStr = dateStr;
    if (tempStreak > bestStreak) bestStreak = tempStreak;
  });

  // Check if current streak is active (today or yesterday was completed)
  const todayStr = new Date().toISOString().split('T')[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  if (allCompletedDates.includes(todayStr) || allCompletedDates.includes(yesterdayStr)) {
    currentStreak = tempStreak;
  } else {
    currentStreak = 0;
  }

  return {
    totalHabits: habits.length,
    overallCompletion: Math.round(overallCompletion),
    currentStreak,
    bestStreak,
    completedDays: totalCompleted
  };
};

export const getDailyStats = (habits: Habit[], entries: HabitEntry[], year: number, month: number): DailyStats[] => {
  const daysInMonth = getDaysInMonth(year, month);
  const stats: DailyStats[] = [];
  
  const mStr = (month + 1).toString().padStart(2, '0');

  for (let i = 1; i <= daysInMonth; i++) {
    const dStr = i.toString().padStart(2, '0');
    const dateStr = `${year}-${mStr}-${dStr}`;
    
    // Simple string match avoids timezone conversions
    const dayEntries = entries.filter(e => e.date === dateStr && e.completed);
    const completionRate = habits.length > 0 ? (dayEntries.length / habits.length) * 100 : 0;
    stats.push({ date: dateStr, completionRate: Math.round(completionRate) });
  }

  return stats;
};

export const getWeeklyStats = (habits: Habit[], entries: HabitEntry[], year: number, month: number) => {
  const weeks = [0, 0, 0, 0, 0];
  const mStr = (month + 1).toString().padStart(2, '0');
  const monthPrefix = `${year}-${mStr}`;

  entries.forEach(e => {
    if (!e.completed) return;
    if (!e.date.startsWith(monthPrefix)) return;
    
    const parts = e.date.split('-');
    if (parts.length === 3) {
        const dayPart = parseInt(parts[2], 10);
        if (dayPart <= 7) weeks[0]++;
        else if (dayPart <= 14) weeks[1]++;
        else if (dayPart <= 21) weeks[2]++;
        else if (dayPart <= 28) weeks[3]++;
        else weeks[4]++;
    }
  });
  return weeks;
};

export const getHabitRanking = (habits: Habit[], entries: HabitEntry[], year: number, month: number) => {
  const mStr = (month + 1).toString().padStart(2, '0');
  const monthPrefix = `${year}-${mStr}`;

  return habits.map(h => {
    // Only count entries for the current displayed month
    const count = entries.filter(e => e.habitId === h.id && e.completed && e.date.startsWith(monthPrefix)).length;
    return { 
      id: h.id, 
      name: h.name, 
      count, 
      color: h.color,
      monthlyGoal: h.monthlyGoal 
    };
  }).sort((a, b) => b.count - a.count);
};
