import React, { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api.js';
import { useNotification } from '../context/NotificationContext.js';
import { CurrencyDisplay } from '../components/common/CurrencyDisplay.js';
import { Modal } from '../components/common/Modal.js';
import { ConfirmDialog } from '../components/common/ConfirmDialog.js';
import { EmptyState } from '../components/common/EmptyState.js';
import { Badge } from '../components/common/Badge.js';
import {
  Calendar,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Trash2,
  Bell,
  Sparkles,
  Info
} from 'lucide-react';
import { ReminderItem } from '../types/index.js';

export const CalendarRemindersPage: React.FC = () => {
  const { showToast } = useNotification();
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, overdueCount: 0 });
  const [loading, setLoading] = useState(true);

  // Add Reminder Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    dueDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    category: 'COLLEGE_FEE',
    amount: '',
    priority: 'HIGH',
    notes: ''
  });
  const [submittingAdd, setSubmittingAdd] = useState(false);

  // Delete
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchReminders = async () => {
    try {
      setLoading(true);
      const data = await apiRequest<{ items: ReminderItem[]; stats: any }>('/reminders');
      setReminders(data.items);
      setStats(data.stats);
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch reminders', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReminders();
  }, []);

  const handleToggle = async (id: string) => {
    try {
      const data = await apiRequest<{ item: ReminderItem }>(`/reminders/${id}/toggle`, {
        method: 'PATCH'
      });
      showToast(
        data.item.isCompleted ? 'Marked reminder as completed!' : 'Re-opened reminder',
        'success'
      );
      fetchReminders();
    } catch (err: any) {
      showToast(err.message || 'Failed to update reminder', 'error');
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingAdd(true);
    try {
      await apiRequest('/reminders', {
        method: 'POST',
        body: JSON.stringify({
          title: formData.title,
          dueDate: formData.dueDate,
          category: formData.category,
          amount: formData.amount ? parseFloat(formData.amount) : undefined,
          priority: formData.priority,
          notes: formData.notes
        })
      });
      showToast('Payment reminder scheduled!', 'success');
      setIsAddModalOpen(false);
      setFormData({
        title: '',
        dueDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
        category: 'COLLEGE_FEE',
        amount: '',
        priority: 'HIGH',
        notes: ''
      });
      fetchReminders();
    } catch (err: any) {
      showToast(err.message || 'Failed to create reminder', 'error');
    } finally {
      setSubmittingAdd(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      await apiRequest(`/reminders/${deletingId}`, { method: 'DELETE' });
      showToast('Reminder deleted', 'success');
      setDeletingId(null);
      fetchReminders();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete reminder', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const categories = [
    { id: 'COLLEGE_FEE', label: 'College Tuition / Exam Fee' },
    { id: 'HOSTEL_RENT', label: 'Hostel Rent & Mess Deposit' },
    { id: 'ALLOWANCE', label: 'Expected Allowance Deposit' },
    { id: 'SUBSCRIPTION', label: 'Academic / Software Subscription' },
    { id: 'SAVINGS', label: 'Savings Contribution Transfer' },
    { id: 'OTHER', label: 'Other Commitment' }
  ];

  const now = new Date();
  const overdueItems = reminders.filter(r => !r.isCompleted && new Date(r.dueDate) < now);
  const upcomingItems = reminders.filter(r => !r.isCompleted && new Date(r.dueDate) >= now);
  const completedItems = reminders.filter(r => r.isCompleted);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white font-heading">
            Calendar & Payment Reminders
          </h2>
          <p className="text-xs text-slate-400">
            Never miss fee payment windows, allowance arrival dates, or scheduled savings goal micro-transfers.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/25 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Create Reminder
        </button>
      </div>

      {/* External Gateway Delivery Status */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-start sm:items-center gap-2.5 text-slate-300">
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 shrink-0">
            <Bell className="w-4 h-4" />
          </div>
          <div>
            <span className="font-semibold text-white">Delivery Mode: In-App Notifications Active</span>
            <span className="text-slate-400 block text-[11px] mt-0.5">
              External SMS/Email dispatch is unconfigured. In-app timeline reminders and deadline alerts are operational; external messages are not dispatched.
            </span>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 text-[11px] font-medium shrink-0 self-start sm:self-auto">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          External Gateway Unconfigured
        </span>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
            Pending Action Items
          </div>
          <div className="text-2xl font-bold text-white font-heading">
            {stats.pending} Reminders
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Active student commitments</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
            Overdue Reminders
          </div>
          <div className="text-2xl font-bold font-heading">
            {stats.overdueCount > 0 ? (
              <span className="text-rose-400">{stats.overdueCount} Overdue</span>
            ) : (
              <span className="text-emerald-400">0 Overdue</span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Requires immediate attention</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
            Completed Tasks
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-heading">
            {completedItems.length} Cleared
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Verified on timeline</p>
        </div>
      </div>

      {/* Overdue Section if present */}
      {overdueItems.length > 0 && (
        <div className="p-5 rounded-2xl bg-rose-950/30 border border-rose-500/40 space-y-3">
          <div className="flex items-center gap-2 text-rose-300 font-bold text-sm font-heading">
            <AlertTriangle className="w-4 h-4" />
            <span>Overdue Reminders ({overdueItems.length})</span>
          </div>

          <div className="space-y-2">
            {overdueItems.map(item => (
              <div
                key={item.id}
                className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleToggle(item.id)}
                    className="w-5 h-5 rounded-lg border border-slate-700 flex items-center justify-center hover:border-emerald-500 transition-colors cursor-pointer"
                  >
                    {item.isCompleted && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                  </button>
                  <div>
                    <span className="font-semibold text-white">{item.title}</span>
                    <div className="text-[11px] text-rose-400 mt-0.5">
                      Deadline passed: {new Date(item.dueDate).toLocaleDateString('en-IN')}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {item.amount && (
                    <span className="font-bold text-white font-heading">
                      <CurrencyDisplay amount={item.amount} />
                    </span>
                  )}
                  <button
                    onClick={() => setDeletingId(item.id)}
                    className="p-1 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Reminders List */}
      <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
        <h3 className="text-base font-bold text-white mb-4 font-heading flex items-center gap-2">
          <Clock className="w-4 h-4 text-indigo-400" />
          Scheduled Reminders ({upcomingItems.length})
        </h3>

        {upcomingItems.length === 0 ? (
          <EmptyState
            icon={<Calendar className="w-8 h-8" />}
            title="No upcoming reminders"
            description="Add reminders for hostel dues or next month's allowance."
          />
        ) : (
          <div className="space-y-2.5">
            {upcomingItems.map(item => (
              <div
                key={item.id}
                className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between gap-3 text-xs hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleToggle(item.id)}
                    className="w-5 h-5 rounded-lg border border-slate-700 flex items-center justify-center hover:border-emerald-500 transition-colors cursor-pointer"
                  >
                    {item.isCompleted && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                  </button>
                  <div>
                    <span className="font-semibold text-white">{item.title}</span>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Due: {new Date(item.dueDate).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })} {item.notes && `• ${item.notes}`}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {item.amount && (
                    <span className="font-bold text-white font-heading">
                      <CurrencyDisplay amount={item.amount} />
                    </span>
                  )}
                  <Badge variant={item.priority === 'HIGH' ? 'rose' : item.priority === 'MEDIUM' ? 'amber' : 'slate'} size="sm">
                    {item.priority}
                  </Badge>
                  <button
                    onClick={() => setDeletingId(item.id)}
                    className="p-1 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Reminder Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Schedule Payment Reminder"
        subtitle="In-app notification for fee deadlines and allowance cycles"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-slate-300 mb-1">
              Reminder Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. End-Semester Exam Fee Portal Submission"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-300 mb-1">
                Due Date *
              </label>
              <input
                type="date"
                required
                value={formData.dueDate}
                onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-300 mb-1">
                Amount (₹, Optional)
              </label>
              <input
                type="number"
                min="0"
                value={formData.amount}
                onChange={e => setFormData({ ...formData, amount: e.target.value })}
                placeholder="2500"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-300 mb-1">
                Category
              </label>
              <select
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-300 mb-1">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={e => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="HIGH">High Priority</option>
                <option value="MEDIUM">Medium Priority</option>
                <option value="LOW">Low Priority</option>
              </select>
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
              placeholder="e.g. Pay via Dean office receipt or online SBI"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingAdd}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-600/25 transition-all cursor-pointer disabled:opacity-50"
            >
              {submittingAdd ? 'Saving...' : 'Set Reminder'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete */}
      <ConfirmDialog
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Reminder"
        message="Are you sure you want to delete this reminder from your calendar?"
        confirmLabel="Yes, Delete"
        isLoading={isDeleting}
      />
    </div>
  );
};
