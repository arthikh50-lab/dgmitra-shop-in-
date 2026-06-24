import React from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { cn } from '../utils';

interface QuotaErrorBannerProps {
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function QuotaErrorBanner({ 
  message = "We're experiencing high traffic. Some features may be temporarily limited. Please try again later.",
  onRetry,
  className
}: QuotaErrorBannerProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("bg-orange-50 border-b border-orange-100 p-4", className)}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-orange-700">
          <AlertTriangle size={20} className="shrink-0" />
          <p className="text-sm font-medium">
            {message}
          </p>
        </div>
        {onRetry && (
          <button 
            onClick={onRetry}
            className="flex items-center gap-2 px-4 py-2 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-full text-xs font-bold transition-colors"
          >
            <RefreshCw size={14} />
            Retry
          </button>
        )}
      </div>
    </motion.div>
  );
}
