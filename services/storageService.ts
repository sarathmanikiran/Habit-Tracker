
import { Habit, HabitEntry, User } from '../types';

const STORAGE_KEYS = {
  USER: 'uht_user', // Current active session
  USERS_REGISTRY: 'uht_users_registry', // All registered users { [email]: User }
  HABITS: 'uht_habits',
  ENTRIES: 'uht_entries',
};

export const storageService = {
  // --- Auth & Session Management ---
  getUser: (): User | null => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USER);
      if (!data) return null;

      const user = JSON.parse(data);
      // Basic validation to ensure the session object is valid
      if (user && user.id && user.email) {
        return user;
      }
      
      // If data exists but is invalid structure, clear it
      localStorage.removeItem(STORAGE_KEYS.USER);
      return null;
    } catch (e) {
      console.error("Failed to load user session", e);
      // Clear corrupted session data
      localStorage.removeItem(STORAGE_KEYS.USER);
      return null;
    }
  },

  setUserSession: (user: User | null) => {
    if (user) localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    else localStorage.removeItem(STORAGE_KEYS.USER);
  },

  // Login: Only succeeds if user exists. Automatically persists session.
  loginUser: (email: string): User | null => {
    try {
      const registryRaw = localStorage.getItem(STORAGE_KEYS.USERS_REGISTRY);
      const registry: Record<string, User> = registryRaw ? JSON.parse(registryRaw) : {};
      const normalizedEmail = email.toLowerCase().trim();
      
      if (registry[normalizedEmail]) {
        const user = registry[normalizedEmail];
        // Persist session immediately so app stays logged in on refresh
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
        return user;
      }
      return null;
    } catch (e) {
      console.error("Login failed due to storage error", e);
      return null;
    }
  },

  // Register: Creates or returns existing. Automatically persists session.
  registerUser: (name: string, email: string): User => {
    try {
      const registryRaw = localStorage.getItem(STORAGE_KEYS.USERS_REGISTRY);
      const registry: Record<string, User> = registryRaw ? JSON.parse(registryRaw) : {};
      const normalizedEmail = email.toLowerCase().trim();

      let user: User;

      if (registry[normalizedEmail]) {
        // User exists, return their profile
        user = registry[normalizedEmail];
      } else {
        // Create new user
        user = {
          id: Math.random().toString(36).substr(2, 9),
          name,
          email: normalizedEmail
        };
        registry[normalizedEmail] = user;
        localStorage.setItem(STORAGE_KEYS.USERS_REGISTRY, JSON.stringify(registry));
      }

      // Persist session immediately
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      return user;

    } catch (e) {
      console.error("Registration failed", e);
      // Fallback for critical error
      return { id: 'temp', name, email };
    }
  },

  // --- Data Management ---
  getHabits: (userId: string): Habit[] => {
    const data = localStorage.getItem(STORAGE_KEYS.HABITS);
    const habits: Habit[] = data ? JSON.parse(data) : [];
    return habits.filter(h => h.userId === userId);
  },

  saveHabit: (habit: Habit) => {
    const data = localStorage.getItem(STORAGE_KEYS.HABITS);
    const habits: Habit[] = data ? JSON.parse(data) : [];
    
    const existingIdx = habits.findIndex(h => h.id === habit.id);
    if (existingIdx > -1) {
      habits[existingIdx] = habit;
    } else {
      habits.push(habit);
    }
    
    localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(habits));
  },

  deleteHabit: (id: string) => {
    const data = localStorage.getItem(STORAGE_KEYS.HABITS);
    if (!data) return;
    
    const habits: Habit[] = JSON.parse(data);
    const newHabits = habits.filter(h => h.id !== id);
    localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(newHabits));

    // Cleanup entries for this habit
    const entriesData = localStorage.getItem(STORAGE_KEYS.ENTRIES);
    if (entriesData) {
      const entries: HabitEntry[] = JSON.parse(entriesData);
      const newEntries = entries.filter(e => e.habitId !== id);
      localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(newEntries));
    }
  },

  getEntries: (habitIds: string[]): HabitEntry[] => {
    const data = localStorage.getItem(STORAGE_KEYS.ENTRIES);
    const entries: HabitEntry[] = data ? JSON.parse(data) : [];
    return entries.filter(e => habitIds.includes(e.habitId));
  },

  toggleEntry: (habitId: string, date: string): HabitEntry => {
    const data = localStorage.getItem(STORAGE_KEYS.ENTRIES);
    const entries: HabitEntry[] = data ? JSON.parse(data) : [];
    
    const existingIndex = entries.findIndex(e => e.habitId === habitId && e.date === date);
    let result: HabitEntry;

    if (existingIndex > -1) {
      // Toggle existing
      entries[existingIndex].completed = !entries[existingIndex].completed;
      result = entries[existingIndex];
    } else {
      // Create new
      result = {
        id: Math.random().toString(36).substr(2, 9),
        habitId,
        date,
        completed: true
      };
      entries.push(result);
    }
    
    localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(entries));
    return result;
  }
};
