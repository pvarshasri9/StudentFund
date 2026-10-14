import React, { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api.js';
import { useNotification } from '../context/NotificationContext.js';
import { CurrencyDisplay } from '../components/common/CurrencyDisplay.js';
import { Modal } from '../components/common/Modal.js';
import { ConfirmDialog } from '../components/common/ConfirmDialog.js';
import { EmptyState } from '../components/common/EmptyState.js';
import { Badge } from '../components/common/Badge.js';
import {
  AlertOctagon,
  Plus,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
  CreditCard,
  ShieldCheck,
  Trash2,
  Edit2
} from 'lucide-react';
import { CollegeCommitmentItem } from '../types/index.js';
import { useFinancials } from '../context/FinancialContext.js';

export const CollegePrioritiesPage: React.FC = () => {
  const { showToast } = useNotification();
  const { lastUpdated, refreshFinancials } = useFinancials();
  const [commitments, setCommitments] = useState<CollegeCommitmentItem[]>([]);
  const [summary, setSummary] = useState({
    totalAmount: 0,
    totalPaid: 0,
    totalOutstanding: 0,
    upcomingWithin14DaysCount: 0,
    upcomingWithin14DaysAmount: 0,
    overdueCount: 0,
    overdueAmount: 0
  });
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');

  // Add / Edit commitment modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CollegeCommitmentItem | null>(null);
  const [addForm, setAddForm] = useState({
    title: '',
    amount: '',
    dueDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
    priority: 'HIGH',
    category: 'Tuition',
    notes: ''
  });
  const [submittingAdd, setSubmittingAdd] = useState(false);

  // Pay commitment modal
  const [payingCommitment, setPayingCommitment] = useState<CollegeCommitmentItem | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('UPI');
  const [createExpense, setCreateExpense] = useState(true);
  const [submittingPay, setSubmittingPay] = useState(false);

  // Delete
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCommitments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (priorityFilter !== 'ALL') params.append('priority', priorityFilter);

      const data = await apiRequest<{ items: CollegeCommitmentItem[]; summary: any }>(`/college-expenses?${params.toString()}`);
      setCommitments(data.items);
      setSummary(data.summary);
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch college commitments', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommitments();
  }, [statusFilter, priorityFilter, lastUpdated]);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setAddForm({
      title: '',
      amount: '',
      dueDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
      priority: 'HIGH',
      category: 'Tuition',
      notes: ''
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (item: CollegeCommitmentItem) => {
    setEditingItem(item);
    setAddForm({
      title: item.title,
      amount: item.amount.toString(),
      dueDate: new Date(item.dueDate).toISOString().slice(0, 10),
      priority: item.priority,
      category: item.category,
      notes: item.notes || ''
    });
    setIsAddModalOpen(true);
  };

  const handleOpenPay = (item: CollegeCommitmentItem) => {
    setPayingCommitment(item);
    const remaining = item.amount - item.paidAmount;
    setPayAmount(remaining.toString());
    setPayMethod('UPI');
    setCreateExpense(true);
  };

  const handlePaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingCommitment) return;

    const amt = parseFloat(payAmount);
    if (isNaN(amt) || amt <= 0) {
      showToast('Please enter a valid payment amount', 'error');
      return;
    }

    setSubmittingPay(true);
    try {
      await apiRequest(`/college-expenses/${payingCommitment.id}/pay`, {
        method: 'POST',
        body: JSON.stringify({
          paymentAmount: amt,
          paymentMethod: payMethod,
          createExpenseRecord: createExpense
        })
      });
      showToast(
        `Applied payment of ₹${amt.toLocaleString('en-IN')} to "${payingCommitment.title}" without double-counting!`,
        'success'
      );
      setPayingCommitment(null);
      fetchCommitments();
      await refreshFinancials();
    } catch (err: any) {
      showToast(err.message || 'Failed to record payment', 'error');
    } finally {
      setSubmittingPay(false);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(addForm.amount);
    if (isNaN(amt) || amt <= 0) {
      showToast('Please enter a valid positive amount', 'error');
      return;
    }

    setSubmittingAdd(true);
    try {
      if (editingItem) {
        await apiRequest(`/college-expenses/${editingItem.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            title: addForm.title,
            amount: amt,
            dueDate: addForm.dueDate,
            priority: addForm.priority,
            category: addForm.category,
            notes: addForm.notes
          })
        });
        showToast('College commitment updated successfully!', 'success');
      } else {
        await apiRequest('/college-expenses', {
          method: 'POST',
          body: JSON.stringify({
            title: addForm.title,
            amount: amt,
            dueDate: addForm.dueDate,
            priority: addForm.priority,
            category: addForm.category,
            notes: addForm.notes
          })
        });
        showToast('College commitment recorded and ring-fenced!', 'success');
      }
      setIsAddModalOpen(false);
      setEditingItem(null);
      setAddForm({
        title: '',
        amount: '',
        dueDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
        priority: 'HIGH',
        category: 'Tuition',
        notes: ''
      });
      fetchCommitments();
      await refreshFinancials();
    } catch (err: any) {
      showToast(err.message || 'Failed to record commitment', 'error');
    } finally {
      setSubmittingAdd(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      await apiRequest(`/college-expenses/${deletingId}`, { method: 'DELETE' });
      showToast('Commitment record deleted', 'success');
      setDeletingId(null);
      fetchCommitments();
      await refreshFinancials();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete commitment', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-950 via-slate-900 to-indigo-950 border border-amber-500/30 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold mb-2 border border-amber-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              Signature Innovation Engine
            </div>
            <h2 className="text-2xl lg:text-3xl font-extrabold text-white font-heading tracking-tight">
              College Expense Priority Planner
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mt-1 leading-relaxed">
              Never default on tuition fees, hostel room rent, or exam registration. Protects academic dues from impulse canteen spending and prevents double-counting against expenses.
            </p>
          </div>

          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-lg shadow-amber-600/30 transition-all cursor-pointer self-start md:self-auto"
          >
            <Plus className="w-4 h-4" />
            Add Academic Commitment
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
            Total Outstanding Dues
          </div>
          <div className="text-2xl font-bold text-amber-400 font-heading">
            <CurrencyDisplay amount={summary.totalOutstanding} />
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Pending payments</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
            Due in Next 14 Days
          </div>
          <div className="text-2xl font-bold text-rose-400 font-heading">
            <CurrencyDisplay amount={summary.upcomingWithin14DaysAmount} />
          </div>
          <p className="text-[11px] text-slate-500 mt-1">{summary.upcomingWithin14DaysCount} urgent obligations</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
            Cleared Payments
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-heading">
            <CurrencyDisplay amount={summary.totalPaid} />
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Paid without double-counting</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
            Overdue Dues
          </div>
          <div className="text-2xl font-bold font-heading">
            {summary.overdueCount > 0 ? (
              <span className="text-rose-400">{summary.overdueCount} Overdue</span>
            ) : (
              <span className="text-emerald-400">Zero Overdue</span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Penalty protection status</p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs font-bold text-slate-300">
          Filter Priority & Status:
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="ALL">All Payment Statuses</option>
            <option value="UNPAID">Unpaid Only</option>
            <option value="PARTIAL">Partially Paid</option>
            <option value="PAID">Fully Paid</option>
          </select>

          <select
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="ALL">All Priorities</option>
            <option value="HIGH">High Priority (Tuition / Hostel)</option>
            <option value="MEDIUM">Medium Priority (Exams / Books)</option>
            <option value="LOW">Low Priority (Subscriptions / Clubs)</option>
          </select>
        </div>
      </div>

      {/* Commitments Table */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading commitments...</div>
        ) : commitments.length === 0 ? (
          <EmptyState
            icon={<AlertOctagon className="w-8 h-8" />}
            title="No college commitments found"
            description="Add your upcoming semester tuition fee, mess caution deposit, or library dues to reserve funds."
            actionButton={
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-amber-600 text-white text-xs font-bold shadow-md hover:bg-amber-500 cursor-pointer"
              >
                Add College Commitment
              </button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase font-semibold">
                  <th className="py-3.5 px-4">Academic Obligation</th>
                  <th className="py-3.5 px-4">Priority</th>
                  <th className="py-3.5 px-4">Total Amount</th>
                  <th className="py-3.5 px-4">Remaining</th>
                  <th className="py-3.5 px-4">Due Date</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {commitments.map(item => {
                  const remaining = item.amount - item.paidAmount;
                  const isOverdue = item.status !== 'PAID' && new Date(item.dueDate) < new Date();

                  return (
                    <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white">{item.title}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Category: {item.category} {item.notes && `• ${item.notes}`}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        {item.priority === 'HIGH' ? (
                          <Badge variant="rose" size="sm">HIGH</Badge>
                        ) : item.priority === 'MEDIUM' ? (
                          <Badge variant="amber" size="sm">MEDIUM</Badge>
                        ) : (
                          <Badge variant="slate" size="sm">LOW</Badge>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-white font-heading text-sm">
                        <CurrencyDisplay amount={item.amount} />
                      </td>
                      <td className="py-3.5 px-4 font-bold font-heading text-sm">
                        <span className={remaining > 0 ? 'text-amber-400' : 'text-emerald-400'}>
                          <CurrencyDisplay amount={remaining} />
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 ${isOverdue ? 'text-rose-400 font-bold' : 'text-slate-300'}`}>
                          {new Date(item.dueDate).toLocaleDateString('en-IN', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                          {isOverdue && <span className="text-[10px] px-1 py-0.2 rounded bg-rose-500/20 text-rose-300">Overdue</span>}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {item.status === 'PAID' ? (
                          <Badge variant="emerald" size="sm">
                            <CheckCircle2 className="w-3 h-3" />
                            PAID
                          </Badge>
                        ) : item.status === 'PARTIAL' ? (
                          <Badge variant="amber" size="sm">
                            <Clock className="w-3 h-3" />
                            PARTIAL
                          </Badge>
                        ) : (
                          <Badge variant="rose" size="sm">
                            <AlertTriangle className="w-3 h-3" />
                            UNPAID
                          </Badge>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        {item.status !== 'PAID' && (
                          <button
                            onClick={() => handleOpenPay(item)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shadow-sm transition-all cursor-pointer inline-flex items-center gap-1"
                          >
                            <CreditCard className="w-3 h-3" />
                            Record Pay
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenEdit(item)}
                          title="Edit commitment"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingId(item.id)}
                          title="Delete commitment"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Commitment Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingItem(null);
        }}
        title={editingItem ? 'Edit College Commitment' : 'Add College Commitment'}
        subtitle={editingItem ? 'Update academic fee, priority or deadline' : 'Schedule tuition fees, hostel rent, examination or lab dues'}
      >
        <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-slate-300 mb-1">
              Commitment Title *
            </label>
            <input
              type="text"
              required
              value={addForm.title}
              onChange={e => setAddForm({ ...addForm, title: e.target.value })}
              placeholder="e.g. Semester 5 Tuition Fee"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-300 mb-1">
                Total Amount Due (₹) *
              </label>
              <input
                type="number"
                required
                min="1"
                value={addForm.amount}
                onChange={e => setAddForm({ ...addForm, amount: e.target.value })}
                placeholder="35000"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-300 mb-1">
                Payment Deadline Date *
              </label>
              <input
                type="date"
                required
                value={addForm.dueDate}
                onChange={e => setAddForm({ ...addForm, dueDate: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-300 mb-1">
                Priority Level *
              </label>
              <select
                value={addForm.priority}
                onChange={e => setAddForm({ ...addForm, priority: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="HIGH">High (Tuition / Hostel)</option>
                <option value="MEDIUM">Medium (Exam Fee / Reference Books)</option>
                <option value="LOW">Low (Clubs / Subscriptions)</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-300 mb-1">
                Category
              </label>
              <select
                value={addForm.category}
                onChange={e => setAddForm({ ...addForm, category: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="Tuition">Tuition Fee</option>
                <option value="Hostel">Hostel & Mess</option>
                <option value="ExamFee">Exam Fee</option>
                <option value="Books">Books & Courseware</option>
                <option value="LabFee">Lab & Project Supplies</option>
                <option value="Subscription">Academic Subscription</option>
                <option value="Other">Other Institutional Fee</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-300 mb-1">
              Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={addForm.notes}
              onChange={e => setAddForm({ ...addForm, notes: e.target.value })}
              placeholder="e.g. Late fee applies after deadline"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-500"
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
              className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold shadow-lg shadow-amber-600/25 transition-all cursor-pointer disabled:opacity-50"
            >
              {submittingAdd ? 'Saving...' : 'Record Commitment'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Pay Commitment Modal */}
      {payingCommitment && (
        <Modal
          isOpen={!!payingCommitment}
          onClose={() => setPayingCommitment(null)}
          title={`Record Payment for: ${payingCommitment.title}`}
          subtitle={`Remaining obligation balance: ₹${(payingCommitment.amount - payingCommitment.paidAmount).toLocaleString('en-IN')}`}
        >
          <form onSubmit={handlePaySubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-medium text-slate-300 mb-1">
                Payment Amount (₹) *
              </label>
              <input
                type="number"
                required
                min="1"
                max={payingCommitment.amount - payingCommitment.paidAmount}
                value={payAmount}
                onChange={e => setPayAmount(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-300 mb-1">
                Payment Channel
              </label>
              <select
                value={payMethod}
                onChange={e => setPayMethod(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="UPI">UPI (SBI Collect / GPay / PhonePe)</option>
                <option value="NetBanking">Net Banking / Demand Draft</option>
                <option value="Cash">Cash at Dean Office</option>
                <option value="Card">Debit Card</option>
              </select>
            </div>

            {/* Anti-double counting option */}
            <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex items-start gap-3">
              <input
                type="checkbox"
                id="createExpCheckbox"
                checked={createExpense}
                onChange={e => setCreateExpense(e.target.checked)}
                className="mt-0.5 rounded bg-slate-900 border-slate-700 text-emerald-600 focus:ring-0 cursor-pointer"
              />
              <label htmlFor="createExpCheckbox" className="cursor-pointer">
                <span className="font-semibold text-emerald-300 block">
                  Synchronize with Expense Ledger (Prevents Double-Counting)
                </span>
                <span className="text-slate-300 text-[11px] block mt-0.5">
                  Automatically generates an essential Expense linked to this commitment via a database transaction.
                </span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setPayingCommitment(null)}
                className="px-4 py-2 text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingPay}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-600/25 transition-all cursor-pointer disabled:opacity-50"
              >
                {submittingPay ? 'Processing...' : 'Confirm Payment'}
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
        title="Delete College Commitment"
        message="Are you sure you want to remove this academic commitment? It will no longer be ring-fenced from your runway calculations."
        confirmLabel="Yes, Remove"
        isLoading={isDeleting}
      />
    </div>
  );
};
