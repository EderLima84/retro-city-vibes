import React from 'react';
import { Loader2, ArrowDown } from 'lucide-react';

interface PullToRefreshIndicatorProps {
  pullDistance: number;
  isRefreshing: boolean;
  progress: number;
  shouldTrigger: boolean;
}

export const PullToRefreshIndicator: React.FC<PullToRefreshIndicatorProps> = ({
  pullDistance,
  isRefreshing,
  progress,
  shouldTrigger
}) => {
  if (pullDistance === 0 && !isRefreshing) return null;

  return (
    <div 
      className="fixed left-0 right-0 flex items-center justify-center z-50 pointer-events-none transition-transform duration-200"
      style={{ 
        top: `${Math.min(pullDistance, 80)}px`,
        transform: `translateY(-50%)`
      }}
    >
      <div 
        className={`
          w-10 h-10 rounded-full bg-primary/90 shadow-lg flex items-center justify-center
          transition-all duration-200
          ${shouldTrigger || isRefreshing ? 'scale-110' : 'scale-100'}
        `}
        style={{
          opacity: Math.min(progress * 1.5, 1)
        }}
      >
        {isRefreshing ? (
          <Loader2 className="w-5 h-5 text-primary-foreground animate-spin" />
        ) : (
          <ArrowDown 
            className={`w-5 h-5 text-primary-foreground transition-transform duration-200 ${
              shouldTrigger ? 'rotate-180' : ''
            }`}
            style={{
              transform: `rotate(${progress * 180}deg)`
            }}
          />
        )}
      </div>
    </div>
  );
};
