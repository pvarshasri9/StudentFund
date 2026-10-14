import React, { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api.js';
import { useNotification } from '../context/NotificationContext.js';
import { Badge } from '../components/common/Badge.js';
import { EmptyState } from '../components/common/EmptyState.js';
import {
  Lightbulb,
  AlertTriangle,
  Sparkles,
  TrendingUp,
  CheckCircle2,
  Compass,
  ArrowRight,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { SmartInsight } from '../types/index.js';
import { useFinancials } from '../context/FinancialContext.js';

export const SmartInsightsPage: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  const { showToast } = useNotification();
  const { lastUpdated } = useFinancials();
  const [insights, setInsights] = useState<SmartInsight[]>([]);
  const [filterType, setFilterType] = useState('ALL');
  const [loading, setLoading] = useState(true);

  const fetchInsights = async () => {
    try {
      setLoading(true);
      const data = await apiRequest<{ insights: SmartInsight[] }>('/insights');
      setInsights(data.insights);
    } catch (err: any) {
      showToast(err.message || 'Failed to generate insights', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, [lastUpdated]);

  const filtered = filterType === 'ALL'
    ? insights
    : insights.filter(i => i.type === filterType);

  const getTypeStyles = (type: SmartInsight['type']) => {
    switch (type) {
      case 'WARNING':
        return {
          badgeVariant: 'rose' as const,
          bgGradient: 'from-rose-950/40 via-slate-900 to-slate-900 border-rose-500/30',
          icon: AlertTriangle,
          iconColor: 'text-rose-400'
        };
      case 'ALERT':
        return {
          badgeVariant: 'amber' as const,
          bgGradient: 'from-amber-950/40 via-slate-900 to-slate-900 border-amber-500/30',
          icon: Zap,
          iconColor: 'text-amber-400'
        };
      case 'OPPORTUNITY':
        return {
          badgeVariant: 'sky' as const,
          bgGradient: 'from-sky-950/40 via-slate-900 to-slate-900 border-sky-500/30',
          icon: TrendingUp,
          iconColor: 'text-sky-400'
        };
      case 'ACHIEVEMENT':
        return {
          badgeVariant: 'emerald' as const,
          bgGradient: 'from-emerald-950/40 via-slate-900 to-slate-900 border-emerald-500/30',
          icon: CheckCircle2,
          iconColor: 'text-emerald-400'
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 border border-indigo-500/30 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold mb-2 border border-indigo-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            Transparent Rule-Based Analytics
          </div>
          <h2 className="text-2xl lg:text-3xl font-extrabold text-white font-heading tracking-tight">
            Smart Financial Insights
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
            Deterministic, verifiable algorithms inspect your actual cash balances, upcoming academic dues, runway length, and budget spending to highlight risk points and optimization tips.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
        <div className="flex flex-wrap items-center gap-1.5">
          {['ALL', 'WARNING', 'ALERT', 'OPPORTUNITY', 'ACHIEVEMENT'].map(t => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                filterType === t
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {t === 'ALL' ? 'All Insights' : t.charAt(0) + t.slice(1).toLowerCase() + 's'}
            </button>
          ))}
        </div>

        <div className="text-xs text-slate-400 font-medium">
          Showing {filtered.length} active findings
        </div>
      </div>

      {/* Insights Cards */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Computing financial heuristics...</div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Lightbulb className="w-8 h-8" />}
          title="No insights in this category"
          description="Your current ledger has no active flags for this filter."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(item => {
            const styles = getTypeStyles(item.type);
            const IconComp = styles.icon;

            return (
              <div
                key={item.id}
                className={`p-5 rounded-2xl bg-gradient-to-br ${styles.bgGradient} border shadow-xl flex flex-col justify-between`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-xl bg-slate-950/80 border border-slate-800 ${styles.iconColor}`}>
                        <IconComp className="w-4 h-4" />
                      </div>
                      <h3 className="text-base font-bold text-white font-heading">{item.title}</h3>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {item.metric && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-950 text-slate-200 border border-slate-800">
                          {item.metric}
                        </span>
                      )}
                      <Badge variant={styles.badgeVariant} size="sm">
                        {item.type}
                      </Badge>
                    </div>
                  </div>

                  <p className="text-xs text-slate-200 leading-relaxed font-medium mb-3">
                    {item.message}
                  </p>

                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 text-[11px] text-slate-300 space-y-1.5">
                    <div>
                      <strong className="text-indigo-300">Underlying Reason: </strong>
                      <span>{item.reason}</span>
                    </div>
                    <div>
                      <strong className="text-emerald-300">Suggested Action: </strong>
                      <span>{item.suggestedAction}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <span>Priority: <strong className="text-white">{item.priority}</strong></span>
                  <button
                    onClick={() => onNavigate(item.id.includes('runway') ? 'runway' : item.id.includes('fees') ? 'college-priorities' : item.id.includes('budget') ? 'budget' : 'expenses')}
                    className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    Take Action <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
