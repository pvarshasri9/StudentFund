import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'emerald' | 'rose' | 'amber' | 'indigo' | 'slate' | 'sky';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'indigo',
  size = 'md',
  className = ''
}) => {
  const variantStyles = {
    emerald: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    rose: 'bg-rose-500/15 text-rose-400 border border-rose-500/30',
    amber: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
    indigo: 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30',
    sky: 'bg-sky-500/15 text-sky-400 border border-sky-500/30',
    slate: 'bg-slate-700/30 text-slate-300 border border-slate-600/40',
  };

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 rounded-md font-medium',
    md: 'text-xs px-2.5 py-1 rounded-lg font-medium'
  };

  return (
    <span className={`inline-flex items-center gap-1.5 ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}>
      {children}
    </span>
  );
};
