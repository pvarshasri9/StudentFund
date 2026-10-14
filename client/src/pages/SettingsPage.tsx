import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useTheme } from '../context/ThemeContext.js';
import { useNotification } from '../context/NotificationContext.js';
import { apiRequest } from '../utils/api.js';
import { ConfirmDialog } from '../components/common/ConfirmDialog.js';
import { Badge } from '../components/common/Badge.js';
import {
  Settings,
  User,
  GraduationCap,
  Shield,
  Palette,
  Bell,
  RefreshCw,
  LogOut,
  Sparkles,
  CheckCircle2
} from 'lucide-react';

import { useFinancials } from '../context/FinancialContext.js';

export const SettingsPage: React.FC = () => {
  const { user, refreshUser, logout, resetDemoData } = useAuth();
  const { theme, setTheme } = useTheme();
  const { showToast } = useNotification();
  const { refreshFinancials } = useFinancials();

  const [formData, setFormData] = useState({
    name: user?.name || '',
    college: user?.college || '',
    course: user?.course || '',
    currentSemester: user?.currentSemester || 4,
    monthlyAllowance: user?.monthlyAllowance || 12000,
    currency: user?.currency || 'INR',
    runwayBufferDays: user?.settings?.runwayBufferDays || 30,
    budgetWarningThresh: user?.settings?.budgetWarningThresh || 80
  });

  const [saving, setSaving] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetting, setResetting] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiRequest('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({
          name: formData.name,
          college: formData.college,
          course: formData.course,
          currentSemester: parseInt(formData.currentSemester.toString(), 10),
          monthlyAllowance: parseFloat(formData.monthlyAllowance.toString()),
          currency: formData.currency,
          theme,
          runwayBufferDays: parseInt(formData.runwayBufferDays.toString(), 10),
          budgetWarningThresh: parseInt(formData.budgetWarningThresh.toString(), 10)
        })
      });
      await refreshUser();
      showToast('Profile and settings updated successfully!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleResetDemo = async () => {
    setResetting(true);
    try {
      await resetDemoData();
      await refreshFinancials();
      showToast('Demo dataset reset to initial state.', 'success');
      setShowResetConfirm(false);
    } catch (err: any) {
      showToast(err.message || 'Failed to reset demo data', 'error');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-white font-heading">
          Student Profile & System Settings
        </h2>
        <p className="text-xs text-slate-400">
          Configure institutional profile, currency defaults, runway thresholds, and theme preferences.
        </p>
      </div>

      <form onSubmit={handleSaveProfile} className="space-y-6">
        {/* Profile Details Card */}
        <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-md space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
            <User className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white font-heading">
              Student Information
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-medium text-slate-300 mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-300 mb-1">
                College Email (Read-Only)
              </label>
              <input
                type="text"
                disabled
                value={user?.email || ''}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/50 border border-slate-800 text-slate-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-300 mb-1">
                College / Institution
              </label>
              <input
                type="text"
                value={formData.college}
                onChange={e => setFormData({ ...formData, college: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-300 mb-1">
                Degree & Specialization
              </label>
              <input
                type="text"
                value={formData.course}
                onChange={e => setFormData({ ...formData, course: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-300 mb-1">
                Current Semester
              </label>
              <input
                type="number"
                min="1"
                max="12"
                value={formData.currentSemester}
                onChange={e => setFormData({ ...formData, currentSemester: parseInt(e.target.value, 10) || 1 })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-300 mb-1">
                Baseline Monthly Allowance (₹)
              </label>
              <input
                type="number"
                min="0"
                value={formData.monthlyAllowance}
                onChange={e => setFormData({ ...formData, monthlyAllowance: parseFloat(e.target.value) || 0 })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Financial Preferences Card */}
        <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-md space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
            <Palette className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white font-heading">
              Financial Engine & Interface Preferences
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-medium text-slate-300 mb-1">
                Currency
              </label>
              <select
                value={formData.currency}
                onChange={e => setFormData({ ...formData, currency: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="INR">INR (₹) — Indian Rupee (Default)</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-300 mb-1">
                Visual Theme
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  className={`flex-1 py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                    theme === 'dark'
                      ? 'bg-indigo-600/20 border-indigo-500 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  Dark Theme (High-Contrast)
                </button>
                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  className={`flex-1 py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                    theme === 'light'
                      ? 'bg-indigo-600/20 border-indigo-500 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  Light Theme
                </button>
              </div>
            </div>

            <div>
              <label className="block font-medium text-slate-300 mb-1">
                Runway Safe Horizon Buffer (Days)
              </label>
              <input
                type="number"
                min="10"
                max="90"
                value={formData.runwayBufferDays}
                onChange={e => setFormData({ ...formData, runwayBufferDays: parseInt(e.target.value, 10) || 30 })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">Default target window for allowance cycle</span>
            </div>

            <div>
              <label className="block font-medium text-slate-300 mb-1">
                Budget Warning Threshold (%)
              </label>
              <input
                type="number"
                min="50"
                max="95"
                value={formData.budgetWarningThresh}
                onChange={e => setFormData({ ...formData, budgetWarningThresh: parseInt(e.target.value, 10) || 80 })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">Triggers caution badge (defaults to 80%)</span>
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/25 transition-all cursor-pointer disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>

      {/* Account Operations & Demo Management Card */}
      <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-md space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
          <Shield className="w-5 h-5 text-amber-400" />
          <h3 className="text-base font-bold text-white font-heading">
            Account Management & Demo Isolation
          </h3>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
          <div>
            <div className="font-semibold text-white">Account Isolation Status</div>
            <p className="text-slate-400 mt-0.5">
              {user?.isDemo
                ? 'Currently in interactive demonstration sandbox (Ananya Sharma).'
                : 'Authenticated under registered student email.'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {user?.isDemo && (
              <button
                type="button"
                onClick={() => setShowResetConfirm(true)}
                className="px-3.5 py-2 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reset Demo Data
              </button>
            )}

            <button
              type="button"
              onClick={logout}
              className="px-3.5 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={handleResetDemo}
        title="Reset Demo Data"
        message="This will re-initialize all incomes, expenses, budgets, commitments, and savings goals back to the default state."
        confirmLabel="Reset Demo"
        isLoading={resetting}
        isDestructive={false}
      />
    </div>
  );
};
