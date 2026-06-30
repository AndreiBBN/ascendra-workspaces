import { Card, CardContent } from './ui/card';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  trend?: 'up' | 'down';
  trendValue?: string;
}

export function MetricCard({ title, value, subtext, trend, trendValue }: MetricCardProps) {
  return (
    <Card className="dark:bg-gray-900 dark:border-gray-700">
      <CardContent className="pt-6">
        <div className="space-y-2">
          <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
          <div className="flex items-end gap-2">
            <p className="text-3xl font-semibold text-gray-900 dark:text-gray-50">{value}</p>
            {trend && trendValue && (
              <div className={`flex items-center gap-0.5 text-sm pb-1 ${
                trend === 'up' ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'
              }`}>
                {trend === 'up' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                <span>{trendValue}</span>
              </div>
            )}
          </div>
          {subtext && <p className="text-sm text-gray-500 dark:text-gray-400">{subtext}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
