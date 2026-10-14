import React from 'react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionButton?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionButton
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/40">
      {icon && (
        <div className="p-4 rounded-2xl bg-indigo-500/10 text-indigo-400 mb-4 ring-1 ring-indigo-500/20">
          {icon}
        </div>
      )}
      <h4 className="text-base font-semibold text-white mb-1 font-heading">{title}</h4>
      <p className="text-sm text-slate-400 max-w-sm mb-5 leading-relaxed">{description}</p>
      {actionButton && <div>{actionButton}</div>}
    </div>
  );
};
