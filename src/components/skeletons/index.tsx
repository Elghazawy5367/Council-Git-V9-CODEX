import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/primitives/card';

export const ExpertCardSkeleton: React.FC = () => (
  <Card className="glass-panel h-full flex flex-col opacity-50 animate-pulse border-border-subtle bg-bg-raised">
    <CardHeader className="pb-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-bg-elevated" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-24 bg-bg-elevated rounded" />
          <div className="h-3 w-32 bg-bg-elevated rounded" />
        </div>
      </div>
      <div className="mt-4 h-8 w-full bg-bg-elevated rounded" />
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="space-y-2">
        <div className="h-3 w-16 bg-bg-elevated rounded" />
        <div className="h-4 w-full bg-bg-elevated rounded" />
      </div>
      <div className="space-y-3">
        <div className="h-3 w-20 bg-bg-elevated rounded" />
        <div className="h-2 w-full bg-bg-elevated rounded-full" />
        <div className="h-2 w-full bg-bg-elevated rounded-full" />
      </div>
    </CardContent>
  </Card>
);

export const VerdictSkeleton: React.FC = () => (
  <div className="space-y-4 animate-pulse">
    <div className="h-4 w-3/4 bg-bg-elevated rounded" />
    <div className="h-4 w-full bg-bg-elevated rounded" />
    <div className="h-4 w-5/6 bg-bg-elevated rounded" />
  </div>
);

export const MetricCardSkeleton: React.FC = () => (
  <Card className="glass-panel p-6 animate-pulse bg-bg-raised border-border-subtle">
    <div className="space-y-3">
      <div className="h-4 w-24 bg-bg-elevated rounded" />
      <div className="h-8 w-32 bg-bg-elevated rounded" />
      <div className="h-8 w-full bg-bg-elevated/50 rounded mt-4" />
    </div>
  </Card>
);
