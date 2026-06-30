import { AlertCircle, RefreshCw, Inbox, Loader2 } from 'lucide-react';
import { Button } from './ui/button';

export function TableSkeleton({ rows = 5, cols = 8 }: { rows?: number; cols?: number }) {
  return (
    <div className="divide-y divide-gray-100 dark:divide-gray-800">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-4 px-4 py-3">
          {Array.from({ length: cols }).map((_, c) => (
            <div
              key={c}
              className={`h-3.5 rounded bg-gray-100 dark:bg-gray-800 animate-pulse ${
                c === 0 ? 'w-3' : c === 1 ? 'w-28' : c === 2 ? 'w-20' : c === cols - 1 ? 'w-16' : 'w-16'
              }`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 space-y-4 animate-pulse">
      <div className="space-y-2">
        <div className="h-3.5 w-1/2 rounded bg-gray-100 dark:bg-gray-800" />
        <div className="h-3 w-3/4 rounded bg-gray-100 dark:bg-gray-800" />
      </div>
      <div className="h-6 w-20 rounded bg-gray-100 dark:bg-gray-800" />
      <div className="grid grid-cols-3 gap-2">
        {[0, 1, 2].map(i => (
          <div key={i} className="h-14 rounded-lg bg-gray-100 dark:bg-gray-800" />
        ))}
      </div>
      <div className="flex gap-1.5">
        {[0, 1, 2].map(i => (
          <div key={i} className="h-5 w-16 rounded bg-gray-100 dark:bg-gray-800" />
        ))}
      </div>
    </div>
  );
}

interface EmptyStateProps {
  title?: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}

export function EmptyState({
  title = 'No results',
  description = 'Try adjusting your search or filter criteria.',
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
        <Inbox className="w-5 h-5 text-gray-400 dark:text-gray-500" />
      </div>
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{title}</p>
      <p className="text-xs text-gray-400 dark:text-gray-500 max-w-xs">{description}</p>
      {action && (
        <Button
          variant="outline"
          size="sm"
          className="mt-4 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = 'Could not load data',
  description = 'An error occurred while fetching this page. Please try again.',
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-4">
        <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400" />
      </div>
      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">{title}</p>
      <p className="text-xs text-gray-400 dark:text-gray-500 max-w-xs mb-4">{description}</p>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          className="gap-2 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
          onClick={onRetry}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Retry
        </Button>
      )}
    </div>
  );
}

export function InProgressIndicator({ label = 'In progress' }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400">
      <Loader2 className="w-3.5 h-3.5 animate-spin" />
      {label}
    </span>
  );
}
