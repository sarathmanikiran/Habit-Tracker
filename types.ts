
export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Habit {
  id: string;
  userId: string;
  name: string;
  color: string;
  monthlyGoal: number;
}

export interface HabitEntry {
  id: string;
  habitId: string;
  date: string; // ISO string YYYY-MM-DD
  completed: boolean;
}

export interface DailyStats {
  date: string;
  completionRate: number;
}

export interface DashboardStats {
  totalHabits: number;
  overallCompletion: number;
  currentStreak: number;
  bestStreak: number;
  completedDays: number;
}
