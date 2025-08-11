
// src/components/ui/progress.tsx
import React from 'react';
import { cn } from '@/lib/utils';

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
  color?: 'default' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'default' | 'lg';
  showLabel?: boolean;
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ 
    className, 
    value = 0, 
    max = 100, 
    color = 'default',
    size = 'default',
    showLabel = false,
    ...props 
  }, ref) => {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));
    
    const getColorClasses = () => {
      switch (color) {
        case 'success':
          return 'bg-green-500';
        case 'warning':
          return 'bg-yellow-500';
        case 'danger':
          return 'bg-red-500';
        default:
          return 'bg-blue-500';
      }
    };

    const getHeightClass = () => {
      switch (size) {
        case 'sm':
          return 'h-1';
        case 'lg':
          return 'h-4';
        default:
          return 'h-2';
      }
    };

    return (
      <div
        ref={ref}
        className={cn('w-full bg-gray-200 rounded-full overflow-hidden', className)}
        {...props}
      >
        <div className="relative w-full">
          <div
            className={cn(
              'transition-all duration-300 ease-in-out rounded-full',
              getHeightClass(),
              getColorClasses()
            )}
            style={{ width: `${percentage}%` }}
          />
          {showLabel && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-medium text-gray-700">
                {Math.round(percentage)}%
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }
);

Progress.displayName = 'Progress';

export { Progress };
