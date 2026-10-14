import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { useNotification } from '../../context/NotificationContext.js';
import { Sparkles, RefreshCw, AlertCircle } from 'lucide-react';
import { ConfirmDialog } from '../common/ConfirmDialog.js';

export const DemoBanner: React.FC = () => {
  const { user, resetDemoData } = useAuth();
  const { showToast } = useNotification();
  const [showConfirm, setShowConfirm] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  if (!user?.isDemo) return null;

  const handleReset = async () => {
    setIsResetting(true);
    try {
      await resetDemoData();
      showToast('Demo dataset has been restored to default state.', 'success', 'Demo Reset');
      setShowConfirm(false);
    } catch (err: any) {
      showToast(err.message || 'Failed to reset demo data.', 'error');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <>
      <div className="bg-gradient-to-r from-amber-500/15 via-indigo-500/15 to-purple-500/15 border-b border-amber-500/30 px-4 py-2.5 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-amber-300">
            <span className="p-1 rounded-md bg-amber-500/20 text-amber-300">
              <Sparkles className="w-3.5 h-3.5" />
            </span>
            <span className="font-semibold text-amber-200">
              Demo Mode Active:
            </span>
            <span className="text-slate-300">
              Exploring simulated data for <strong className="text-white">Ananya Sharma (IIT Delhi)</strong>. Isolated from registered accounts.
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowConfirm(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 transition-colors font-medium cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              Reset Demo Data
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleReset}
        title="Reset Demo Account Data"
        message="This will re-initialize all incomes, expenses, budgets, commitments, and savings goals back to the default YUKTI demonstration state. Any custom items added in demo mode will be reset."
        confirmLabel="Reset to Clean Demo"
        isDestructive={false}
        isLoading={isResetting}
      />
    </>
  );
};
