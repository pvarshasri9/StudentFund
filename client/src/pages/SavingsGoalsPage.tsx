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
  Target,
  Plus,
  Calendar,
  Sparkles,
  CheckCircle2,
  Trash2,
  TrendingUp,
  ShieldCheck,
  Coins,
  Edit2
} from 'lucide-react';
import { SavingsGoalItem } from '../types/index.js';
import { useFinancials } from '../context/FinancialContext.js';

export const SavingsGoalsPage: React.FC = () => {
  const { showToast } = useNotification();
  const { lastUpdated, refreshFinancials } = useFinancials();
  const [goals, setGoals] = useState<SavingsGoalItem[]>([]);
  const [summary, setSummary] = useState({
    totalSaved: 0,
    totalTarget: 0,
    overallProgress: 0,
    activeGoalsCount: 0
  });
  const [loading, setLoading] = useState(true);

  // Create / Edit Goal Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoalItem | null>(null);
  const [createForm, setCreateForm] = useState({
    title: '',
    targetAmount: '',
    targetDate: new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10),
    category: 'GENERAL',
    notes: ''
  });
  const [submittingCreate, setSubmittingCreate] = useState(false);

  // Contribute Modal
  const [contributingGoal, setContributingGoal] = useState<SavingsGoalItem | null>(null);
  const [contributeAmount, setContributeAmount] = useState('');
  const [contributeNotes, setContributeNotes] = useState('');
  const [submittingContribute, setSubmittingContribute] = useState(false);

  // Delete
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const data = await apiRequest<{ goals: SavingsGoalItem[]; summary: any }>('/savings');
      setGoals(data.goals);
      setSummary(data.summary);
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch savings goals', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, [lastUpdated]);

  const handleOpenCreate = () => {
    setEditingGoal(null);
    setCreateForm({
      title: '',
      targetAmount: '',
      targetDate: new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10),
      category: 'GENERAL',
      notes: ''
    });
    setIsCreateModalOpen(true);
  };

  const handleOpenEdit = (goal: SavingsGoalItem) => {
    setEditingGoal(goal);
    setCreateForm({
      title: goal.title,
      targetAmount: goal.targetAmount.toString(),
      targetDate: new Date(goal.targetDate).toISOString().slice(0, 10),
      category: goal.category,
      notes: goal.notes || ''
    });
    setIsCreateModalOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetAmt = parseFloat(createForm.targetAmount);
    if (isNaN(targetAmt) || targetAmt <= 0) {
      showToast('Please enter a valid target amount', 'error');
      return;
    }

    setSubmittingCreate(true);
    try {
      if (editingGoal) {
        await apiRequest(`/savings/${editingGoal.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            title: createForm.title,
            targetAmount: targetAmt,
            targetDate: createForm.targetDate,
            category: createForm.category,
            notes: createForm.notes
          })
        });
        showToast('Savings goal updated successfully!', 'success');
      } else {
        await apiRequest('/savings', {
          method: 'POST',
          body: JSON.stringify({
            title: createForm.title,
            targetAmount: targetAmt,
            targetDate: createForm.targetDate,
            category: createForm.category,
            notes: createForm.notes
          })
        });
        showToast('Savings goal created successfully!', 'success');
      }
      setIsCreateModalOpen(false);
      setEditingGoal(null);
      setCreateForm({
        title: '',
        targetAmount: '',
        targetDate: new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10),
        category: 'GENERAL',
        notes: ''
      });
      fetchGoals();
      await refreshFinancials();
    } catch (err: any) {
      showToast(err.message || 'Failed to save goal', 'error');
    } finally {
      setSubmittingCreate(false);
    }
  };

  const handleContributeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contributingGoal) return;

    const amt = parseFloat(contributeAmount);
    if (isNaN(amt) || amt <= 0) {
      showToast('Please enter a valid contribution amount', 'error');
      return;
    }

    setSubmittingContribute(true);
    try {
      await apiRequest(`/savings/${contributingGoal.id}/contribute`, {
        method: 'POST',
        body: JSON.stringify({
          amount: amt,
          notes: contributeNotes
        })
      });
      showToast(`Added ₹${amt.toLocaleString('en-IN')} to "${contributingGoal.title}"!`, 'success');
      setContributingGoal(null);
      setContributeAmount('');
      setContributeNotes('');
      fetchGoals();
      await refreshFinancials();
    } catch (err: any) {
      showToast(err.message || 'Failed to record contribution', 'error');
    } finally {
      setSubmittingContribute(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      await apiRequest(`/savings/${deletingId}`, { method: 'DELETE' });
      showToast('Savings goal deleted', 'success');
      setDeletingId(null);
      fetchGoals();
      await refreshFinancials();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete goal', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const goalCategories = [
    { id: 'EMERGENCY', label: 'Emergency Fund (Buffer)' },
    { id: 'LAPTOP', label: 'Laptop / Tech Hardware' },
    { id: 'CERTIFICATION', label: 'Certifications & Courses' },
    { id: 'SEMESTER_BUFFER', label: 'Semester Buffer Fund' },
    { id: 'TRAVEL', label: 'Travel Home / Vacation' },
    { id: 'GENERAL', label: 'General Student Goal' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white font-heading">
            Savings & Emergency Reserve
          </h2>
          <p className="text-xs text-slate-400">
            Dedicated ring-fenced funds for emergency buffers, dev hardware, and exam certifications. Separate from daily living expenses.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/25 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Create Savings Goal
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
            Total Ring-Fenced Savings
          </div>
          <div className="text-2xl font-bold text-indigo-400 font-heading">
            <CurrencyDisplay amount={summary.totalSaved} />
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Accumulated in goals</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
            Total Target Across Goals
          </div>
          <div className="text-2xl font-bold text-white font-heading">
            <CurrencyDisplay amount={summary.totalTarget} />
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Combined target milestone</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
            Overall Milestone Progress
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-heading">
            {summary.overallProgress}%
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Progress towards all goals</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
            Active Targets
          </div>
          <div className="text-2xl font-bold text-white font-heading">
            {summary.activeGoalsCount} Goals
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Funded by micro-savings</p>
        </div>
      </div>

      {/* Goals Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading savings goals...</div>
      ) : goals.length === 0 ? (
        <EmptyState
          icon={<Target className="w-8 h-8" />}
          title="No savings goals created yet"
          description="Build a ₹5,000 student emergency buffer or save for a new laptop to protect your future runway."
          actionButton={
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-md hover:bg-indigo-500 cursor-pointer"
            >
              Start First Savings Goal
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.map(goal => (
            <div
              key={goal.id}
              className={`p-5 rounded-2xl border backdrop-blur-md transition-all ${
                goal.isCompleted
                  ? 'bg-emerald-950/20 border-emerald-500/40'
                  : 'bg-slate-900/80 border-slate-800'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white font-heading">{goal.title}</h3>
                    {goal.isCompleted ? (
                      <Badge variant="emerald" size="sm">
                        <CheckCircle2 className="w-3 h-3" />
                        Completed
                      </Badge>
                    ) : (
                      <Badge variant="indigo" size="sm">
                        {goal.category}
                      </Badge>
                    )}
                  </div>
                  {goal.notes && <p className="text-xs text-slate-400 mt-0.5">{goal.notes}</p>}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(goal)}
                    title="Edit Goal"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeletingId(goal.id)}
                    title="Delete Goal"
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Amounts summary */}
              <div className="flex items-baseline justify-between my-3">
                <div>
                  <span className="text-xs text-slate-400">Saved: </span>
                  <span className="text-xl font-bold text-emerald-400 font-heading">
                    <CurrencyDisplay amount={goal.currentAmount} />
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400">Target: </span>
                  <span className="text-sm font-bold text-white font-heading">
                    <CurrencyDisplay amount={goal.targetAmount} />
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <ProgressBar value={goal.progressPercent} max={100} height="h-2.5" colorScheme="indigo" />

              {/* Micro metrics */}
              <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-800/80 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Monthly Savings Needed</span>
                  <strong className="text-indigo-300 font-heading">
                    <CurrencyDisplay amount={goal.requiredMonthlySavings} /> / month
                  </strong>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block text-[11px]">Target Timeline</span>
                  <span className="text-slate-300">
                    {new Date(goal.targetDate).toLocaleDateString('en-IN', {
                      month: 'short',
                      year: 'numeric'
                    })} ({goal.monthsRemaining} mo left)
                  </span>
                </div>
              </div>

              {/* Action */}
              {!goal.isCompleted && (
                <button
                  onClick={() => {
                    setContributingGoal(goal);
                    setContributeAmount('');
                  }}
                  className="mt-4 w-full py-2 px-3 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Coins className="w-3.5 h-3.5" />
                  <span>Contribute Funds to Goal</span>
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Goal Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingGoal(null);
        }}
        title={editingGoal ? 'Edit Savings Goal' : 'Create Savings Goal'}
        subtitle={editingGoal ? 'Adjust your target fund amount or timeline' : 'Ring-fence funds for emergency cushions or planned investments'}
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-slate-300 mb-1">
              Goal Title *
            </label>
            <input
              type="text"
              required
              value={createForm.title}
              onChange={e => setCreateForm({ ...createForm, title: e.target.value })}
              placeholder="e.g. Student Emergency Fund"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-300 mb-1">
                Target Amount (₹) *
              </label>
              <input
                type="number"
                required
                min="100"
                value={createForm.targetAmount}
                onChange={e => setCreateForm({ ...createForm, targetAmount: e.target.value })}
                placeholder="10000"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-300 mb-1">
                Target Completion Date *
              </label>
              <input
                type="date"
                required
                value={createForm.targetDate}
                onChange={e => setCreateForm({ ...createForm, targetDate: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-300 mb-1">
              Goal Purpose Category
            </label>
            <select
              value={createForm.category}
              onChange={e => setCreateForm({ ...createForm, category: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              {goalCategories.map(c => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-medium text-slate-300 mb-1">
              Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={createForm.notes}
              onChange={e => setCreateForm({ ...createForm, notes: e.target.value })}
              placeholder="e.g. Safety reserve for unexpected travel or medical costs"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingCreate}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-600/25 transition-all cursor-pointer disabled:opacity-50"
            >
              {submittingCreate ? 'Creating...' : 'Create Goal'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Contribute to Goal Modal */}
      {contributingGoal && (
        <Modal
          isOpen={!!contributingGoal}
          onClose={() => setContributingGoal(null)}
          title={`Add Funds to: ${contributingGoal.title}`}
          subtitle={`Remaining to reach goal: ₹${(contributingGoal.targetAmount - contributingGoal.currentAmount).toLocaleString('en-IN')}`}
        >
          <form onSubmit={handleContributeSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-medium text-slate-300 mb-1">
                Contribution Amount (₹) *
              </label>
              <input
                type="number"
                required
                min="1"
                value={contributeAmount}
                onChange={e => setContributeAmount(e.target.value)}
                placeholder="e.g. 1500"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-300 mb-1">
                Contribution Notes (Optional)
              </label>
              <input
                type="text"
                value={contributeNotes}
                onChange={e => setContributeNotes(e.target.value)}
                placeholder="e.g. Saved from freelance bonus or skipping dinner out"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setContributingGoal(null)}
                className="px-4 py-2 text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingContribute}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-600/25 transition-all cursor-pointer disabled:opacity-50"
              >
                {submittingContribute ? 'Saving...' : 'Add Contribution'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Confirm Delete */}
      <ConfirmDialog
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Savings Goal"
        message="Are you sure you want to remove this goal? The ring-fenced funds will return to your free liquid balance."
        confirmLabel="Yes, Remove Goal"
        isLoading={isDeleting}
      />
    </div>
  );
};
