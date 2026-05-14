'use client';

import { ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: ReactNode;
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'indigo';
  loading?: boolean;
}

// const colorClasses = {
//   blue: 'from-blue-500 to-blue-600',
//   green: 'from-green-500 to-green-600',
//   purple: 'from-purple-500 to-purple-600',
//   orange: 'from-orange-500 to-orange-600',
//   red: 'from-red-500 to-red-600',
//   indigo: 'from-indigo-500 to-indigo-600'
// };

const iconColorClasses = {
  blue: 'text-blue-600 bg-blue-100',
  green: 'text-green-600 bg-green-100',
  purple: 'text-purple-600 bg-purple-100',
  orange: 'text-orange-600 bg-orange-100',
  red: 'text-red-600 bg-red-100',
  indigo: 'text-indigo-600 bg-indigo-100'
};

export default function MetricCard({
  title,
  value,
  change,
  changeType = 'neutral',
  icon,
  color = 'blue',
  loading = false
}: MetricCardProps) {
  const getTrendIcon = () => {
    if (changeType === 'positive') return <TrendingUp className="h-4 w-4" />;
    if (changeType === 'negative') return <TrendingDown className="h-4 w-4" />;
    return <Minus className="h-4 w-4" />;
  };

  const getTrendColor = () => {
    if (changeType === 'positive') return 'text-green-600';
    if (changeType === 'negative') return 'text-red-600';
    return 'text-gray-500';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-24"></div>
            <div className="h-8 bg-gray-200 rounded w-16"></div>
          </div>
          <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200 group">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mb-2">{value}</p>
          {change !== undefined && (
            <div className={`flex items-center space-x-1 ${getTrendColor()}`}>
              {getTrendIcon()}
              <span className="text-sm font-medium">
                {change > 0 ? '+' : ''}{change}%
              </span>
              <span className="text-xs text-gray-500">vs mes anterior</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${iconColorClasses[color]} group-hover:scale-110 transition-transform duration-200`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
