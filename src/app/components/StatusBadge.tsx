import { Badge } from './ui/badge';
import type { VMStatus, VMUsageHealth } from '../api/workspacesApi';

interface StatusBadgeProps {
  status: VMStatus;
}

const statusStyles: Record<VMStatus, string> = {
  running:  'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
  stopped:  'bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600',
  starting: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
  stopping: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
  error:    'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <Badge variant="outline" className={statusStyles[status]}>
      {status}
    </Badge>
  );
}

interface UsageHealthBadgeProps {
  health: VMUsageHealth;
}

const healthStyles: Record<VMUsageHealth, string> = {
  idle:      'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800',
  underused: 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800',
  high:      'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800',
  healthy:   'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800',
};

const healthLabels: Record<VMUsageHealth, string> = {
  idle:      'Idle',
  underused: 'Underused',
  high:      'High usage',
  healthy:   'Healthy',
};

export function UsageHealthBadge({ health }: UsageHealthBadgeProps) {
  return (
    <Badge variant="outline" className={`text-[10px] h-4 px-1.5 ${healthStyles[health]}`}>
      {healthLabels[health]}
    </Badge>
  );
}
