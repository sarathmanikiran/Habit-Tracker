import React from 'react';
import { isToday } from '../utils/dateHelpers';

interface HabitCellProps {
  date: string;
  isActive: boolean;
  isCompleted: boolean;
  color: string;
  onToggle: () => void;
}

const HabitCell: React.FC<HabitCellProps> = ({ date, isActive, isCompleted, color, onToggle }) => {
  const today = isToday(date);

  if (!isActive) {
    // Inactive placeholder
    return (
      <div className="min-w-[3.5rem] h-14 sm:min-w-[2rem] sm:h-8 m-0.5 sm:m-1 rounded-xl bg-slate-100 dark:bg-slate-800 opacity-20 cursor-default flex-shrink-0" />
    );
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      className={`
        min-w-[3.5rem] h-14 sm:min-w-[2rem] sm:h-8 m-0.5 sm:m-1 rounded-xl transition-all duration-300 ease-out border flex-shrink-0
        flex items-center justify-center cursor-pointer relative group
        ${isCompleted ? 'scale-100' : 'scale-95 sm:scale-90 hover:scale-100'}
        ${today && !isCompleted ? 'ring-2 ring-offset-1 ring-offset-slate-50 dark:ring-offset-dark ring-slate-400' : ''}
      `}
      style={{
        backgroundColor: isCompleted ? color : 'transparent',
        borderColor: isCompleted ? color : 'rgba(148, 163, 184, 0.2)', // slate-400 with opacity
      }}
      title={isCompleted ? "Completed" : "Mark as done"}
      aria-label={`Mark habit for ${date} as ${isCompleted ? 'incomplete' : 'complete'}`}
    >
      {/* Mobile-optimized touch target checkmark */}
      {isCompleted && (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 sm:h-5 sm:w-5 text-white drop-shadow-sm" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      )}
      
      {/* Hover effect for desktop */}
      {!isCompleted && (
        <div className="absolute inset-0 bg-current opacity-0 group-hover:opacity-10 rounded-xl pointer-events-none text-slate-400" />
      )}
    </button>
  );
};

export default React.memo(HabitCell);