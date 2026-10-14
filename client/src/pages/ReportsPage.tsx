import React, { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api.js';
import { useNotification } from '../context/NotificationContext.js';
import { CurrencyDisplay } from '../components/common/CurrencyDisplay.js';
import { StatCard } from '../components/common/StatCard.js';
import { CashFlowChart } from '../components/charts/CashFlowChart.js';
import { CategoryPieChart } from '../components/charts/CategoryPieChart.js';
import {
  FileBarChart,
  Download,
  Calendar,
  Sparkles,
  CheckCircle2,
  Filter,
  Receipt,
  Wallet,
  Target
} from 'lucide-react';
import { FinancialOverviewReport } from '../types/index.js';
import { useFinancials } from '../context/FinancialContext.js';

export const ReportsPage: React.FC = () => {
  const { showToast } = useNotification();
  const { lastUpdated } = useFinancials();
  const [report, setReport] = useState<FinancialOverviewReport | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const data = await apiRequest<FinancialOverviewReport>(`/reports/overview?${params.toString()}`);
      setReport(data);
    } catch (err: any) {
      showToast(err.message || 'Failed to load report', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [startDate, endDate, lastUpdated]);

  const handleDownloadCsv = async () => {
    setExporting(true);
    try {
      const csvText = await apiRequest<string>('/reports/export-csv');
      const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `StudentFund_Ledger_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Downloaded verified financial CSV ledger', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to export CSV', 'error');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white font-heading">
            Financial Reports & Ledger Export
          </h2>
          <p className="text-xs text-slate-400">
            Comprehensive financial statements, historical inflows/outflows, and downloadable CSV audits.
          </p>
        </div>

        <button
          onClick={handleDownloadCsv}
          disabled={exporting}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/25 transition-all cursor-pointer self-start sm:self-auto disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          {exporting ? 'Generating CSV...' : 'Export Complete CSV Ledger'}
        </button>
      </div>

      {/* Date Filter Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-300 font-semibold">
          <Calendar className="w-4 h-4 text-indigo-400" />
          <span>Statement Date Range Filter:</span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">From:</span>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
            />
          </div>

          {(startDate || endDate) && (
            <button
              onClick={() => {
                setStartDate('');
                setEndDate('');
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium cursor-pointer"
            >
              Clear Filter
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Income Inflow"
          amount={report?.totalReceivedIncome ?? 0}
          subtitle="Direct allowances & stipends"
          accentColor="emerald"
          icon={<Wallet className="w-5 h-5" />}
        />

        <StatCard
          title="Total Outflow (Expenses)"
          amount={report?.totalExpenses ?? 0}
          subtitle={`${report?.essentialExpensesRatio ?? 0}% essential living costs`}
          accentColor="rose"
          icon={<Receipt className="w-5 h-5" />}
        />

        <StatCard
          title="Net Savings Rate"
          rawText={`${report?.netSavingsRate ?? 0}%`}
          isCurrency={false}
          subtitle="(Income - Expenses) / Income"
          accentColor="indigo"
          icon={<Target className="w-5 h-5" />}
        />

        <StatCard
          title="Committed College Dues"
          amount={report?.collegeCommitmentSummary?.unpaid ?? 0}
          subtitle={`${report?.collegeCommitmentSummary?.upcomingCount ?? 0} pending obligations`}
          accentColor="amber"
          icon={<FileBarChart className="w-5 h-5" />}
        />
      </div>

      {/* Chart analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-5 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
          <h3 className="text-base font-bold text-white mb-4 font-heading">
            Historical Inflow vs Outflow Trajectory
          </h3>
          <CashFlowChart data={report?.monthlyTrends || []} />
        </div>

        <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
          <h3 className="text-base font-bold text-white mb-4 font-heading">
            Expenditure Distribution
          </h3>
          <CategoryPieChart data={report?.topExpenseCategories || []} />
        </div>
      </div>
    </div>
  );
};
