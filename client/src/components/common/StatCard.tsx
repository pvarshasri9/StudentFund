import React from 'react';
import { CurrencyDisplay } from './CurrencyDisplay.js';

interface StatCardProps {
  title: string;
  amount?: number;
  rawText?: string;
  isCurrency?: boolean;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    isPositive?: boolean;
    label?: string;
  };
  accentColor?: 'indigo' | 'emerald' | 'amber' | 'rose' | 'sky';
  badge?: React.ReactNode;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  amount,
  rawText,
  isCurrency = true,
  subtitle,
  icon,
  trend,
  accentColor = 'indigo',
  badge,
  className = ''
}) => {
  const accentGradients = {
    indigo: 'from-indigo-500/10 to-transparent border-indigo-500/20 hover:border-indigo-500/40',
    emerald: 'from-emerald-500/10 to-transparent border-emerald-500/20 hover:border-emerald-500/40',
    amber: 'from-amber-500/10 to-transparent border-amber-500/20 hover:border-amber-500/40',
    rose: 'from-rose-500/10 to-transparent border-rose-500/20 hover:border-rose-500/40',
    sky: 'from-sky-500/10 to-transparent border-sky-500/20 hover:border-sky-500/40'
  };

  const iconColors = {
    indigo: 'bg-indigo-500/15 text-indigo-400',
    emerald: 'bg-emerald-500/15 text-emerald-400',
    amber: 'bg-amber-500/15 text-amber-400',
    rose: 'bg-rose-500/15 text-rose-400',
    sky: 'bg-sky-500/15 text-sky-400'
  };

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-slate-900/80 bg-gradient-to-br ${accentGradients[accentColor]} border p-5 backdrop-blur-md transition-all duration-300 hover:shadow-lg ${className}`}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          {title}
        </span>
        {icon && (
          <div className={`p-2 rounded-xl ${iconColors[accentColor]}`}>
            {icon}
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-2 mb-1">
        {isCurrency && amount !== undefined ? (
          <span className="text-2xl lg:text-3xl font-bold tracking-tight text-white font-heading">
            <CurrencyDisplay amount={amount} />
          </span>
        ) : (
          <span className="text-2xl lg:text-3xl font-bold tracking-tight text-white font-heading">
            {rawText || '—'}
          </span>
        )}
        {badge}
      </div>

      <div className="flex items-center justify-between gap-2 text-xs text-slate-400 mt-2">
        {subtitle && <span>{subtitle}</span>}
        {trend && (
          <span
            className={`font-semibold flex items-center gap-0.5 ${
              trend.isPositive ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {trend.value}
            {trend.label && <span className="text-slate-400 ml-1 font-normal">{trend.label}</span>}
          </span>
        )}
      </div>
    </div>
  );
};
