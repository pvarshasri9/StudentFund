import React, { useState } from 'react';
import { apiRequest } from '../utils/api.js';
import { useNotification } from '../context/NotificationContext.js';
import { CurrencyDisplay } from '../components/common/CurrencyDisplay.js';
import { Badge } from '../components/common/Badge.js';
import { Modal } from '../components/common/Modal.js';
import {
  HelpCircle,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Calendar,
  PiggyBank,
  ArrowRight,
  ShieldCheck,
  ShoppingBag,
  Info
} from 'lucide-react';
import { AffordabilityResult } from '../types/index.js';
import { useFinancials } from '../context/FinancialContext.js';

export const CanIAffordItPage: React.FC = () => {
  const { showToast } = useNotification();
  const { refreshFinancials } = useFinancials();

  // Form input
  const [itemTitle, setItemTitle] = useState('Sony WH-1000XM5 Headphones');
  const [price, setPrice] = useState('18500');
  const [category, setCategory] = useState('Personal');
  const [urgency, setUrgency] = useState<'WANT' | 'NEED'>('WANT');
  const [simulating, setSimulating] = useState(false);

  // Result state
  const [result, setResult] = useState<AffordabilityResult | null>(null);

  // Confirm Purchase Modal (Explicit User Opt-In)
  const [showConfirmPurchaseModal, setShowConfirmPurchaseModal] = useState(false);
  const [recordingExpense, setRecordingExpense] = useState(false);

  const categories = [
    'Personal',
    'Entertainment',
    'Academic/Books',
    'Food/Mess',
    'Transport',
    'Utilities',
    'Other'
  ];

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      showToast('Please enter a valid purchase price', 'error');
      return;
    }

    setSimulating(true);
    try {
      const data = await apiRequest<AffordabilityResult>('/afford/simulate', {
        method: 'POST',
        body: JSON.stringify({
          itemTitle,
          price: priceNum,
          category,
          urgency
        })
      });
      setResult(data);
    } catch (err: any) {
      showToast(err.message || 'Simulation failed', 'error');
    } finally {
      setSimulating(false);
    }
  };

  const handleConfirmPurchase = async () => {
    if (!result) return;
    setRecordingExpense(true);
    try {
      await apiRequest('/afford/confirm-purchase', {
        method: 'POST',
        body: JSON.stringify({
          itemTitle: result.itemTitle,
          price: result.price,
          category: result.category,
          isEssential: urgency === 'NEED',
          notes: 'Converted from "Can I Afford It?" purchase simulator'
        })
      });
      showToast(
        `Recorded purchase "${result.itemTitle}" (₹${result.price.toLocaleString('en-IN')}) into real expense ledger!`,
        'success',
        'Purchase Confirmed'
      );
      setShowConfirmPurchaseModal(false);
      await refreshFinancials();
      // Re-run simulation with updated balance
      const updated = await apiRequest<AffordabilityResult>('/afford/simulate', {
        method: 'POST',
        body: JSON.stringify({
          itemTitle,
          price: parseFloat(price),
          category,
          urgency
        })
      });
      setResult(updated);
    } catch (err: any) {
      showToast(err.message || 'Failed to record purchase', 'error');
    } finally {
      setRecordingExpense(false);
    }
  };

  const decisionStyles = {
    AFFORDABLE: {
      badge: 'emerald',
      label: 'Safe to Afford',
      icon: CheckCircle2,
      cardBg: 'from-emerald-950/40 via-slate-900 to-slate-900 border-emerald-500/40 text-emerald-300'
    },
    STRETCH: {
      badge: 'amber',
      label: 'Financial Stretch',
      icon: AlertTriangle,
      cardBg: 'from-amber-950/40 via-slate-900 to-slate-900 border-amber-500/40 text-amber-300'
    },
    UNSAFE: {
      badge: 'rose',
      label: 'Unsafe Purchase (High Risk)',
      icon: XCircle,
      cardBg: 'from-rose-950/40 via-slate-900 to-slate-900 border-rose-500/40 text-rose-300'
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 border border-emerald-500/30 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold mb-2 border border-emerald-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            Signature Innovation Engine
          </div>
          <h2 className="text-2xl lg:text-3xl font-extrabold text-white font-heading tracking-tight">
            Can I Afford It? Purchase Simulator
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
            Before spending on gadgets, trips, or apparel, simulate the real impact against your liquid cash, upcoming semester college fees, monthly budget limits, and emergency reserves.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Form Column */}
        <div className="lg:col-span-1 p-5 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
          <h3 className="text-base font-bold text-white mb-4 font-heading flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-emerald-400" />
            Simulate Planned Purchase
          </h3>

          <form onSubmit={handleSimulate} className="space-y-4 text-xs">
            <div>
              <label className="block font-medium text-slate-300 mb-1">
                Item / Expense Title *
              </label>
              <input
                type="text"
                required
                value={itemTitle}
                onChange={e => setItemTitle(e.target.value)}
                placeholder="e.g. Mechanical Keyboard"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-300 mb-1">
                Estimated Price (₹) *
              </label>
              <input
                type="number"
                required
                min="1"
                step="any"
                value={price}
                onChange={e => setPrice(e.target.value)}
                placeholder="e.g. 4500"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-emerald-500 font-heading"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-slate-300 mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  {categories.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">
                  Type
                </label>
                <select
                  value={urgency}
                  onChange={e => setUrgency(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="WANT">Want (Discretionary)</option>
                  <option value="NEED">Need (Essential)</option>
                </select>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                Simulations are strictly non-destructive. No expense will be recorded unless you explicitly click "Confirm Purchase" below.
              </span>
            </div>

            <button
              type="submit"
              disabled={simulating}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/25 transition-all cursor-pointer disabled:opacity-50"
            >
              {simulating ? 'Analyzing Financial Impact...' : 'Evaluate Affordability'}
            </button>
          </form>
        </div>

        {/* Simulation Output Column */}
        <div className="lg:col-span-2 space-y-4">
          {!result ? (
            <div className="p-12 text-center rounded-3xl bg-slate-900/40 border border-slate-800 flex flex-col items-center justify-center">
              <HelpCircle className="w-12 h-12 text-indigo-400/40 mb-3" />
              <h4 className="text-base font-bold text-white mb-1 font-heading">
                Ready to Test Affordability
              </h4>
              <p className="text-xs text-slate-400 max-w-md">
                Enter an item title and price on the left to see if your cash flow can absorb the purchase without defaulting on college fees or wiping out your emergency cushion.
              </p>
            </div>
          ) : (
            <>
              {/* Verdict Banner */}
              {(() => {
                const conf = decisionStyles[result.decision];
                const IconComponent = conf.icon;
                return (
                  <div className={`p-6 rounded-3xl bg-gradient-to-br ${conf.cardBg} border shadow-xl`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-2xl bg-slate-950/80 border border-slate-800">
                          <IconComponent className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="text-xs uppercase font-bold tracking-wider opacity-80">
                            Simulation Verdict
                          </div>
                          <h3 className="text-xl sm:text-2xl font-extrabold text-white font-heading">
                            {conf.label}
                          </h3>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs text-slate-400">Post-Purchase Balance</div>
                        <div className={`text-xl font-bold font-heading ${result.projectedBalanceAfter < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                          <CurrencyDisplay amount={result.projectedBalanceAfter} />
                        </div>
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
                      {result.recommendation}
                    </p>

                    {/* Reasons list */}
                    <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-1.5 text-xs text-slate-300">
                      {result.reasons.map((r, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                          <span>{r}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* 3 Strategy Scenarios Comparison Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* 1. Buy Now */}
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                      <span>Scenario 1: Buy Now</span>
                      <Badge
                        variant={result.scenarios.buyNow.riskLevel === 'HIGH' ? 'rose' : result.scenarios.buyNow.riskLevel === 'MEDIUM' ? 'amber' : 'emerald'}
                        size="sm"
                      >
                        {result.scenarios.buyNow.riskLevel} Risk
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                      {result.scenarios.buyNow.impactSummary}
                    </p>
                  </div>

                  {result.scenarios.buyNow.feasible && (
                    <button
                      onClick={() => setShowConfirmPurchaseModal(true)}
                      className="mt-4 w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-all cursor-pointer"
                    >
                      Confirm Purchase
                    </button>
                  )}
                </div>

                {/* 2. Delay Days */}
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
                  <div>
                    <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                      <span>Scenario 2: Delay</span>
                      <Calendar className="w-3.5 h-3.5" />
                    </div>
                    <div className="text-base font-bold text-white my-1 font-heading">
                      Wait {result.scenarios.delayDays.recommendedDays} Days
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {result.scenarios.delayDays.reason}
                    </p>
                  </div>
                </div>

                {/* 3. Save First */}
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
                  <div>
                    <div className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                      <span>Scenario 3: Save First</span>
                      <PiggyBank className="w-3.5 h-3.5" />
                    </div>
                    <div className="text-base font-bold text-white my-1 font-heading">
                      ₹{result.scenarios.saveFirst.weeklySavingsNeeded} / week
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {result.scenarios.saveFirst.planDescription}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Explicit User Confirmation Modal */}
      {result && (
        <Modal
          isOpen={showConfirmPurchaseModal}
          onClose={() => setShowConfirmPurchaseModal(false)}
          title="Confirm Real Purchase"
          subtitle="Record transaction into student expense ledger"
        >
          <div className="space-y-4 text-xs">
            <p className="text-slate-300 leading-relaxed">
              You are about to record a real transaction for <strong>{result.itemTitle}</strong> of <strong>₹{result.price.toLocaleString('en-IN')}</strong>.
            </p>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Current Balance:</span>
                <span className="font-bold text-white"><CurrencyDisplay amount={result.currentBalance} /></span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Purchase Cost:</span>
                <span className="font-bold text-rose-400">- <CurrencyDisplay amount={result.price} /></span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-800">
                <span className="text-slate-200 font-semibold">New Available Balance:</span>
                <span className="font-bold text-emerald-400"><CurrencyDisplay amount={result.projectedBalanceAfter} /></span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowConfirmPurchaseModal(false)}
                className="px-4 py-2 text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={recordingExpense}
                onClick={handleConfirmPurchase}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-600/25 transition-all cursor-pointer disabled:opacity-50"
              >
                {recordingExpense ? 'Recording...' : 'Yes, Record Expense'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
