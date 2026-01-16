
import { Habit, HabitEntry, DailyStats, DashboardStats } from '../types';

export const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month + 1, 0).getDate();
};

export const formatDate = (year: number, month: number, day: number) => {
  const m = (month + 1).toString().padStart(2, '0');
  const d = day.toString().padStart(2, '0');
  return `${year}-${m}-${d}`;
};

// Helper to get Today and Yesterday in YYYY-MM-DD format based on Local Time
const getReferenceDates = () => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  return {
    todayStr: formatDate(today.getFullYear(), today.getMonth(), today.getDate()),
    yesterdayStr: formatDate(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate())
  };
};

export const calculateStreaks = (dates: string[]) => {
  const sortedDates = Array.from(new Set(dates)).sort();
  const { todayStr, yesterdayStr } = getReferenceDates();

  // 1. Calculate Best Streak
  let bestStreak = 0;
  let tempStreak = 0;
  let lastDateStr = '';

  sortedDates.forEach(dateStr => {
    if (!lastDateStr) {
      tempStreak = 1;
    } else {
      const d1 = new Date(lastDateStr);
      const d2 = new Date(dateStr);
      // Diff in ms -> days
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

  // 2. Calculate Current Streak
  let currentStreak = 0;
  
  // Check if the streak is alive (completed today OR yesterday)
  const isAlive = sortedDates.includes(todayStr) || sortedDates.includes(yesterdayStr);
  
  if (isAlive) {
    // Start counting backwards from today or yesterday
    let checkDate = new Date();
    // If we haven't done it today yet, start checking from yesterday
    if (!sortedDates.includes(todayStr)) {
      checkDate.setDate(checkDate.getDate() - 1);
    }

    while (true) {
      const checkStr = formatDate(checkDate.getFullYear(), checkDate.getMonth(), checkDate.getDate());
      if (sortedDates.includes(checkStr)) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
  }

  return { currentStreak, bestStreak };
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

  // Global Streak Calculation (Any habit completed counts towards global streak)
  const allCompletedDates = entries.filter(e => e.completed).map(e => e.date);
  const { currentStreak, bestStreak } = calculateStreaks(allCompletedDates);

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
