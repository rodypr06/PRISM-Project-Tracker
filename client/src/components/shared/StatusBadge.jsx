import { cn } from '@/lib/utils';

export default function StatusBadge({ status, size = 'md' }) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5'
  };

  const statusConfig = {
    'Not Started': {
      bg: 'bg-gray-500/20',
      text: 'text-gray-300',
      border: 'border-gray-500/30',
      dotColor: 'bg-gray-400',
      shadow: 'shadow-gray-500/20'
    },
    'In Progress': {
      bg: 'bg-amber-500/20',
      text: 'text-amber-300',
      border: 'border-amber-500/30',
      dotColor: 'bg-amber-400',
      shadow: 'shadow-amber-500/30'
    },
    'Completed': {
      bg: 'bg-emerald-500/20',
      text: 'text-emerald-300',
      border: 'border-emerald-500/30',
      dotColor: 'bg-emerald-400',
      shadow: 'shadow-emerald-500/30'
    },
    'Blocked': {
      bg: 'bg-rose-500/20',
      text: 'text-rose-300',
      border: 'border-rose-500/30',
      dotColor: 'bg-rose-400',
      shadow: 'shadow-rose-500/30'
    }
  };

  const config = statusConfig[status] || statusConfig['Not Started'];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full font-semibold border backdrop-blur-sm transition-all hover:scale-105',
        config.bg,
        config.text,
        config.border,
        config.shadow,
        'shadow-lg',
        sizeClasses[size]
      )}
    >
      <span className={cn('w-2 h-2 rounded-full', config.dotColor, status === 'In Progress' && 'animate-pulse')}></span>
      {status}
    </span>
  );
}
