import React, { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api.js';
import { StatCard } from '../components/common/StatCard.js';
import { Badge } from '../components/common/Badge.js';
import { CurrencyDisplay } from '../components/common/CurrencyDisplay.js';
import { CashFlowChart } from '../components/charts/CashFlowChart.js';
import { CategoryPieChart } from '../components/charts/CategoryPieChart.js';
import {
  Wallet,
  Receipt,
  Compass,
  AlertOctagon,
  Target,
  ArrowRight,
  TrendingUp,
  Sparkles,
  HelpCircle,
  Lightbulb,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { FinancialOverviewReport, RunwayAnalysis, SmartInsight } from '../types/index.js';
import { useFinancials } from '../context/FinancialContext.js';

interface DashboardProps {
  onNavigate: (page: string) => void;
}

export const DashboardPage: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { lastUpdated } = useFinancials();
  const [report, setReport] = useState<FinancialOverviewReport | null>(null);
  const [runway, setRunway] = useState<RunwayAnalysis | null>(null);
  const [insights, setInsights] = useState<SmartInsight[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [overviewData, runwayData, insightsData] = await Promise.all([
        apiRequest<FinancialOverviewReport>('/reports/overview'),
        apiRequest<RunwayAnalysis>('/runway?days=30'),
        apiRequest<{ insights: SmartInsight[] }>('/insights')
      ]);
      setReport(overviewData);
      setRunway(runwayData);
      setInsights(insightsData.insights.slice(0, 3));
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [lastUpdated]);

  if (loading && !report) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-center">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm text-slate-400">Loading student financial ledger & runway analytics...</p>
      </div>
    );
  }

  const runwayStatus = runway?.status || 'HEALTHY';
  const runwayDays = runway?.runwayDaysEssential ?? 0;

  return (
    <div className="space-y-6">
      {/* Top Banner: Signature Highlight */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-950 via-slate-900 to-emerald-950/60 border border-indigo-500/30 p-6 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              YUKTI Innovation Project
            </div>
            <h2 className="text-2xl lg:text-3xl font-extrabold text-white font-heading tracking-tight">
              Smart Financial Runway & College Budget
            </h2>
            <p className="text-sm text-slate-300 max-w-xl">
              Track irregular parental allowances, forecast how long your cash will last, ring-fence upcoming semester fee obligations, and simulate purchases before spending.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate('runway')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <Compass className="w-4 h-4" />
              View Money Runway
            </button>
            <button
              onClick={() => onNavigate('can-i-afford-it')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all cursor-pointer"
            >
              <HelpCircle className="w-4 h-4 text-emerald-400" />
              Can I Afford It?
            </button>
          </div>
        </div>
      </div>

      {/* Main KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Available Balance */}
        <StatCard
          title="Liquid Available Cash"
          amount={report?.availableBalance ?? 0}
          subtitle="In bank / hand (after savings)"
          accentColor="indigo"
          icon={<Wallet className="w-5 h-5" />}
          badge={
            <Badge variant="emerald" size="sm">
              Live
            </Badge>
          }
        />

        {/* Money Runway */}
        <StatCard
          title="Essential Money Runway"
          rawText={`${runwayDays} Days`}
          isCurrency={false}
          subtitle={
            runway?.hasShortfallBeforeNextIncome
              ? `Shortfall before next allowance!`
              : `At ₹${runway?.dailyEssentialBurn || 0}/day burn rate`
          }
          accentColor={runwayStatus === 'CRITICAL' ? 'rose' : runwayStatus === 'MODERATE' ? 'amber' : 'emerald'}
          icon={<Compass className="w-5 h-5" />}
          badge={
            <Badge
              variant={runwayStatus === 'CRITICAL' ? 'rose' : runwayStatus === 'MODERATE' ? 'amber' : 'emerald'}
              size="sm"
            >
              {runwayStatus}
            </Badge>
          }
        />

        {/* Unpaid College Commitments */}
        <StatCard
          title="Unpaid College Fees"
          amount={report?.collegeCommitmentSummary?.unpaid ?? 0}
          subtitle={`${report?.collegeCommitmentSummary?.upcomingCount ?? 0} academic dues pending`}
          accentColor={report && report.collegeCommitmentSummary.unpaid > 0 ? 'amber' : 'emerald'}
          icon={<AlertOctagon className="w-5 h-5" />}
          badge={
            <Badge variant="amber" size="sm">
              Ring-Fenced
            </Badge>
          }
        />

        {/* Total Expenses this Period */}
        <StatCard
          title="Total Spending Recorded"
          amount={report?.totalExpenses ?? 0}
          subtitle={`${report?.essentialExpensesRatio ?? 0}% categorized essential`}
          accentColor="rose"
          icon={<Receipt className="w-5 h-5" />}
        />
      </div>

      {/* Quick Insights Banner */}
      {insights.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {insights.map(ins => (
            <div
              key={ins.id}
              className={`p-4 rounded-2xl border backdrop-blur-md transition-all ${
                ins.type === 'WARNING'
                  ? 'bg-rose-950/40 border-rose-500/30'
                  : ins.type === 'ALERT'
                  ? 'bg-amber-950/40 border-amber-500/30'
                  : 'bg-emerald-950/40 border-emerald-500/30'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <span className="text-xs font-bold text-white font-heading flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                  {ins.title}
                </span>
                {ins.metric && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                    {ins.metric}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 leading-relaxed mb-2">
                {ins.message}
              </p>
              <div className="text-[11px] text-slate-400 bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                <span className="font-semibold text-slate-200">Action:</span> {ins.suggestedAction}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cash Flow Trends */}
        <div className="lg:col-span-2 p-5 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white font-heading">
                Monthly Cash Flow Trajectory
              </h3>
              <p className="text-xs text-slate-400">
                Received student allowances vs actual expenses
              </p>
            </div>
            <button
              onClick={() => onNavigate('reports')}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
            >
              View Full Reports <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <CashFlowChart data={report?.monthlyTrends || []} />
        </div>

        {/* Expense Category Breakdown */}
        <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-md flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white font-heading">
                Expense Categories
              </h3>
              <p className="text-xs text-slate-400">
                Where student money is spent
              </p>
            </div>
            <button
              onClick={() => onNavigate('expenses')}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
            >
              Details <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <CategoryPieChart data={report?.topExpenseCategories || []} />
          </div>
        </div>
      </div>

      {/* Signature Module Highlights Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Runway card */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950/40 to-slate-900 border border-indigo-500/20 hover:border-indigo-500/40 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
                <Compass className="w-5 h-5" />
              </span>
              <Badge variant="indigo" size="sm">Signature</Badge>
            </div>
            <h4 className="text-sm font-bold text-white mb-1 font-heading">
              Student Money Runway
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Calculates daily burn rate and tells you exactly how many days your bank balance will last before your next allowance.
            </p>
          </div>
          <button
            onClick={() => onNavigate('runway')}
            className="mt-4 w-full py-2 px-3 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>Simulate Runway Timeline</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* College Priorities card */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-950/40 to-slate-900 border border-amber-500/20 hover:border-amber-500/40 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                <AlertOctagon className="w-5 h-5" />
              </span>
              <Badge variant="amber" size="sm">Signature</Badge>
            </div>
            <h4 className="text-sm font-bold text-white mb-1 font-heading">
              College Expense Priorities
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Ring-fences upcoming tuition, hostel deposits, and examination fees so you never accidentally spend semester fees on canteen hangouts.
            </p>
          </div>
          <button
            onClick={() => onNavigate('college-priorities')}
            className="mt-4 w-full py-2 px-3 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>Manage Academic Obligations</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Can I Afford It card */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/40 to-slate-900 border border-emerald-500/20 hover:border-emerald-500/40 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                <HelpCircle className="w-5 h-5" />
              </span>
              <Badge variant="emerald" size="sm">Signature</Badge>
            </div>
            <h4 className="text-sm font-bold text-white mb-1 font-heading">
              Can I Afford It?
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Simulate buying that gadget, concert ticket, or sneakers. Compares price against college fee reserves and gives a mathematical verdict.
            </p>
          </div>
          <button
            onClick={() => onNavigate('can-i-afford-it')}
            className="mt-4 w-full py-2 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>Run Affordability Check</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
