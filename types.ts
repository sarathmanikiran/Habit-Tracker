export interface DeviceProfile {
  deviceId: string;
  username: string;
  createdAt: string;
}

export interface Slot {
  _id: string;
  deviceId: string;
  time: string;
  order: number;
}

export interface HabitSegment {
  _id: string;
  deviceId: string;
  slotId: string;
  name: string;
  color: string;
  startDate: string; // ISO Date string
  endDate: string | null;
  streak?: number;
  lastCompletedDate?: string | null;
}

export interface HabitEntry {
  _id: string;
  deviceId: string;
  segmentId: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
}

export interface AnalyticsData {
  dailyCompletion: { date: string; value: number }[];
  overallEfficiency: number;
  weeklyProgress: { week: number; value: number }[];
  topHabits: { name: string; rate: number }[];
}

export const COLORS = [
  '#3B82F6', // Blue
  '#22C55E', // Green
  '#8B5CF6', // Purple
  '#F59E0B', // Orange
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#F43F5E', // Rose
];