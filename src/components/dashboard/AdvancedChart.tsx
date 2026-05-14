'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, BarChart3, PieChart, Activity } from 'lucide-react';

interface ChartData {
  label: string;
  value: number;
  color?: string;
}

interface AdvancedChartProps {
  data: ChartData[];
  type: 'line' | 'bar' | 'doughnut' | 'area';
  title: string;
  subtitle?: string;
  height?: number;
  loading?: boolean;
  interactive?: boolean;
  showTrend?: boolean;
  trendValue?: number;
}

export default function AdvancedChart({
  data,
  type,
  title,
  subtitle,
  height = 300,
  loading = false,
  // interactive = true,
  showTrend = true,
  trendValue
}: AdvancedChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [animationProgress, setAnimationProgress] = useState(0);

  useEffect(() => {
    if (loading) return;
    
    const timer = setTimeout(() => {
      setAnimationProgress(1);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [loading]);

  const maxValue = Math.max(...data.map(d => d.value));
  const totalValue = data.reduce((sum, d) => sum + d.value, 0);

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200/50 backdrop-blur-sm animate-pulse">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="h-6 bg-gray-300 rounded w-48 mb-2"></div>
            <div className="h-4 bg-gray-300 rounded w-32"></div>
          </div>
          <div className="h-8 w-8 bg-gray-300 rounded-lg"></div>
        </div>
        <div className="h-64 bg-gray-300 rounded-lg"></div>
      </div>
    );
  }

  const renderLineChart = () => {
    const points = data.map((item, index) => {
      const x = (index / (data.length - 1)) * 100;
      const y = 100 - (item.value / maxValue) * 100;
      return `${x},${y}`;
    }).join(' ');

    return (
      <div className="relative">
        <svg width="100%" height={height} viewBox="0 0 100 100" className="overflow-visible">
          {/* Grid Lines */}
          <defs>
            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.1"/>
            </pattern>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.8"/>
              <stop offset="100%" stopColor="currentColor" stopOpacity="0.1"/>
            </linearGradient>
          </defs>
          
          <rect width="100" height="100" fill="url(#grid)" />
          
          {/* Area Fill */}
          <polygon
            points={`0,100 ${points} 100,100`}
            fill="url(#lineGradient)"
            className="text-blue-500"
            style={{ opacity: animationProgress }}
          />
          
          {/* Line */}
          <polyline
            points={points}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-blue-600"
            style={{ 
              strokeDasharray: '1000',
              strokeDashoffset: animationProgress * 1000,
              transition: 'stroke-dashoffset 2s ease-in-out'
            }}
          />
          
          {/* Data Points */}
          {data.map((item, index) => {
            const x = (index / (data.length - 1)) * 100;
            const y = 100 - (item.value / maxValue) * 100;
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r={hoveredIndex === index ? 4 : 2}
                fill="currentColor"
                className="text-blue-600 transition-all duration-300 cursor-pointer"
                style={{ opacity: animationProgress }}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
            );
          })}
        </svg>
        
        {/* Labels */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-500 mt-2">
          {data.map((item, index) => (
            <span key={index} className="text-center">{item.label}</span>
          ))}
        </div>
      </div>
    );
  };

  const renderBarChart = () => {
    return (
      <div className="flex items-end justify-between h-full space-x-2">
        {data.map((item, index) => {
          const height = (item.value / maxValue) * 100;
          return (
            <div key={index} className="flex-1 flex flex-col items-center group">
              <div className="relative w-full flex flex-col items-center">
                <div
                  className={`w-full rounded-t-lg transition-all duration-1000 ease-out ${
                    item.color || 'bg-blue-500'
                  }`}
                  style={{ 
                    height: `${height * animationProgress}%`,
                    minHeight: '4px'
                  }}
                ></div>
                
                {/* Value Label */}
                <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded">
                    {item.value.toLocaleString()}
                  </div>
                </div>
              </div>
              
              <div className="text-xs text-gray-500 mt-2 text-center">{item.label}</div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderDoughnutChart = () => {
    let cumulativePercentage = 0;
    const radius = 40;
    const strokeWidth = 8;

    return (
      <div className="flex items-center justify-center h-full">
        <svg width="200" height="200" viewBox="0 0 100 100" className="transform -rotate-90">
          {data.map((item, index) => {
            const percentage = (item.value / totalValue) * 100;
            const circumference = 2 * Math.PI * radius;
            const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
            const strokeDashoffset = -cumulativePercentage * circumference / 100;
            
            cumulativePercentage += percentage;
            
            return (
              <circle
                key={index}
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                stroke={item.color || `hsl(${index * 60}, 70%, 50%)`}
                strokeWidth={strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-1000 ease-out"
                style={{ 
                  strokeDasharray: animationProgress ? strokeDasharray : `0 ${circumference}`,
                  strokeDashoffset: animationProgress ? strokeDashoffset : 0
                }}
              />
            );
          })}
        </svg>
        
        {/* Center Text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{totalValue.toLocaleString()}</div>
            <div className="text-sm text-gray-500">Total</div>
          </div>
        </div>
      </div>
    );
  };

  const renderAreaChart = () => {
    const points = data.map((item, index) => {
      const x = (index / (data.length - 1)) * 100;
      const y = 100 - (item.value / maxValue) * 100;
      return `${x},${y}`;
    }).join(' ');

    return (
      <div className="relative">
        <svg width="100%" height={height} viewBox="0 0 100 100" className="overflow-visible">
          <defs>
            <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.3"/>
              <stop offset="100%" stopColor="currentColor" stopOpacity="0.05"/>
            </linearGradient>
          </defs>
          
          <polygon
            points={`0,100 ${points} 100,100`}
            fill="url(#areaGradient)"
            className="text-purple-500"
            style={{ opacity: animationProgress }}
          />
          
          <polyline
            points={points}
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            className="text-purple-600"
            style={{ 
              strokeDasharray: '1000',
              strokeDashoffset: animationProgress * 1000,
              transition: 'stroke-dashoffset 2s ease-in-out'
            }}
          />
        </svg>
      </div>
    );
  };

  const getChartIcon = () => {
    switch (type) {
      case 'line': return <TrendingUp className="h-5 w-5" />;
      case 'bar': return <BarChart3 className="h-5 w-5" />;
      case 'doughnut': return <PieChart className="h-5 w-5" />;
      case 'area': return <Activity className="h-5 w-5" />;
      default: return <BarChart3 className="h-5 w-5" />;
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 shadow-xl hover:shadow-2xl transition-all duration-500 group">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-1">{title}</h3>
          {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-gray-100 text-gray-600">
            {getChartIcon()}
          </div>
          
          {showTrend && trendValue && (
            <div className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium ${
              trendValue > 0 ? 'bg-green-100 text-green-700' : 
              trendValue < 0 ? 'bg-red-100 text-red-700' : 
              'bg-gray-100 text-gray-700'
            }`}>
              {trendValue > 0 ? <TrendingUp className="h-4 w-4" /> : 
               trendValue < 0 ? <TrendingDown className="h-4 w-4" /> : 
               <Activity className="h-4 w-4" />}
              <span>{Math.abs(trendValue)}%</span>
            </div>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="relative" style={{ height: `${height}px` }}>
        {type === 'line' && renderLineChart()}
        {type === 'bar' && renderBarChart()}
        {type === 'doughnut' && renderDoughnutChart()}
        {type === 'area' && renderAreaChart()}
      </div>

      {/* Legend */}
      {type === 'doughnut' && (
        <div className="mt-4 grid grid-cols-2 gap-2">
          {data.map((item, index) => (
            <div key={index} className="flex items-center space-x-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: item.color || `hsl(${index * 60}, 70%, 50%)` }}
              ></div>
              <span className="text-sm text-gray-600">{item.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
