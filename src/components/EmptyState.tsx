import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon, Brain } from 'lucide-react';
import { Button } from '@/components/primitives/button';

export interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className,
}) => {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center p-12 text-center bg-bg-raised border border-dashed border-border-default rounded-2xl gap-4',
      className
    )}>
      <div className="w-16 h-16 rounded-full bg-bg-elevated flex items-center justify-center text-text-disabled mb-2">
        {icon}
      </div>

      <div className="space-y-2 max-w-sm">
        <h3 className="text-xl font-bold text-text-primary tracking-tight">{title}</h3>
        {description && (
          <p className="text-sm text-text-tertiary leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {action && (
        <div className="mt-2">
          {action}
        </div>
      )}
    </div>
  );
};

// Pre-configured empty states for backward compatibility/quick use
export const NoExpertsEmptyState: React.FC<{ onAddExpert?: () => void }> = ({ onAddExpert }) => (
  <EmptyState
    icon={<Brain size={32} />}
    title="No Experts Configured"
    description="Add your first expert to start getting multi-perspective insights on your questions."
    action={onAddExpert ? <Button onClick={onAddExpert}>Add Expert</Button> : undefined}
  />
);
