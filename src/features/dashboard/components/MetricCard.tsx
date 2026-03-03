import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/primitives/card';
import { LucideIcon } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  colorClass?: string;
  chartData?: any[];
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  colorClass = 'from-primary to-primary-glow',
  chartData = [
    { value: 400 }, { value: 300 }, { value: 500 }, { value: 450 }, { value: 600 }, { value: 550 }, { value: 700 }
  ],
}) => {
  return (
    <Card className="glass-panel bg-bg-raised border-border-subtle hover:border-border-default transition-all duration-300 shadow-sm hover:shadow-md group">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">
          {title}
        </CardTitle>
        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${colorClass} flex items-center justify-center shadow-lg shadow-primary/10 group-hover:scale-110 transition-transform`}>
          <Icon className="h-4 w-4 text-white" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between gap-4">
          <div className="space-y-1">
            <div className="text-2xl font-bold text-text-primary tracking-tight">{value}</div>
            {subtitle && (
              <p className="text-[10px] text-text-disabled font-medium uppercase tracking-wide">{subtitle}</p>
            )}
            {trend && (
              <div className={`text-[10px] mt-1 flex items-center gap-1 font-bold ${trend.isPositive ? 'text-accent-emerald' : 'text-accent-rose'}`}>
                <span>{trend.isPositive ? '↑' : '↓'}</span>
                <span>{Math.abs(trend.value)}%</span>
              </div>
            )}
          </div>

          <div className="h-10 w-20 flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id={`grad-${title.replace(/\s+/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(var(--primary))"
                  strokeWidth={1.5}
                  fill={`url(#grad-${title.replace(/\s+/g, '')})`}
                  isAnimationActive={true}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
