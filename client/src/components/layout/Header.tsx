import React from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { useTheme } from '../../context/ThemeContext.js';
import { useFinancials } from '../../context/FinancialContext.js';
import { Menu, Sun, Moon, Sparkles, Plus, HelpCircle } from 'lucide-react';

interface HeaderProps {
  currentPageTitle: string;
  onOpenMobileNav: () => void;
  onQuickAction?: (action: 'add-expense' | 'can-i-afford-it') => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentPageTitle,
  onOpenMobileNav,
  onQuickAction
}) => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { summary } = useFinancials();

  return (
    <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 py-3.5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobileNav}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 lg:hidden transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <h1 className="text-lg sm:text-xl font-bold text-white font-heading tracking-tight flex items-center gap-2">
              {currentPageTitle}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Quick Action: Can I Afford It */}
          {onQuickAction && (
            <button
              onClick={() => onQuickAction('can-i-afford-it')}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 text-xs font-semibold text-slate-200 hover:text-white hover:border-indigo-500/50 transition-all cursor-pointer shadow-sm"
            >
              <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
              Can I Afford It?
            </button>
          )}

          {/* Quick Action: Add Expense */}
          {onQuickAction && (
            <button
              onClick={() => onQuickAction('add-expense')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-lg shadow-indigo-600/25 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record Expense</span>
            </button>
          )}

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
          </button>

          {/* Student Status pill with live authoritative balance */}
          <div className="hidden md:flex items-center gap-2 pl-2 border-l border-slate-800">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300">
              <span className="text-[11px] text-slate-400">Available:</span>
              <span className="font-bold text-emerald-400">
                ₹{summary ? summary.currentLiquidBalance.toLocaleString('en-IN') : '...'}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-0.5" title="Authoritative Ledger Live" />
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
