import React, { useMemo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import dayjs from 'dayjs';
import { Slot, HabitSegment, HabitEntry } from '../types';
import HabitCell from './HabitCell';
import { formatDate } from '../utils/dateHelpers';

interface SlotRowProps {
  slot: Slot;
  days: dayjs.Dayjs[];
  segments: HabitSegment[];
  entries: HabitEntry[];
  onToggle: (segmentId: string, date: string, currentStatus: boolean) => void;
  onAddSegment: (slotId: string) => void;
  onEditSegment: (segment: HabitSegment) => void;
  onDeleteSegment: (segmentId: string) => void;
  onDeleteSlot: (slotId: string) => void;
}

const SlotRow: React.FC<SlotRowProps> = ({
  slot,
  days,
  segments,
  entries,
  onToggle,
  onAddSegment,
  onEditSegment,
  onDeleteSegment,
  onDeleteSlot
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: slot._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1, // Higher Z-index while dragging
    opacity: isDragging ? 0.5 : 1,
    position: 'relative' as const,
  };

  // Determine active segment for the row based on the viewed month context.
  const monthStartStr = days[0].format('YYYY-MM-DD');
  const monthEndStr = days[days.length - 1].format('YYYY-MM-DD');
  
  // Find segments for this slot that overlap with the month
  const slotSegments = segments.filter(s => 
    s.slotId === slot._id && 
    s.startDate <= monthEndStr && 
    (s.endDate === null || s.endDate >= monthStartStr)
  );

  const activeSegment = slotSegments.length > 0 ? slotSegments[slotSegments.length - 1] : undefined;

  // Streak logic: Streak is active if last completion was today or yesterday
  const effectiveStreak = useMemo(() => {
    if (!activeSegment?.streak || !activeSegment.lastCompletedDate) return 0;
    
    // Check if the streak is current (completed today or yesterday)
    // We use basic string comparison for YYYY-MM-DD which is robust enough here
    const todayStr = dayjs().format('YYYY-MM-DD');
    const yesterdayStr = dayjs().subtract(1, 'day').format('YYYY-MM-DD');
    
    if (activeSegment.lastCompletedDate >= yesterdayStr) {
        return activeSegment.streak;
    }
    return 0;
  }, [activeSegment]);

  // Milestone logic
  const nextMilestone = useMemo(() => {
    if (effectiveStreak < 7) return 7;
    if (effectiveStreak < 14) return 14;
    if (effectiveStreak < 21) return 21;
    if (effectiveStreak < 30) return 30;
    if (effectiveStreak < 60) return 60;
    if (effectiveStreak < 90) return 90;
    return Math.ceil((effectiveStreak + 1) / 100) * 100;
  }, [effectiveStreak]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center group mb-2 bg-white dark:bg-dark-card rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 min-w-max"
    >
      {/* Sticky Left Column */}
      <div className="w-[140px] sm:w-[240px] flex-shrink-0 flex items-center p-3 border-r border-slate-100 dark:border-slate-700 bg-white dark:bg-dark-card z-10 sticky left-0">
        <div {...attributes} {...listeners} className="mr-3 cursor-grab text-slate-400 hover:text-slate-600 touch-none print:hidden">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
          </svg>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{slot.time}</span>
            <button 
              type="button"
              onClick={() => onDeleteSlot(slot._id)}
              className="text-slate-300 hover:text-red-500 transition-colors p-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 print:hidden"
              title="Delete Time Slot"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          
          <div className="mt-1">
            {activeSegment ? (
              <div className="flex flex-col">
                <div className="flex items-center group/edit">
                    <div 
                    className="w-2 h-2 rounded-full mr-2 flex-shrink-0 print-force-bg" 
                    style={{ backgroundColor: activeSegment.color }} 
                    />
                    <button 
                    onClick={() => onEditSegment(activeSegment)}
                    className="text-sm font-medium truncate text-slate-700 dark:text-slate-200 mr-2 max-w-[60px] sm:max-w-[100px] hover:text-primary hover:underline text-left focus:outline-none" 
                    title="Edit Habit"
                    >
                    {activeSegment.name}
                    </button>
                    
                    <div className="flex items-center opacity-100 sm:opacity-0 sm:group-hover/edit:opacity-100 transition-opacity print:hidden">
                    <button
                        onClick={() => onEditSegment(activeSegment)}
                        className="text-slate-400 hover:text-primary transition-colors p-1"
                        title="Edit Habit"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                    </button>
                    <button
                        onClick={() => onDeleteSegment(activeSegment._id)}
                        className="text-slate-400 hover:text-red-500 transition-colors p-1"
                        title="Delete Habit"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                    </button>
                    </div>
                </div>
                
                {/* Streak Counter & Milestone */}
                {effectiveStreak > 0 && (
                    <div className="flex items-center mt-1 text-[10px] text-slate-400">
                        <div className="flex items-center text-orange-500 mr-2" title={`${effectiveStreak} day streak`}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-0.5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
                            </svg>
                            <span className="font-bold">{effectiveStreak}</span>
                        </div>
                        <span className="text-slate-300 dark:text-slate-600 mr-1">|</span>
                        <span>Next: {nextMilestone} days</span>
                    </div>
                )}
              </div>
            ) : (
              <button 
                type="button"
                onClick={() => onAddSegment(slot._id)}
                className="text-xs text-primary hover:underline flex items-center mt-1 whitespace-nowrap print:hidden"
              >
                + Add Habit
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Days Grid - No internal scroll, flows in parent container */}
      <div className="flex items-center px-2">
        {days.map((day) => {
          const dateStr = formatDate(day);
          
          const segmentForDay = segments.find(s => 
            s.slotId === slot._id && 
            s.startDate <= dateStr && 
            (s.endDate === null || s.endDate >= dateStr)
          );

          const isCompleted = segmentForDay 
            ? entries.some(e => e.segmentId === segmentForDay._id && e.date === dateStr && e.completed)
            : false;

          return (
            <HabitCell
              key={dateStr}
              date={dateStr}
              isActive={!!segmentForDay}
              isCompleted={isCompleted}
              color={segmentForDay?.color || '#ccc'}
              onToggle={() => segmentForDay && onToggle(segmentForDay._id, dateStr, isCompleted)}
            />
          );
        })}
      </div>
    </div>
  );
};

export default React.memo(SlotRow);