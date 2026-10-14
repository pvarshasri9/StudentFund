import React, { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api.js';
import { CurrencyDisplay } from '../components/common/CurrencyDisplay.js';
import { StatCard } from '../components/common/StatCard.js';
import { Badge } from '../components/common/Badge.js';
import { RunwayChart } from '../components/charts/RunwayChart.js';
import {
  Compass,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Sparkles,
  Info,
  Clock,
  ArrowDownRight,
  TrendingDown,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { RunwayAnalysis } from '../types/index.js';
import { useFinancials } from '../context/FinancialContext.js';

export const MoneyRunwayPage: React.FC = () => {
  const { lastUpdated } = useFinancials();
  const [forecastPeriod, setForecastPeriod] = useState<number>(60);
  const [runway, setRunway] = useState<RunwayAnalysis | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRunway = async () => {
    try {
      setLoading(true);
      const data = await apiRequest<RunwayAnalysis>(`/runway?days=${forecastPeriod}`);
      setRunway(data);
    } catch (err) {
      console.error('Runway fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRunway();
  }, [forecastPeriod, lastUpdated]);

  if (loading && !runway) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-center">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm text-slate-400">Computing Student Money Runway projection...</p>
      </div>
    );
  }

  const status = runway?.status || 'HEALTHY';
  const hasShortfall = runway?.hasShortfallBeforeNextIncome || false;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 border border-indigo-500/30 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold mb-2 border border-indigo-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              Signature Innovation Engine
            </div>
            <h2 className="text-2xl lg:text-3xl font-extrabold text-white font-heading tracking-tight">
              Student Money Runway Planner
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mt-1 leading-relaxed">
              Adapted from startup cash-runway engineering: models your irregular parental allowances, ring-fences college semester fees, measures essential burn rate, and flags cash shortfalls before your next stipend arrives.
            </p>
          </div>

          {/* Period selector */}
          <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-2xl border border-slate-800 self-start md:self-auto">
            {[30, 60, 90].map(days => (
              <button
                key={days}
                onClick={() => setForecastPeriod(days)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  forecastPeriod === days
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {days} Days
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Critical Shortfall Warning Banner if detected */}
      {hasShortfall && (
        <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-500/50 shadow-xl flex items-start gap-3.5 animate-pulse">
          <div className="p-2 rounded-xl bg-rose-500/20 text-rose-300 shrink-0 mt-0.5">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-rose-200 font-heading">
              Projected Student Cash Shortfall Detected!
            </h4>
            <p className="text-xs text-rose-200/90 leading-relaxed mt-0.5">
              At your current daily essential living burn rate (₹{runway?.dailyEssentialBurn}/day) and scheduled college fees, your liquid cash will run out in <strong>{runway?.runwayDaysEssential} days</strong>, which is <strong>{runway?.nextExpectedIncome?.daysAway ? `${runway.nextExpectedIncome.daysAway - (runway.runwayDaysEssential || 0)} days before` : 'before'}</strong> your next scheduled allowance arrives. Estimated shortfall is <strong>₹{runway?.shortfallAmount.toLocaleString('en-IN')}</strong>.
            </p>
          </div>
        </div>
      )}

      {/* Runway Metrics 4-Card Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Runway in Days */}
        <StatCard
          title="Essential Runway"
          rawText={`${runway?.runwayDaysEssential ?? 0} Days`}
          isCurrency={false}
          subtitle={`Until zero liquid cash at ₹${runway?.dailyEssentialBurn}/day`}
          accentColor={status === 'CRITICAL' ? 'rose' : status === 'MODERATE' ? 'amber' : 'emerald'}
          icon={<Compass className="w-5 h-5" />}
          badge={
            <Badge
              variant={status === 'CRITICAL' ? 'rose' : status === 'MODERATE' ? 'amber' : 'emerald'}
              size="sm"
            >
              {status}
            </Badge>
          }
        />

        {/* Suggested Daily Limit */}
        <StatCard
          title="Suggested Daily Limit"
          amount={runway?.suggestedDailyLimit ?? 0}
          subtitle="Safe spending cap per day"
          accentColor="indigo"
          icon={<Zap className="w-5 h-5 text-indigo-400" />}
          badge={
            <Badge variant="indigo" size="sm">
              Guardrail
            </Badge>
          }
        />

        {/* Daily Essential Burn Rate */}
        <StatCard
          title="Daily Essential Burn"
          amount={runway?.dailyEssentialBurn ?? 0}
          subtitle="Mess hall, travel, books average"
          accentColor="amber"
          icon={<TrendingDown className="w-5 h-5 text-amber-400" />}
        />

        {/* Next Expected Income */}
        <StatCard
          title="Next Allowance / Stipend"
          amount={runway?.nextExpectedIncome?.amount ?? 0}
          subtitle={
            runway?.nextExpectedIncome
              ? `${runway.nextExpectedIncome.source} in ${runway.nextExpectedIncome.daysAway} days`
              : 'None scheduled'
          }
          accentColor="emerald"
          icon={<Calendar className="w-5 h-5 text-emerald-400" />}
        />
      </div>

      {/* Main Interactive Projection Chart */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-md shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white font-heading">
              Balance Trajectory Over Time ({forecastPeriod}-Day Simulation)
            </h3>
            <p className="text-xs text-slate-400">
              Interactive trajectory accounting for daily living costs, college due deductions, and allowance credits.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-indigo-400 font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
              Projected Balance
            </span>
            <span className="flex items-center gap-1.5 text-rose-400 font-semibold">
              <span className="w-2.5 h-0.5 bg-rose-500" />
              Zero Line (Deficit)
            </span>
          </div>
        </div>

        <RunwayChart data={runway?.forecast || []} />
      </div>

      {/* Mathematical Breakdown & Assumptions Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Balance Composition Breakdown */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
          <h4 className="text-sm font-bold text-white mb-3 font-heading flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Liquid Balance Composition & Ring-Fencing
          </h4>
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <span className="text-slate-300">Total Received Income (All-Time)</span>
              <span className="font-bold text-emerald-400 font-heading">
                <CurrencyDisplay amount={runway?.totalReceivedIncome || 0} />
              </span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <span className="text-slate-300">Less: Total Spent Transactions</span>
              <span className="font-bold text-rose-400 font-heading">
                - <CurrencyDisplay amount={runway?.totalExpenses || 0} />
              </span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <span className="text-slate-300">Less: Ring-Fenced Savings Goals</span>
              <span className="font-bold text-indigo-400 font-heading">
                - <CurrencyDisplay amount={runway?.totalSavingsAllocated || 0} />
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/30 font-semibold text-sm">
              <span className="text-white">Current Free Liquid Balance</span>
              <span className="font-bold text-emerald-400 font-heading text-base">
                <CurrencyDisplay amount={runway?.currentBalance || 0} />
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-950/20 border border-amber-500/20 text-amber-300 text-[11px]">
              Pending College Commitments to Reserve: <strong>₹{runway?.unpaidCommitmentsTotal.toLocaleString('en-IN')}</strong>
            </div>
          </div>
        </div>

        {/* Transparent Methodology & Assumptions */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
          <h4 className="text-sm font-bold text-white mb-3 font-heading flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-400" />
            Transparent Mathematical Assumptions
          </h4>
          <ul className="space-y-2.5 text-xs text-slate-300">
            {runway?.assumptions.map((assump, idx) => (
              <li key={idx} className="flex items-start gap-2 leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                <span>{assump}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
