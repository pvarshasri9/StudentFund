import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend
} from 'recharts';

interface CategoryPieChartProps {
  data: {
    category: string;
    amount: number;
    percentage?: number;
  }[];
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#8b5cf6', '#64748b'];

export const CategoryPieChart: React.FC<CategoryPieChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return <div className="h-64 flex items-center justify-center text-slate-500 text-sm">No expenses recorded yet.</div>;
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-slate-900/95 border border-slate-700/80 p-3 rounded-xl shadow-xl backdrop-blur-md text-xs">
          <div className="font-semibold text-slate-300">{item.category}</div>
          <div className="text-sm font-bold text-white mt-1 font-heading">
            ₹{item.amount.toLocaleString('en-IN')}
          </div>
          {item.percentage !== undefined && (
            <div className="text-[11px] text-indigo-400 mt-0.5">
              {item.percentage}% of total
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
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={95}
            paddingAngle={3}
            dataKey="amount"
            nameKey="category"
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            layout="horizontal"
            align="center"
            verticalAlign="bottom"
            wrapperStyle={{ fontSize: 11, paddingTop: 10 }}
            iconType="circle"
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
