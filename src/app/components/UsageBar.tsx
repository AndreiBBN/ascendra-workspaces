interface UsageBarProps {
  percentage: number;
  label?: string;
}

export function UsageBar({ percentage, label }: UsageBarProps) {
  const color =
    percentage >= 85 ? 'bg-red-500' :
    percentage >= 70 ? 'bg-amber-500' :
    percentage < 10 ? 'bg-amber-400' :
    'bg-blue-500';

  return (
    <div className="space-y-1">
      {label && (
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">{label}</span>
          <span className="text-gray-900 dark:text-gray-200 tabular-nums">{percentage}%</span>
        </div>
      )}
      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
