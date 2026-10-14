import React, { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api.js';
import { useNotification } from '../context/NotificationContext.js';
import { CurrencyDisplay } from '../components/common/CurrencyDisplay.js';
import { ProgressBar } from '../components/common/ProgressBar.js';
import { Modal } from '../components/common/Modal.js';
import { ConfirmDialog } from '../components/common/ConfirmDialog.js';
import { EmptyState } from '../components/common/EmptyState.js';
import { Badge } from '../components/common/Badge.js';
import {
  PieChart,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Edit2,
  Calendar,
  Sparkles,
  Info
} from 'lucide-react';
import { BudgetItem } from '../types/index.js';
import { useFinancials } from '../context/FinancialContext.js';

export const BudgetPage: React.FC = () => {
  const { showToast } = useNotification();
  const { lastUpdated, refreshFinancials } = useFinancials();
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const [month, setMonth] = useState(currentMonthStr);
  const [budgets, setBudgets] = useState<BudgetItem[]>([]);
  const [totalBudgeted, setTotalBudgeted] = useState(0);
  const [totalSpentInMonth, setTotalSpentInMonth] = useState(0);
  const [loading, setLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    category: 'OVERALL',
    month: currentMonthStr,
    limitAmount: '',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);

  // Delete
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const categories = [
    'OVERALL',
    'Food/Mess',
    'Tuition',
    'Hostel/Rent',
    'Transport',
    'Academic/Books',
    'Personal',
    'Entertainment',
    'Utilities',
    'Other'
  ];

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      const data = await apiRequest<{
        budgets: BudgetItem[];
        totalBudgeted: number;
        totalSpentInMonth: number;
      }>(`/budgets?month=${month}`);

      setBudgets(data.budgets);
      setTotalBudgeted(data.totalBudgeted);
      setTotalSpentInMonth(data.totalSpentInMonth);
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch budgets', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, [month, lastUpdated]);

  const handleOpenAdd = () => {
    setFormData({
      category: 'OVERALL',
      month,
      limitAmount: '',
      notes: ''
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const limitNum = parseFloat(formData.limitAmount);
    if (isNaN(limitNum) || limitNum <= 0) {
      showToast('Please enter a valid positive limit', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await apiRequest('/budgets', {
        method: 'POST',
        body: JSON.stringify({
          category: formData.category,
          month: formData.month,
          limitAmount: limitNum,
          notes: formData.notes
        })
      });
      showToast(`Budget for ${formData.category} set successfully!`, 'success');
      setIsModalOpen(false);
      fetchBudgets();
      await refreshFinancials();
    } catch (err: any) {
      showToast(err.message || 'Failed to save budget', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      await apiRequest(`/budgets/${deletingId}`, { method: 'DELETE' });
      showToast('Budget deleted successfully', 'success');
      setDeletingId(null);
      fetchBudgets();
      await refreshFinancials();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete budget', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white font-heading">
            Campus Budget Planner
          </h2>
          <p className="text-xs text-slate-400">
            Set spending guardrails by category. Warns at 80% threshold and alerts when limits are exceeded.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="month"
            value={month}
            onChange={e => setMonth(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
          />
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/25 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Set Budget Limit
          </button>
        </div>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
            Total Budget Allocation
          </div>
          <div className="text-2xl font-bold text-indigo-400 font-heading">
            <CurrencyDisplay amount={totalBudgeted} />
          </div>
          <p className="text-[11px] text-slate-500 mt-1">For month: {month}</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
            Actual Spent This Month
          </div>
          <div className="text-2xl font-bold text-white font-heading">
            <CurrencyDisplay amount={totalSpentInMonth} />
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Aggregated from verified transactions</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
            Overall Health
          </div>
          <div className="text-2xl font-bold font-heading">
            {totalBudgeted > 0 ? (
              totalSpentInMonth > totalBudgeted ? (
                <span className="text-rose-400">Exceeded</span>
              ) : totalSpentInMonth >= totalBudgeted * 0.8 ? (
                <span className="text-amber-400">Caution (80%+)</span>
              ) : (
                <span className="text-emerald-400">Safe Range</span>
              )
            ) : (
              <span className="text-slate-400">No Caps Set</span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Dynamic rule-based warning status</p>
        </div>
      </div>

      {/* Budgets Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading budgets...</div>
      ) : budgets.length === 0 ? (
        <EmptyState
          icon={<PieChart className="w-8 h-8" />}
          title="No budgets configured for this month"
          description="Create an Overall spending limit or set category budgets for mess, books, and entertainment to curb impulsive student spending."
          actionButton={
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-md hover:bg-indigo-500 cursor-pointer"
            >
              Create First Budget
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {budgets.map(b => (
            <div
              key={b.id}
              className={`p-5 rounded-2xl border backdrop-blur-md transition-all ${
                b.warningStatus === 'EXCEEDED'
                  ? 'bg-rose-950/20 border-rose-500/40'
                  : b.warningStatus === 'WARNING_80'
                  ? 'bg-amber-950/20 border-amber-500/40'
                  : 'bg-slate-900/80 border-slate-800'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white font-heading">
                      {b.category === 'OVERALL' ? 'Overall Monthly Ceiling' : b.category}
                    </h3>
                    {b.warningStatus === 'EXCEEDED' && (
                      <Badge variant="rose" size="sm">
                        <AlertTriangle className="w-3 h-3" />
                        Exceeded Limit
                      </Badge>
                    )}
                    {b.warningStatus === 'WARNING_80' && (
                      <Badge variant="amber" size="sm">
                        <AlertTriangle className="w-3 h-3" />
                        80% Warning
                      </Badge>
                    )}
                    {b.warningStatus === 'NORMAL' && (
                      <Badge variant="emerald" size="sm">
                        <CheckCircle2 className="w-3 h-3" />
                        Healthy
                      </Badge>
                    )}
                  </div>
                  {b.notes && <p className="text-xs text-slate-400 mt-1">{b.notes}</p>}
                </div>

                <button
                  onClick={() => setDeletingId(b.id)}
                  title="Remove Budget"
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Progress Bar */}
              <div className="my-3">
                <div className="flex justify-between text-xs mb-1 font-medium">
                  <span className="text-slate-400">Spent: <CurrencyDisplay amount={b.spent} /></span>
                  <span className="text-slate-300">Cap: <CurrencyDisplay amount={b.limitAmount} /></span>
                </div>
                <ProgressBar value={b.utilizationRate} max={100} height="h-2.5" />
              </div>

              {/* Metrics footer */}
              <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-800/80">
                <span className="text-slate-400">
                  Remaining:{' '}
                  <strong className={b.remaining < 0 ? 'text-rose-400' : 'text-emerald-400'}>
                    <CurrencyDisplay amount={b.remaining} />
                  </strong>
                </span>
                <span className="font-semibold text-slate-300">
                  {b.utilizationRate}% Utilized
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Set Budget Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Set Budget Limit"
        subtitle="Define maximum spending ceiling for the month"
      >
        <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-slate-300 mb-1">
              Category *
            </label>
            <select
              value={formData.category}
              onChange={e => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              {categories.map(c => (
                <option key={c} value={c}>
                  {c === 'OVERALL' ? 'Overall Monthly Ceiling (All Categories)' : c}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-300 mb-1">
                Month *
              </label>
              <input
                type="month"
                required
                value={formData.month}
                onChange={e => setFormData({ ...formData, month: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-300 mb-1">
                Limit Amount (₹) *
              </label>
              <input
                type="number"
                required
                step="any"
                min="1"
                value={formData.limitAmount}
                onChange={e => setFormData({ ...formData, limitAmount: e.target.value })}
                placeholder="e.g. 5000"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-300 mb-1">
              Notes (Optional)
            </label>
            <input
              type="text"
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              placeholder="e.g. Capped to save for hostel mess deposit"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-600/25 transition-all cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Set Budget'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete */}
      <ConfirmDialog
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Budget"
        message="Are you sure you want to remove this budget ceiling? Existing recorded expenses will remain intact."
        confirmLabel="Yes, Remove Budget"
        isLoading={isDeleting}
      />
    </div>
  );
};
