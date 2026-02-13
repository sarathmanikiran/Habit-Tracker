import React, { useState, useEffect, useMemo, useCallback } from 'react';
import dayjs from 'dayjs';
import { 
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent 
} from '@dnd-kit/core';
import { 
  arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy 
} from '@dnd-kit/sortable';

import * as api from '../services/api';
import * as dateHelpers from '../utils/dateHelpers';
import { Slot, HabitSegment, HabitEntry, DeviceProfile, COLORS } from '../types';

import SlotRow from '../components/SlotRow';
import AnalyticsPanel from '../components/AnalyticsPanel';

const Dashboard: React.FC = () => {
  // State
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [currentDate, setCurrentDate] = useState(dayjs());
  const [profile, setProfile] = useState<DeviceProfile | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [segments, setSegments] = useState<HabitSegment[]>([]);
  const [entries, setEntries] = useState<HabitEntry[]>([]);
  
  // Modals state
  const [showWelcome, setShowWelcome] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');
  const [showAddSlot, setShowAddSlot] = useState(false);
  const [newSlotTime, setNewSlotTime] = useState('08:00');
  
  // Add Segment Modal State
  const [showAddSegment, setShowAddSegment] = useState(false);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [newSegmentName, setNewSegmentName] = useState('');
  const [newSegmentColor, setNewSegmentColor] = useState(COLORS[0]);

  // Edit Segment Modal State
  const [showEditSegment, setShowEditSegment] = useState(false);
  const [editingSegment, setEditingSegment] = useState<HabitSegment | null>(null);

  // DnD Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // --- Initial Load ---
  useEffect(() => {
    const init = async () => {
      try {
        const id = api.getDeviceId();
        const profileRes = await api.getDeviceProfile();
        
        if (!profileRes.data) {
          setShowWelcome(true);
        } else {
          setProfile(profileRes.data);
          loadMonthData();
        }
      } catch (err) {
        console.error("Initialization error", err);
        setShowWelcome(true);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // --- Data Loading ---
  const loadMonthData = useCallback(async () => {
    if (!profile) return;
    try {
      const monthStr = currentDate.format('YYYY-MM');
      const [slotsRes, segmentsRes, entriesRes] = await Promise.all([
        api.getSlots(),
        api.getSegments(monthStr),
        api.getEntries(monthStr)
      ]);
      setSlots(slotsRes.data);
      setSegments(segmentsRes.data);
      setEntries(entriesRes.data);
    } catch (e) {
      console.error("Error loading data", e);
    }
  }, [currentDate, profile]);

  useEffect(() => {
    if (profile) loadMonthData();
  }, [loadMonthData]);

  // --- Handlers ---

  const handleCreateProfile = async () => {
    if (!usernameInput.trim()) return;
    setActionLoading(true);
    try {
      const res = await api.registerDevice(usernameInput);
      setProfile(res.data);
      setShowWelcome(false);
      loadMonthData();
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddSlot = async () => {
    setActionLoading(true);
    try {
      await api.createSlot(newSlotTime, slots.length);
      setShowAddSlot(false);
      loadMonthData();
    } catch (e) { 
        console.error(e); 
    } finally {
        setActionLoading(false);
    }
  };

  const handleDeleteSlot = async (id: string) => {
    if(!window.confirm("Delete this time slot and all its habits?")) return;
    try {
        await api.deleteSlot(id);
        loadMonthData();
    } catch(e) { console.error(e); }
  }

  const handleAddSegment = async () => {
    if (!selectedSlotId || !newSegmentName) return;
    setActionLoading(true);
    try {
      const start = dayjs().isAfter(currentDate.endOf('month')) 
        ? currentDate.startOf('month').format('YYYY-MM-DD') 
        : dayjs().format('YYYY-MM-DD');

      await api.createSegment(selectedSlotId, newSegmentName, newSegmentColor, start);
      setShowAddSegment(false);
      setNewSegmentName('');
      loadMonthData();
    } catch (e) { 
        console.error(e); 
    } finally {
        setActionLoading(false);
    }
  };

  const handleEditSegmentClick = (segment: HabitSegment) => {
    setEditingSegment(segment);
    setNewSegmentName(segment.name);
    setNewSegmentColor(segment.color);
    setShowEditSegment(true);
  };

  const handleSaveSegment = async () => {
    if (!editingSegment || !newSegmentName) return;
    setActionLoading(true);
    try {
      await api.updateSegment(editingSegment._id, newSegmentName, newSegmentColor);
      setShowEditSegment(false);
      loadMonthData();
    } catch(e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteSegmentDirectly = async (segmentId: string) => {
    if(!window.confirm("Are you sure you want to delete this habit? All progress will be lost.")) return;
    try {
        await api.deleteSegment(segmentId);
        loadMonthData();
    } catch (e) { console.error(e); }
  };

  const handleDeleteSegmentFromModal = async () => {
    if (!editingSegment) return;
    if(!window.confirm("Are you sure you want to delete this habit? All progress for this habit will be lost.")) return;
    
    setActionLoading(true);
    try {
      await api.deleteSegment(editingSegment._id);
      setShowEditSegment(false);
      loadMonthData();
    } catch(e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      setSlots((items) => {
        const oldIndex = items.findIndex((i) => i._id === active.id);
        const newIndex = items.findIndex((i) => i._id === over?.id);
        const newOrder = arrayMove(items, oldIndex, newIndex);
        api.reorderSlots(newOrder); // Fire and forget
        return newOrder;
      });
    }
  };

  const handleToggleEntry = useCallback(async (segmentId: string, date: string, currentStatus: boolean) => {
    setEntries(prev => {
      const exists = prev.find(e => e.segmentId === segmentId && e.date === date);
      if (exists) {
        return prev.map(e => e._id === exists._id ? { ...e, completed: !currentStatus } : e);
      }
      return [...prev, { _id: 'temp-' + Date.now(), deviceId: 'temp', segmentId, date, completed: true }];
    });

    try {
      await api.toggleEntry(segmentId, date, !currentStatus);
    } catch (e) {
      console.error(e);
    }
  }, []);

  // --- Calculations ---
  const daysInMonth = useMemo(() => dateHelpers.getDaysInMonth(currentDate), [currentDate]);
  
  const analyticsData = useMemo(() => {
    if (!entries.length && !segments.length) return null;

    const dailyMap = new Map<string, { total: number, completed: number }>();
    daysInMonth.forEach(d => dailyMap.set(d.format('YYYY-MM-DD'), { total: 0, completed: 0 }));

    segments.forEach(seg => {
        daysInMonth.forEach(d => {
            const dStr = d.format('YYYY-MM-DD');
            const isActive = dStr >= seg.startDate && (seg.endDate === null || dStr <= seg.endDate);
            if (isActive) dailyMap.get(dStr)!.total++;
        });
    });

    entries.forEach(entry => {
        if (dailyMap.has(entry.date) && entry.completed) dailyMap.get(entry.date)!.completed++;
    });

    const dailyCompletion = Array.from(dailyMap.entries()).map(([date, stats]) => ({
        date,
        value: stats.total === 0 ? 0 : (stats.completed / stats.total) * 100
    }));

    let totalPossible = 0;
    let totalCompleted = 0;
    dailyMap.forEach(stats => {
        totalPossible += stats.total;
        totalCompleted += stats.completed;
    });
    const overallEfficiency = totalPossible === 0 ? 0 : (totalCompleted / totalPossible) * 100;

    const weeks: { [key: number]: { total: number, completed: number } } = {};
    dailyMap.forEach((stats, date) => {
        const weekNum = Math.ceil(dayjs(date).date() / 7);
        if (!weeks[weekNum]) weeks[weekNum] = { total: 0, completed: 0 };
        weeks[weekNum].total += stats.total;
        weeks[weekNum].completed += stats.completed;
    });
    const weeklyProgress = Object.keys(weeks).map(w => ({
        week: Number(w),
        value: weeks[Number(w)].total === 0 ? 0 : (weeks[Number(w)].completed / weeks[Number(w)].total) * 100
    }));

    const habitStats = segments.map(seg => {
        let segPossible = 0;
        let segCompleted = 0;
        daysInMonth.forEach(d => {
            const dStr = d.format('YYYY-MM-DD');
            const isActive = dStr >= seg.startDate && (seg.endDate === null || dStr <= seg.endDate);
            if (isActive) {
                segPossible++;
                if (entries.some(e => e.segmentId === seg._id && e.date === dStr && e.completed)) {
                    segCompleted++;
                }
            }
        });
        return {
            name: seg.name,
            rate: segPossible === 0 ? 0 : (segCompleted / segPossible) * 100
        };
    }).sort((a, b) => b.rate - a.rate).slice(0, 5);

    return { dailyCompletion, overallEfficiency, weeklyProgress, topHabits: habitStats };

  }, [daysInMonth, entries, segments]);


  // --- Render ---

  if (showWelcome) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-dark flex items-center justify-center p-4">
        <div className="bg-white dark:bg-dark-card p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-100 dark:border-slate-700">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-white text-xl font-bold mb-6">U</div>
          <h1 className="text-2xl font-bold mb-2 text-slate-800 dark:text-white">Ultimate Habit Tracker</h1>
          <p className="text-slate-500 mb-6">Track your daily protocols with intelligence.</p>
          <input 
            className="w-full p-3 border rounded-lg mb-4 bg-slate-50 dark:bg-slate-800 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-primary focus:outline-none"
            placeholder="Enter your name"
            value={usernameInput}
            onChange={e => setUsernameInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreateProfile()}
          />
          <button 
            type="button"
            onClick={handleCreateProfile}
            disabled={actionLoading}
            className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-blue-600 transition shadow-lg shadow-blue-500/30 flex justify-center items-center"
          >
            {actionLoading ? 'Creating...' : 'Start Tracking'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark pb-20 relative">

      {/* Navbar */}
      <nav className="bg-white dark:bg-dark-card border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex justify-between items-center sticky top-0 z-40 no-print shadow-sm">
        <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-md">U</div>
            <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white uppercase">ULTIMATE HABIT TRACKER</span>
        </div>
        <div className="flex items-center gap-4">
           <span className="text-slate-500 hidden sm:inline font-medium">Hi, {profile?.username}</span>
           <button 
             type="button"
             onClick={() => window.print()} 
             className="text-slate-500 hover:text-primary dark:hover:text-primary px-3 py-1.5 text-sm font-medium border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-2"
           >
             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
             </svg>
             <span className="hidden sm:inline">Printable Version</span>
           </button>
           <button 
             type="button"
             onClick={() => document.documentElement.classList.toggle('dark')} 
             className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
           >
             <span className="text-sm">🌗</span>
           </button>
        </div>
      </nav>

      <main className="max-w-[95%] mx-auto px-2 py-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start mb-6 no-print">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Daily Habits</h1>
            <p className="text-slate-500 text-sm mb-4">Track your daily protocols</p>
            
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-bold text-primary uppercase tracking-tight">
                {currentDate.format('MMMM YYYY')}
              </h2>
              <div className="flex gap-1 bg-white dark:bg-dark-card rounded-lg border border-slate-200 dark:border-slate-700 p-1 shadow-sm">
                <button type="button" onClick={() => setCurrentDate(d => d.subtract(1, 'month'))} className="p-1 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-md text-slate-500 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button type="button" onClick={() => setCurrentDate(d => d.add(1, 'month'))} className="p-1 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-md text-slate-500 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          
          <div className="mt-4 md:mt-0 flex gap-2">
             <button 
               type="button"
               onClick={() => setShowAddSlot(true)}
               className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-all flex items-center gap-2"
             >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                ADD NEW HABIT
             </button>
          </div>
        </div>

        {/* --- MAIN GRID (SYNCHRONIZED SCROLL) --- */}
        <div className="mb-12 print-scroll-expand overflow-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-card shadow-sm max-h-[65vh]">
          <div className="min-w-max">
            {/* Sticky Header Row */}
            <div className="sticky top-0 z-20 flex border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-card text-xs font-bold text-slate-400 uppercase tracking-wider">
               <div className="sticky left-0 z-30 bg-white dark:bg-dark-card w-[140px] sm:w-[240px] flex-shrink-0 p-3 border-r border-slate-100 dark:border-slate-700 shadow-[4px_0_12px_-4px_rgba(0,0,0,0.05)]">
                  HABIT NAME
               </div>
               <div className="flex items-center px-2 py-3 gap-0">
                  {daysInMonth.map(d => {
                      const isToday = dateHelpers.isToday(d.format('YYYY-MM-DD'));
                      return (
                          <div key={d.toString()} className="min-w-[4rem] sm:min-w-[2rem] m-0.5 sm:m-1 flex flex-col items-center flex-shrink-0">
                              <span className={`text-[10px] mb-0.5 ${isToday ? 'text-green-600 font-bold' : 'text-slate-400'}`}>
                                  {d.date()}
                              </span>
                          </div>
                      );
                  })}
               </div>
            </div>

            {/* Draggable Rows */}
            <DndContext 
              sensors={sensors} 
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext 
                items={slots.map(s => s._id)}
                strategy={verticalListSortingStrategy}
              >
                <div>
                  {slots.map(slot => (
                      <SlotRow 
                      key={slot._id}
                      slot={slot}
                      days={daysInMonth}
                      segments={segments}
                      entries={entries}
                      onToggle={handleToggleEntry}
                      onAddSegment={(id) => { setSelectedSlotId(id); setShowAddSegment(true); }}
                      onEditSegment={handleEditSegmentClick}
                      onDeleteSegment={handleDeleteSegmentDirectly}
                      onDeleteSlot={handleDeleteSlot}
                      />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
            
            {slots.length === 0 && (
              <div className="text-center py-16 bg-white dark:bg-dark-card flex flex-col items-center justify-center">
                <p className="text-slate-400 mb-6">No habits tracked yet.</p>
                <button 
                  type="button"
                  onClick={() => setShowAddSlot(true)} 
                  className="text-primary font-bold hover:text-blue-600 px-6 py-2 rounded-full bg-blue-50 dark:bg-blue-900/20 transition-colors"
                >
                  + Add First Habit
                </button>
              </div>
            )}
          </div>
        </div>

        {/* --- ANALYTICS SECTION --- */}
        {slots.length > 0 && (
            <div className="no-print animate-fade-in-up mt-8">
                <AnalyticsPanel data={analyticsData} loading={loading} />
            </div>
        )}

      </main>

      {/* --- MODALS --- */}
      {showAddSlot && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-dark-card p-8 rounded-3xl w-full max-w-sm shadow-2xl">
            <h3 className="text-xl font-bold mb-6 dark:text-white">New Time Slot</h3>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Time of day</label>
            <input 
              type="time" 
              value={newSlotTime} 
              onChange={e => setNewSlotTime(e.target.value)}
              className="w-full border-2 border-slate-200 dark:border-slate-700 p-3 rounded-xl mb-8 text-lg font-mono dark:bg-slate-800 dark:text-white focus:border-green-500 focus:outline-none"
            />
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setShowAddSlot(false)} className="px-5 py-2.5 text-slate-500 font-medium hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition">Cancel</button>
              <button type="button" disabled={actionLoading} onClick={handleAddSlot} className="px-5 py-2.5 bg-green-600 text-white rounded-xl font-bold shadow-lg hover:bg-green-700 transition flex items-center gap-2">
                 {actionLoading && <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                 Add Habit
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddSegment && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-dark-card p-8 rounded-3xl w-full max-w-sm shadow-2xl">
            <h3 className="text-xl font-bold mb-6 dark:text-white">New Habit</h3>
            <div className="mb-6">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Habit Name</label>
              <input 
                autoFocus
                value={newSegmentName} 
                onChange={e => setNewSegmentName(e.target.value)}
                className="w-full border-2 border-slate-200 dark:border-slate-700 p-3 rounded-xl dark:bg-slate-800 dark:text-white focus:border-green-500 focus:outline-none text-lg"
                placeholder="e.g. Read 10 mins"
              />
            </div>
            <div className="mb-8">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Color Tag</label>
              <div className="flex gap-3 flex-wrap">
                {COLORS.map(c => (
                  <button 
                    key={c}
                    type="button"
                    onClick={() => setNewSegmentColor(c)}
                    className={`w-8 h-8 rounded-full transition-all hover:scale-110 ${newSegmentColor === c ? 'ring-4 ring-offset-2 ring-slate-200 dark:ring-offset-dark-card scale-110' : 'opacity-70 hover:opacity-100'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setShowAddSegment(false)} className="px-5 py-2.5 text-slate-500 font-medium hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition">Cancel</button>
              <button type="button" disabled={actionLoading} onClick={handleAddSegment} className="px-5 py-2.5 bg-green-600 text-white rounded-xl font-bold shadow-lg hover:bg-green-700 transition flex items-center gap-2">
                 {actionLoading && <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                 Add Habit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Segment Modal */}
      {showEditSegment && editingSegment && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-dark-card p-8 rounded-3xl w-full max-w-sm shadow-2xl">
            <h3 className="text-xl font-bold mb-6 dark:text-white">Edit Habit</h3>
            <div className="mb-6">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Habit Name</label>
              <input 
                value={newSegmentName} 
                onChange={e => setNewSegmentName(e.target.value)}
                className="w-full border-2 border-slate-200 dark:border-slate-700 p-3 rounded-xl dark:bg-slate-800 dark:text-white focus:border-green-500 focus:outline-none text-lg"
              />
            </div>
            <div className="mb-8">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Color Tag</label>
              <div className="flex gap-3 flex-wrap">
                {COLORS.map(c => (
                  <button 
                    key={c}
                    type="button"
                    onClick={() => setNewSegmentColor(c)}
                    className={`w-8 h-8 rounded-full transition-all hover:scale-110 ${newSegmentColor === c ? 'ring-4 ring-offset-2 ring-slate-200 dark:ring-offset-dark-card scale-110' : 'opacity-70 hover:opacity-100'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <div className="flex justify-between items-center">
              <button 
                type="button"
                onClick={handleDeleteSegmentFromModal}
                className="px-4 py-2.5 text-red-500 font-bold hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition flex items-center gap-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </button>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowEditSegment(false)} className="px-5 py-2.5 text-slate-500 font-medium hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition">Cancel</button>
                <button type="button" disabled={actionLoading} onClick={handleSaveSegment} className="px-5 py-2.5 bg-green-600 text-white rounded-xl font-bold shadow-lg hover:bg-green-700 transition flex items-center gap-2">
                   {actionLoading && <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                   Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;