import React, { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api.js';
import { useNotification } from '../context/NotificationContext.js';
import { CurrencyDisplay } from '../components/common/CurrencyDisplay.js';
import { Modal } from '../components/common/Modal.js';
import { ConfirmDialog } from '../components/common/ConfirmDialog.js';
import { EmptyState } from '../components/common/EmptyState.js';
import { Badge } from '../components/common/Badge.js';
import {
  Receipt,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit2,
  Sparkles,
  ShieldCheck,
  ShoppingBag,
  AlertTriangle
} from 'lucide-react';
import { ExpenseItem } from '../types/index.js';
import { useFinancials } from '../context/FinancialContext.js';

export const ExpensesPage: React.FC = () => {
  const { showToast } = useNotification();
  const { refreshFinancials } = useFinancials();
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [summary, setSummary] = useState({
    total: 0,
    essentialTotal: 0,
    nonEssentialTotal: 0,
    essentialRatio: 0,
    count: 0
  });
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [essentialFilter, setEssentialFilter] = useState('ALL'); // ALL, ESSENTIAL, DISCRETIONARY
  const [monthFilter, setMonthFilter] = useState('ALL'); // ALL or YYYY-MM

  // Modal form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ExpenseItem | null>(null);
  const [formData, setFormData] = useState({
    amount: '',
    category: 'Food/Mess',
    description: '',
    date: new Date().toISOString().slice(0, 10),
    isEssential: true,
    paymentMethod: 'UPI',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);

  // Delete state
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const categories = [
    'Food/Mess',
    'Tuition',
    'Hostel/Rent',
    'Transport',
    'Academic/Books',
    'Personal',
    'Entertainment',
    'Health',
    'Utilities',
    'Other'
  ];

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (categoryFilter !== 'ALL') params.append('category', categoryFilter);
      if (essentialFilter === 'ESSENTIAL') params.append('isEssential', 'true');
      if (essentialFilter === 'DISCRETIONARY') params.append('isEssential', 'false');
      if (monthFilter !== 'ALL') params.append('month', monthFilter);

      const data = await apiRequest<{ items: ExpenseItem[]; summary: any }>(`/expenses?${params.toString()}`);
      setExpenses(data.items);
      setSummary(data.summary);
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch expenses', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [categoryFilter, essentialFilter, monthFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchExpenses();
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      amount: '',
      category: 'Food/Mess',
      description: '',
      date: new Date().toISOString().slice(0, 10),
      isEssential: true,
      paymentMethod: 'UPI',
      notes: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: ExpenseItem) => {
    setEditingItem(item);
    setFormData({
      amount: item.amount.toString(),
      category: item.category,
      description: item.description,
      date: new Date(item.date).toISOString().slice(0, 10),
      isEssential: item.isEssential,
      paymentMethod: item.paymentMethod,
      notes: item.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(formData.amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      showToast('Please enter a valid positive amount', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        amount: amountNum,
        category: formData.category,
        description: formData.description,
        date: formData.date,
        isEssential: formData.isEssential,
        paymentMethod: formData.paymentMethod,
        notes: formData.notes
      };

      if (editingItem) {
        await apiRequest(`/expenses/${editingItem.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        showToast('Expense updated successfully', 'success');
      } else {
        await apiRequest('/expenses', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        showToast('Expense recorded successfully', 'success');
      }
      setIsModalOpen(false);
      fetchExpenses();
      await refreshFinancials();
    } catch (err: any) {
      showToast(err.message || 'Failed to save expense', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      await apiRequest(`/expenses/${deletingId}`, { method: 'DELETE' });
      showToast('Expense record deleted successfully', 'success');
      setDeletingId(null);
      fetchExpenses();
      await refreshFinancials();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete expense', 'error');
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
            Expense Tracker
          </h2>
          <p className="text-xs text-slate-400">
            Categorize transactions, distinguish essentials from discretionary lifestyle spends, and maintain balance integrity.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/25 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Record Expense
        </button>
      </div>

      {/* Summary KPI Pills */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
            Total Expenditures
          </div>
          <div className="text-2xl font-bold text-rose-400 font-heading">
            <CurrencyDisplay amount={summary.total} />
          </div>
          <p className="text-[11px] text-slate-500 mt-1">{summary.count} transactions</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
            Essential Costs
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-heading">
            <CurrencyDisplay amount={summary.essentialTotal} />
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Mess, rent, books, transport</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
            Discretionary Spending
          </div>
          <div className="text-2xl font-bold text-amber-400 font-heading">
            <CurrencyDisplay amount={summary.nonEssentialTotal} />
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Eating out, leisure, impulse</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
            Essential Ratio
          </div>
          <div className="text-2xl font-bold text-white font-heading">
            {summary.essentialRatio}%
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Target is 60%+ for students</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[240px] flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by store, item, or notes..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-semibold cursor-pointer"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-2">
          {/* Essential filter */}
          <select
            value={essentialFilter}
            onChange={e => setEssentialFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="ALL">All Spending Types</option>
            <option value="ESSENTIAL">Essential Only (Needs)</option>
            <option value="DISCRETIONARY">Discretionary Only (Wants)</option>
          </select>

          {/* Category filter */}
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="ALL">All Categories</option>
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Month filter */}
          <select
            value={monthFilter}
            onChange={e => setMonthFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="ALL">All Months</option>
            {(() => {
              const opts = [];
              const d = new Date();
              for (let i = 0; i < 6; i++) {
                const target = new Date(d.getFullYear(), d.getMonth() - i, 1);
                const val = `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, '0')}`;
                const label = target.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
                opts.push(<option key={val} value={val}>{label}</option>);
              }
              return opts;
            })()}
          </select>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading expenses...</div>
        ) : expenses.length === 0 ? (
          <EmptyState
            icon={<Receipt className="w-8 h-8" />}
            title="No expense records found"
            description="Log your daily meals, books, canteen snacks, or recharge to keep your money runway accurate."
            actionButton={
              <button
                onClick={handleOpenAdd}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-md hover:bg-indigo-500 cursor-pointer"
              >
                Log First Expense
              </button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase font-semibold">
                  <th className="py-3.5 px-4">Item & Description</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Method</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {expenses.map(item => (
                  <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white">{item.description}</div>
                      {item.notes && <div className="text-[11px] text-slate-400 mt-0.5">{item.notes}</div>}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-block px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700/60 text-[11px]">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-white font-heading text-sm">
                      <CurrencyDisplay amount={item.amount} className="text-rose-400" />
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {new Date(item.date).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="py-3.5 px-4">
                      {item.isEssential ? (
                        <Badge variant="emerald" size="sm">Essential</Badge>
                      ) : (
                        <Badge variant="amber" size="sm">Discretionary</Badge>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      <span className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-[10px]">
                        {item.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        title="Edit record"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-300 hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingId(item.id)}
                        title="Delete record"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Expense Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Edit Expense Record' : 'Record Student Expense'}
        subtitle="Log details to calculate accurate daily burn and budget utilization"
      >
        <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-slate-300 mb-1">
              Amount (₹) *
            </label>
            <input
              type="number"
              required
              step="any"
              min="1"
              value={formData.amount}
              onChange={e => setFormData({ ...formData, amount: e.target.value })}
              placeholder="e.g. 450"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-300 mb-1">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-300 mb-1">
                Payment Date *
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={e => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-300 mb-1">
              Description *
            </label>
            <input
              type="text"
              required
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="e.g. Campus night canteen snacks & tea"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-300 mb-1">
                Payment Method
              </label>
              <select
                value={formData.paymentMethod}
                onChange={e => setFormData({ ...formData, paymentMethod: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="UPI">UPI (GooglePay / PhonePe / Paytm)</option>
                <option value="Cash">Cash in Hand</option>
                <option value="Card">Debit / Credit Card</option>
                <option value="NetBanking">Net Banking</option>
              </select>
            </div>

            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isEssential}
                  onChange={e => setFormData({ ...formData, isEssential: e.target.checked })}
                  className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0 cursor-pointer"
                />
                <span className="text-white font-medium">Essential Living Need</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-300 mb-1">
              Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              placeholder="e.g. Shared bill with room partner"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
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
              {submitting ? 'Saving...' : editingItem ? 'Save Changes' : 'Record Expense'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirmation Dialog for Deletion */}
      <ConfirmDialog
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Expense Record"
        message="Are you sure you want to permanently delete this expense? This will restore your available balance and recalibrate budget utilization."
        confirmLabel="Yes, Delete Expense"
        isLoading={isDeleting}
      />
    </div>
  );
};
