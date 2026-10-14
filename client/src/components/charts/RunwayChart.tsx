import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine
} from 'recharts';
import { RunwayForecastItem } from '../../types/index.js';

interface RunwayChartProps {
  data: RunwayForecastItem[];
}

export const RunwayChart: React.FC<RunwayChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return <div className="h-64 flex items-center justify-center text-slate-500 text-sm">No forecast trajectory available.</div>;
  }

  // Filter or sample data for clean rendering (e.g. every 2-3 days if over 45 days)
  const sampledData = data.filter((_, idx) => idx % (data.length > 50 ? 2 : 1) === 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item: RunwayForecastItem = payload[0].payload;
      const isNegative = item.projectedBalance < 0;

      return (
        <div className="bg-slate-900/95 border border-slate-700/80 p-3.5 rounded-xl shadow-xl backdrop-blur-md text-xs">
          <div className="font-semibold text-slate-300 mb-1 flex items-center justify-between gap-4">
            <span>Day +{item.day} ({item.date})</span>
            {item.isShortfall && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 font-bold">
                Shortfall
              </span>
            )}
          </div>
          <div className="text-base font-bold mb-1.5 flex items-center gap-1 font-heading">
            <span className={isNegative ? 'text-rose-400' : 'text-emerald-400'}>
              ₹{item.projectedBalance.toLocaleString('en-IN')}
            </span>
          </div>

          {item.events && item.events.length > 0 && (
            <div className="space-y-1 pt-1.5 border-t border-slate-800 text-[11px] text-indigo-300">
              {item.events.map((ev, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                  <span>{ev}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={sampledData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={(str) => {
              const d = new Date(str);
              return `${d.getDate()}/${d.getMonth() + 1}`;
            }}
            stroke="#64748b"
            tick={{ fontSize: 11 }}
            axisLine={{ stroke: '#334155' }}
            tickLine={false}
          />
          <YAxis
            stroke="#64748b"
            tick={{ fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(val) => `₹${val >= 1000 ? `${Math.round(val / 1000)}k` : val}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={0} stroke="#f43f5e" strokeDasharray="3 3" />
          <Area
            type="monotone"
            dataKey="projectedBalance"
            stroke="#818cf8"
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#balanceGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
