import React from 'react';

interface ProgressBarProps {
  value: number; // 0 to 100+
  max?: number;
  height?: string;
  showLabel?: boolean;
  colorScheme?: 'auto' | 'emerald' | 'indigo' | 'amber' | 'rose';
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  height = 'h-2',
  showLabel = false,
  colorScheme = 'auto',
  className = ''
}) => {
  const percentage = Math.min(100, Math.max(0, Math.round((value / max) * 100)));

  let colorClass = 'bg-indigo-500';

  if (colorScheme === 'auto') {
    if (percentage >= 100) {
      colorClass = 'bg-rose-500';
    } else if (percentage >= 80) {
      colorClass = 'bg-amber-500';
    } else {
      colorClass = 'bg-emerald-500';
    }
  } else if (colorScheme === 'emerald') {
    colorClass = 'bg-emerald-500';
  } else if (colorScheme === 'rose') {
    colorClass = 'bg-rose-500';
  } else if (colorScheme === 'amber') {
    colorClass = 'bg-amber-500';
  } else if (colorScheme === 'indigo') {
    colorClass = 'bg-indigo-500';
  }

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between text-xs text-slate-400 mb-1 font-medium">
          <span>Progress</span>
          <span>{percentage}%</span>
        </div>
      )}
      <div className={`w-full bg-slate-800/80 rounded-full overflow-hidden ${height} border border-slate-700/50`}>
        <div
          className={`${height} ${colorClass} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
