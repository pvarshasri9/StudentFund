import React, { useState } from 'react';
import { useAuth } from './context/AuthContext.js';
import { Layout } from './components/layout/Layout.js';
import { AuthPage } from './pages/AuthPage.js';
import { DashboardPage } from './pages/DashboardPage.js';
import { IncomePage } from './pages/IncomePage.js';
import { ExpensesPage } from './pages/ExpensesPage.js';
import { BudgetPage } from './pages/BudgetPage.js';
import { MoneyRunwayPage } from './pages/MoneyRunwayPage.js';
import { CollegePrioritiesPage } from './pages/CollegePrioritiesPage.js';
import { SavingsGoalsPage } from './pages/SavingsGoalsPage.js';
import { CanIAffordItPage } from './pages/CanIAffordItPage.js';
import { SmartInsightsPage } from './pages/SmartInsightsPage.js';
import { ReportsPage } from './pages/ReportsPage.js';
import { CalendarRemindersPage } from './pages/CalendarRemindersPage.js';
import { FinancialLiteracyPage } from './pages/FinancialLiteracyPage.js';
import { SettingsPage } from './pages/SettingsPage.js';

export const App: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [currentPage, setCurrentPage] = useState<string>('dashboard');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
        <div className="font-heading text-lg font-bold">StudentFund</div>
        <p className="text-xs text-slate-400 mt-1">Authenticating student session...</p>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  const handleQuickAction = (action: 'add-expense' | 'can-i-afford-it') => {
    if (action === 'add-expense') {
      setCurrentPage('expenses');
    } else if (action === 'can-i-afford-it') {
      setCurrentPage('can-i-afford-it');
    }
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage onNavigate={setCurrentPage} />;
      case 'income':
        return <IncomePage />;
      case 'expenses':
        return <ExpensesPage />;
      case 'budget':
        return <BudgetPage />;
      case 'runway':
        return <MoneyRunwayPage />;
      case 'college-priorities':
        return <CollegePrioritiesPage />;
      case 'savings':
        return <SavingsGoalsPage />;
      case 'can-i-afford-it':
        return <CanIAffordItPage />;
      case 'insights':
        return <SmartInsightsPage onNavigate={setCurrentPage} />;
      case 'reports':
        return <ReportsPage />;
      case 'reminders':
        return <CalendarRemindersPage />;
      case 'literacy':
        return <FinancialLiteracyPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardPage onNavigate={setCurrentPage} />;
    }
  };

  return (
    <Layout
      currentPage={currentPage}
      onNavigate={setCurrentPage}
      onQuickAction={handleQuickAction}
    >
      {renderCurrentPage()}
    </Layout>
  );
};
export default App;
