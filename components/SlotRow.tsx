import React from 'react';
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center group mb-2 bg-white dark:bg-dark-card rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 min-w-max"
    >
      {/* Sticky Left Column */}
      <div className="w-[140px] sm:w-[240px] flex-shrink-0 flex items-center p-3 border-r border-slate-100 dark:border-slate-700 bg-white dark:bg-dark-card z-10 sticky left-0">
        <div {...attributes} {...listeners} className="mr-3 cursor-grab text-slate-400 hover:text-slate-600 touch-none">
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
              className="text-slate-300 hover:text-red-500 transition-colors p-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
              title="Delete Time Slot"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          
          <div className="mt-1">
            {activeSegment ? (
              <div className="flex items-center group/edit">
                <div 
                  className="w-2 h-2 rounded-full mr-2 flex-shrink-0" 
                  style={{ backgroundColor: activeSegment.color }} 
                />
                <button 
                  onClick={() => onEditSegment(activeSegment)}
                  className="text-sm font-medium truncate text-slate-700 dark:text-slate-200 mr-2 max-w-[80px] sm:max-w-[120px] hover:text-primary hover:underline text-left focus:outline-none" 
                  title="Edit Habit"
                >
                  {activeSegment.name}
                </button>
                <div className="flex items-center opacity-100 sm:opacity-0 sm:group-hover/edit:opacity-100 transition-opacity">
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
            ) : (
              <button 
                type="button"
                onClick={() => onAddSegment(slot._id)}
                className="text-xs text-primary hover:underline flex items-center mt-1 whitespace-nowrap"
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