import axios from 'axios';
import { DeviceProfile, Slot, HabitSegment, HabitEntry } from '../types';

// API Configuration
const API_URL = 'http://localhost:5000/api';

const client = axios.create({
  baseURL: API_URL,
  timeout: 500, // Short timeout to quickly fallback to offline mode if backend is missing
});

// --- OFFLINE STORAGE HELPERS ---

const STORAGE_KEYS = {
  DEVICE: 'habit_device_profile',
  SLOTS: 'habit_slots',
  SEGMENTS: 'habit_segments',
  ENTRIES: 'habit_entries'
};

const getLocal = <T>(key: string): T[] => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

const setLocal = (key: string, data: any) => {
  localStorage.setItem(key, JSON.stringify(data));
};

// UUID Generator Fallback
const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'id-' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
};

// Simulate minimal network delay for realistic feel in offline mode
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

// Helper for streak
const getPreviousDate = (dateStr: string) => {
  const d = new Date(dateStr);
  d.setDate(d.getDate() - 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getDeviceId = (): string => {
  let id = localStorage.getItem('habit_device_id');
  if (!id) {
    id = generateId();
    localStorage.setItem('habit_device_id', id);
  }
  return id;
};

// --- API METHODS WITH HYBRID FALLBACK ---

export const registerDevice = async (username: string) => {
  const deviceId = getDeviceId();
  try {
    return await client.post('/device/create', { deviceId, username });
  } catch (err) {
    console.warn("API unreachable, switching to offline mode.");
    const profile = { deviceId, username, createdAt: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEYS.DEVICE, JSON.stringify(profile));
    await delay(100);
    return { data: profile };
  }
};

export const getDeviceProfile = async () => {
  const deviceId = getDeviceId();
  try {
    return await client.get<DeviceProfile>(`/device/${deviceId}`);
  } catch (err) {
    const data = localStorage.getItem(STORAGE_KEYS.DEVICE);
    const profile = data ? JSON.parse(data) : null;
    return { data: profile };
  }
};

// Slots
export const getSlots = async () => {
  const deviceId = getDeviceId();
  try {
    return await client.get<Slot[]>(`/slots/${deviceId}`);
  } catch (err) {
    const slots = getLocal<Slot>(STORAGE_KEYS.SLOTS).filter(s => s.deviceId === deviceId);
    return { data: slots.sort((a, b) => a.order - b.order) };
  }
};

export const createSlot = async (time: string, order: number) => {
  const deviceId = getDeviceId();
  try {
    return await client.post<Slot>('/slots', { deviceId, time, order });
  } catch (err) {
    const slots = getLocal<Slot>(STORAGE_KEYS.SLOTS);
    const newSlot = { _id: generateId(), deviceId, time, order };
    slots.push(newSlot);
    setLocal(STORAGE_KEYS.SLOTS, slots);
    return { data: newSlot };
  }
};

export const reorderSlots = async (slots: Slot[]) => {
  try {
    return await client.put('/slots/reorder', { slots });
  } catch (err) {
    const allSlots = getLocal<Slot>(STORAGE_KEYS.SLOTS);
    
    // Update orders in local storage
    const updatedSlots = allSlots.map(s => {
      const match = slots.find(u => u._id === s._id);
      return match ? { ...s, order: match.order } : s;
    });
    
    setLocal(STORAGE_KEYS.SLOTS, updatedSlots);
    return { data: { success: true } };
  }
};

export const deleteSlot = async (id: string) => {
  try {
    return await client.delete(`/slots/${id}`);
  } catch (err) {
    const slots = getLocal<Slot>(STORAGE_KEYS.SLOTS).filter(s => s._id !== id);
    setLocal(STORAGE_KEYS.SLOTS, slots);
    
    // Cleanup segments
    const segments = getLocal<HabitSegment>(STORAGE_KEYS.SEGMENTS).filter(s => s.slotId !== id);
    setLocal(STORAGE_KEYS.SEGMENTS, segments);
    
    // Entries cleanup skipped for offline mock simplicity
    return { data: { success: true } };
  }
};

// Segments
export const getSegments = async (month: string) => {
  const deviceId = getDeviceId();
  try {
    return await client.get<HabitSegment[]>(`/segments/${deviceId}?month=${month}`);
  } catch (err) {
    const segments = getLocal<HabitSegment>(STORAGE_KEYS.SEGMENTS).filter(s => s.deviceId === deviceId);
    
    // Calculate correct end of month
    const [y, m] = month.split('-').map(Number);
    const daysInMonth = new Date(y, m, 0).getDate();
    
    const startOfMonth = `${month}-01`;
    const endOfMonth = `${month}-${daysInMonth}`;
    
    const filtered = segments.filter(s => {
       const startsBeforeEnd = s.startDate <= endOfMonth;
       const endsAfterStart = s.endDate === null || s.endDate >= startOfMonth;
       return startsBeforeEnd && endsAfterStart;
    });

    return { data: filtered };
  }
};

export const createSegment = async (slotId: string, name: string, color: string, startDate: string) => {
  const deviceId = getDeviceId();
  try {
    return await client.post<HabitSegment>('/segments', { deviceId, slotId, name, color, startDate });
  } catch (err) {
    const segments = getLocal<HabitSegment>(STORAGE_KEYS.SEGMENTS);
    
    // Close existing active segment for this slot
    const existingIndex = segments.findIndex(s => s.deviceId === deviceId && s.slotId === slotId && s.endDate === null);
    if (existingIndex !== -1) {
        const d = new Date(startDate);
        d.setDate(d.getDate() - 1);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        segments[existingIndex].endDate = `${year}-${month}-${day}`;
    }

    const newSegment = { _id: generateId(), deviceId, slotId, name, color, startDate, endDate: null, streak: 0, lastCompletedDate: null };
    segments.push(newSegment);
    setLocal(STORAGE_KEYS.SEGMENTS, segments);
    return { data: newSegment };
  }
};

export const updateSegment = async (id: string, name: string, color: string) => {
  try {
    return await client.put<HabitSegment>(`/segments/${id}`, { name, color });
  } catch (err) {
    const segments = getLocal<HabitSegment>(STORAGE_KEYS.SEGMENTS);
    const index = segments.findIndex(s => s._id === id);
    if (index !== -1) {
      segments[index] = { ...segments[index], name, color };
      setLocal(STORAGE_KEYS.SEGMENTS, segments);
      return { data: segments[index] };
    }
    throw new Error('Segment not found locally');
  }
};

export const deleteSegment = async (id: string) => {
  try {
    return await client.delete(`/segments/${id}`);
  } catch (err) {
    const segments = getLocal<HabitSegment>(STORAGE_KEYS.SEGMENTS).filter(s => s._id !== id);
    setLocal(STORAGE_KEYS.SEGMENTS, segments);
    
    // Remove entries
    const entries = getLocal<HabitEntry>(STORAGE_KEYS.ENTRIES).filter(e => e.segmentId !== id);
    setLocal(STORAGE_KEYS.ENTRIES, entries);
    
    return { data: { success: true } };
  }
};

// Entries
export const getEntries = async (month: string) => {
  const deviceId = getDeviceId();
  try {
    return await client.get<HabitEntry[]>(`/entries/${deviceId}?month=${month}`);
  } catch (err) {
    const entries = getLocal<HabitEntry>(STORAGE_KEYS.ENTRIES)
      .filter(e => e.deviceId === deviceId && e.date.startsWith(month));
    return { data: entries };
  }
};

export const toggleEntry = async (segmentId: string, date: string, completed: boolean) => {
  const deviceId = getDeviceId();
  try {
    return await client.post('/entries/toggle', { deviceId, segmentId, date, completed });
  } catch (err) {
    const entries = getLocal<HabitEntry>(STORAGE_KEYS.ENTRIES);
    const index = entries.findIndex(e => e.segmentId === segmentId && e.date === date);
    
    let entry;
    if (index !== -1) {
        entries[index].completed = completed;
        entry = entries[index];
    } else {
        entry = { _id: generateId(), deviceId, segmentId, date, completed };
        entries.push(entry);
    }
    setLocal(STORAGE_KEYS.ENTRIES, entries);

    // Calculate Streak
    const segmentEntries = entries
        .filter(e => e.segmentId === segmentId && e.completed)
        .sort((a, b) => b.date.localeCompare(a.date));
    
    let streak = 0;
    let lastCompletedDate = null;
    
    if (segmentEntries.length > 0) {
        lastCompletedDate = segmentEntries[0].date;
        streak = 1;
        let currentDate = lastCompletedDate;
        for (let i = 1; i < segmentEntries.length; i++) {
            const prev = getPreviousDate(currentDate);
            if (segmentEntries[i].date === prev) {
                streak++;
                currentDate = prev;
            } else {
                break;
            }
        }
    }

    // Update Segment in storage
    const segments = getLocal<HabitSegment>(STORAGE_KEYS.SEGMENTS);
    const segIndex = segments.findIndex(s => s._id === segmentId);
    if (segIndex !== -1) {
        segments[segIndex].streak = streak;
        segments[segIndex].lastCompletedDate = lastCompletedDate;
        setLocal(STORAGE_KEYS.SEGMENTS, segments);
    }

    return { data: { entry, streak, lastCompletedDate } };
  }
};