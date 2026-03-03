import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface AdaptiveGridProps {
  children: React.ReactNode;
  className?: string;
  strategy?: 'content-aware' | 'static';
  itemCount?: number;
}

export const AdaptiveGrid: React.FC<AdaptiveGridProps> = ({
  children,
  className,
  strategy = 'content-aware',
  itemCount = 0
}) => {
  // 2026: AI-inspired grid logic
  const gridConfig = useMemo(() => {
    if (strategy === 'static') return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';

    // Adjust density based on item count
    if (itemCount <= 2) return 'grid-cols-1 md:grid-cols-2';
    if (itemCount <= 4) return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4';
    return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
  }, [strategy, itemCount]);

  return (
    <div
      className={cn(
        "grid gap-4 auto-rows-fr transition-all duration-500",
        gridConfig,
        className
      )}
      role="list"
      aria-label="Intelligence Experts Grid"
    >
      {React.Children.map(children, (child) => (
        <div role="listitem" className="h-full">
          {child}
        </div>
      ))}
    </div>
  );
};
