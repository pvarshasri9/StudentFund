import React, { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api.js';
import { useNotification } from '../context/NotificationContext.js';
import { CurrencyDisplay } from '../components/common/CurrencyDisplay.js';
import { Modal } from '../components/common/Modal.js';
import { ConfirmDialog } from '../components/common/ConfirmDialog.js';
import { EmptyState } from '../components/common/EmptyState.js';
import { Badge } from '../components/common/Badge.js';
import {
  TrendingUp,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit2,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles
} from 'lucide-react';
import { IncomeItem } from '../types/index.js';
import { useFinancials } from '../context/FinancialContext.js';

export const IncomePage: React.FC = () => {
  const { showToast } = useNotification();
  const { refreshFinancials } = useFinancials();
  const [incomes, setIncomes] = useState<IncomeItem[]>([]);
  const [summary, setSummary] = useState({ totalReceived: 0, totalExpected: 0, count: 0 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, RECEIVED, EXPECTED

  // Modal form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<IncomeItem | null>(null);
  const [formData, setFormData] = useState({
    amount: '',
    source: 'Allowance',
    description: '',
    date: new Date().toISOString().slice(0, 10),
    isExpected: false,
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);

  // Delete dialog state
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchIncomes = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (sourceFilter !== 'ALL') params.append('source', sourceFilter);
      if (statusFilter === 'RECEIVED') params.append('isExpected', 'false');
      if (statusFilter === 'EXPECTED') params.append('isExpected', 'true');

      const data = await apiRequest<{ items: IncomeItem[]; summary: any }>(`/income?${params.toString()}`);
      setIncomes(data.items);
      setSummary(data.summary);
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch income records', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncomes();
  }, [sourceFilter, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchIncomes();
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      amount: '',
      source: 'Allowance',
      description: '',
      date: new Date().toISOString().slice(0, 10),
      isExpected: false,
      notes: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: IncomeItem) => {
    setEditingItem(item);
    setFormData({
      amount: item.amount.toString(),
      source: item.source,
      description: item.description,
      date: new Date(item.date).toISOString().slice(0, 10),
      isExpected: item.isExpected,
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
        source: formData.source,
        description: formData.description,
        date: formData.date,
        isExpected: formData.isExpected,
        notes: formData.notes
      };

      if (editingItem) {
        await apiRequest(`/income/${editingItem.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        showToast('Income record updated successfully', 'success');
      } else {
        await apiRequest('/income', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        showToast('Income recorded successfully', 'success');
      }
      setIsModalOpen(false);
      fetchIncomes();
      await refreshFinancials();
    } catch (err: any) {
      showToast(err.message || 'Failed to save income record', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      await apiRequest(`/income/${deletingId}`, { method: 'DELETE' });
      showToast('Income record deleted successfully', 'success');
      setDeletingId(null);
      fetchIncomes();
      await refreshFinancials();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete record', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const sourcesList = ['Allowance', 'Scholarship', 'Stipend', 'Part-time', 'Gift', 'Other'];

  return (
    <div className="space-y-6">
      {/* Top Header & Summary Cards */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white font-heading">
            Income & Allowances
          </h2>
          <p className="text-xs text-slate-400">
            Track parental allowances, scholarship installments, stipends, and future expected cash inflows.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/25 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add Income Record
        </button>
      </div>

      {/* Summary KPI Pills */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
            Total Received Money
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-heading">
            <CurrencyDisplay amount={summary.totalReceived} />
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Available in bank / cash ledger</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
            Expected Future Income
          </div>
          <div className="text-2xl font-bold text-indigo-400 font-heading">
            <CurrencyDisplay amount={summary.totalExpected} />
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Scheduled for next cycle</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
            Total Inflow Records
          </div>
          <div className="text-2xl font-bold text-white font-heading">
            {summary.count} Entries
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Filtered in view</p>
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
              placeholder="Search description or notes..."
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
          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="ALL">All Status</option>
            <option value="RECEIVED">Actual Received Money</option>
            <option value="EXPECTED">Expected Future Cash</option>
          </select>

          {/* Source filter */}
          <select
            value={sourceFilter}
            onChange={e => setSourceFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="ALL">All Sources</option>
            {sourcesList.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Incomes Table */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading incomes...</div>
        ) : incomes.length === 0 ? (
          <EmptyState
            icon={<TrendingUp className="w-8 h-8" />}
            title="No income records found"
            description="Record your family allowance, scholarship installment, or project stipend to track your cash."
            actionButton={
              <button
                onClick={handleOpenAdd}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-md hover:bg-indigo-500 cursor-pointer"
              >
                Add First Income
              </button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase font-semibold">
                  <th className="py-3.5 px-4">Description</th>
                  <th className="py-3.5 px-4">Source</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {incomes.map(item => (
                  <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white">{item.description}</div>
                      {item.notes && <div className="text-[11px] text-slate-400 mt-0.5">{item.notes}</div>}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-block px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700/60 text-[11px]">
                        {item.source}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-white font-heading text-sm">
                      <CurrencyDisplay amount={item.amount} className="text-emerald-400" />
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {new Date(item.date).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="py-3.5 px-4">
                      {item.isExpected ? (
                        <Badge variant="indigo" size="sm">
                          <Clock className="w-3 h-3" />
                          Expected
                        </Badge>
                      ) : (
                        <Badge variant="emerald" size="sm">
                          <CheckCircle2 className="w-3 h-3" />
                          Received
                        </Badge>
                      )}
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

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Edit Income Record' : 'Record Student Income / Allowance'}
        subtitle="Distinguish actual cash in hand from expected future stipends"
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
              placeholder="e.g. 15000"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-300 mb-1">
                Income Source *
              </label>
              <select
                value={formData.source}
                onChange={e => setFormData({ ...formData, source: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                {sourcesList.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-300 mb-1">
                Date *
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
              placeholder="e.g. Monthly Parental Living Allowance (Nov)"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-start gap-3">
            <input
              type="checkbox"
              id="isExpectedCheckbox"
              checked={formData.isExpected}
              onChange={e => setFormData({ ...formData, isExpected: e.target.checked })}
              className="mt-0.5 rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0 cursor-pointer"
            />
            <label htmlFor="isExpectedCheckbox" className="cursor-pointer">
              <span className="font-semibold text-white block">This is an Expected Future Inflow</span>
              <span className="text-slate-400 text-[11px] block mt-0.5">
                Check this if money has NOT arrived yet. It will be used in Runway forecasting without artificially inflating current available bank balance.
              </span>
            </label>
          </div>

          <div>
            <label className="block font-medium text-slate-300 mb-1">
              Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              placeholder="e.g. Received via UPI into HDFC bank account"
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
              {submitting ? 'Saving...' : editingItem ? 'Save Changes' : 'Record Income'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirmation Dialog for Deletion */}
      <ConfirmDialog
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Income Record"
        message="Are you sure you want to permanently remove this income record? Your liquid available balance and runway calculations will adjust immediately."
        confirmLabel="Yes, Delete Record"
        isLoading={isDeleting}
      />
    </div>
  );
};
