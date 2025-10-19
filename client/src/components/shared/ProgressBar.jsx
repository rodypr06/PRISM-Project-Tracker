import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function ProgressBar({
  percentage = 0,
  label = null,
  showPercentage = true,
  size = 'md',
  variant = 'default'
}) {
  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4'
  };

  const variantConfig = {
    default: {
      bg: 'bg-slate-800/50',
      fill: 'bg-gradient-to-r from-cyan-500 via-cyan-400 to-blue-500',
      shadow: 'shadow-cyan-500/50'
    },
    success: {
      bg: 'bg-slate-800/50',
      fill: 'bg-gradient-to-r from-emerald-500 via-emerald-400 to-green-400',
      shadow: 'shadow-emerald-500/50'
    },
    warning: {
      bg: 'bg-slate-800/50',
      fill: 'bg-gradient-to-r from-amber-500 via-amber-400 to-orange-400',
      shadow: 'shadow-amber-500/50'
    },
    danger: {
      bg: 'bg-slate-800/50',
      fill: 'bg-gradient-to-r from-rose-500 via-rose-400 to-red-400',
      shadow: 'shadow-rose-500/50'
    }
  };

  const config = variantConfig[variant] || variantConfig.default;
  const clampedPercentage = Math.min(100, Math.max(0, percentage));

  return (
    <div className="w-full">
      {(label || showPercentage) && (
        <div className="flex justify-between items-center mb-2">
          {label && <span className="text-sm text-gray-300">{label}</span>}
          {showPercentage && (
            <span className="text-sm font-medium text-gray-400">
              {clampedPercentage.toFixed(0)}%
            </span>
          )}
        </div>
      )}
      <div
        className={cn(
          'w-full rounded-full overflow-hidden backdrop-blur-sm border border-white/10',
          config.bg,
          sizeClasses[size]
        )}
      >
        <motion.div
          className={cn(
            'h-full rounded-full shadow-lg',
            config.fill,
            config.shadow
          )}
          initial={{ width: 0 }}
          animate={{ width: `${clampedPercentage}%` }}
          transition={{
            duration: 1.2,
            ease: [0.4, 0, 0.2, 1]
          }}
        />
      </div>
    </div>
  );
}
