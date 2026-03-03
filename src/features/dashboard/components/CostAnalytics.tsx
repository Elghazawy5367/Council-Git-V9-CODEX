import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { useDashboardStore } from '../store/dashboard-store';

export const CostAnalytics: React.FC = () => {
  const { recentDecisions } = useDashboardStore();

  const costData = React.useMemo(() => {
    // Get last 7 decisions
    return recentDecisions
      .slice(0, 7)
      .reverse()
      .map((decision, index) => ({
        name: `S#${decision.id?.slice(-4) || index + 1}`,
        cost: decision.cost,
        time: decision.duration,
      }));
  }, [recentDecisions]);

  if (costData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-[10px] font-bold text-text-disabled uppercase tracking-widest italic bg-bg-base/30 rounded-xl border border-dashed border-border-subtle">
        No cost attribution yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={costData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border-subtle))" />
        <XAxis
          dataKey="name"
          stroke="hsl(var(--text-tertiary))"
          axisLine={false}
          tickLine={false}
          style={{ fontSize: '10px', fontWeight: 'bold' }}
        />
        <YAxis
          stroke="hsl(var(--text-tertiary))"
          axisLine={false}
          tickLine={false}
          style={{ fontSize: '10px', fontWeight: 'bold' }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--bg-overlay))',
            border: '1px solid hsl(var(--border-default))',
            borderRadius: '12px',
            fontSize: '12px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
          }}
          itemStyle={{ color: 'hsl(var(--text-primary))' }}
          formatter={(value: number) => [`$${value.toFixed(4)}`, 'Execution Cost']}
          cursor={{ fill: 'hsl(var(--bg-elevated))' }}
        />
        <Bar dataKey="cost" radius={[6, 6, 0, 0]} barSize={24}>
           {costData.map((entry, index) => (
             <Cell key={`cell-${index}`} fill={index === costData.length - 1 ? 'hsl(var(--primary))' : 'hsl(var(--accent-emerald))'} />
           ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};
