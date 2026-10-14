import React, { useState } from 'react';
import { Sidebar } from './Sidebar.js';
import { Header } from './Header.js';
import { DemoBanner } from './DemoBanner.js';

interface LayoutProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  children: React.ReactNode;
  onQuickAction?: (action: 'add-expense' | 'can-i-afford-it') => void;
}

export const Layout: React.FC<LayoutProps> = ({
  currentPage,
  onNavigate,
  children,
  onQuickAction
}) => {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const getPageTitle = (page: string) => {
    switch (page) {
      case 'dashboard': return 'Financial Overview & Control';
      case 'income': return 'Income & Allowances';
      case 'expenses': return 'Expense Tracker';
      case 'budget': return 'Campus Budget Planner';
      case 'runway': return 'Student Money Runway';
      case 'college-priorities': return 'College Expense Priorities';
      case 'savings': return 'Savings & Emergency Reserve';
      case 'can-i-afford-it': return 'Can I Afford It? Purchase Simulator';
      case 'insights': return 'Rule-Based Smart Insights';
      case 'reports': return 'Financial Reports & Ledger Export';
      case 'reminders': return 'Payment Reminders & Schedule';
      case 'literacy': return 'Student Financial Literacy';
      case 'settings': return 'Profile & System Settings';
      default: return 'StudentFund';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Sidebar
        currentPage={currentPage}
        onNavigate={onNavigate}
        isMobileOpen={isMobileNavOpen}
        onCloseMobile={() => setIsMobileNavOpen(false)}
      />

      <div className="lg:pl-64 flex flex-col flex-1 min-w-0">
        <DemoBanner />

        <Header
          currentPageTitle={getPageTitle(currentPage)}
          onOpenMobileNav={() => setIsMobileNavOpen(true)}
          onQuickAction={onQuickAction}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto animate-in fade-in duration-300">
          {children}
        </main>
      </div>
    </div>
  );
};
