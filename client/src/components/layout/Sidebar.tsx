import React from 'react';
import { useAuth } from '../../context/AuthContext.js';
import {
  LayoutDashboard,
  TrendingUp,
  Receipt,
  PieChart,
  Compass,
  AlertOctagon,
  Target,
  HelpCircle,
  Lightbulb,
  FileBarChart,
  Calendar,
  GraduationCap,
  Settings,
  LogOut,
  Sparkles,
  ShieldAlert
} from 'lucide-react';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  isMobileOpen,
  onCloseMobile
}) => {
  const { user, logout } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'income', label: 'Income', icon: TrendingUp },
    { id: 'expenses', label: 'Expenses', icon: Receipt },
    { id: 'budget', label: 'Budget Planner', icon: PieChart },
    {
      id: 'runway',
      label: 'Money Runway',
      icon: Compass,
      isSignature: true,
      badgeText: 'Signature'
    },
    {
      id: 'college-priorities',
      label: 'College Priorities',
      icon: AlertOctagon,
      isSignature: true,
      badgeText: 'Signature'
    },
    { id: 'savings', label: 'Savings Goals', icon: Target },
    {
      id: 'can-i-afford-it',
      label: 'Can I Afford It?',
      icon: HelpCircle,
      isSignature: true,
      badgeText: 'Simulator'
    },
    { id: 'insights', label: 'Smart Insights', icon: Lightbulb },
    { id: 'reports', label: 'Reports & CSV', icon: FileBarChart },
    { id: 'reminders', label: 'Calendar & Reminders', icon: Calendar },
    { id: 'literacy', label: 'Financial Literacy', icon: GraduationCap },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  const handleItemClick = (pageId: string) => {
    onNavigate(pageId);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-950 border-r border-slate-800/80 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-emerald-400 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
              <Compass className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-heading font-extrabold text-lg text-white tracking-tight flex items-center gap-1.5">
                StudentFund
              </div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-indigo-400">
                YUKTI Innovation
              </div>
            </div>
          </div>
        </div>

        {/* Navigation items scrollable list */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 py-1 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Finance Navigation
          </div>

          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all group cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/30 shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-300'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badgeText && (
                  <span
                    className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-md ${
                      item.isSignature
                        ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-indigo-500/20 text-indigo-300'
                    }`}
                  >
                    {item.badgeText}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* User Card at bottom */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/60">
          <div className="flex items-center justify-between gap-3 p-2 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-300 font-bold flex items-center justify-center text-xs border border-indigo-500/30 shrink-0">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'S'}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-white truncate">{user?.name}</div>
                <div className="text-[10px] text-slate-400 truncate">{user?.college || 'Student'}</div>
              </div>
            </div>

            <button
              onClick={logout}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
