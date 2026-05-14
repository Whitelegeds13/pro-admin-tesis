'use client';

import { useEffect, useRef } from 'react';

interface ChartData {
  label: string;
  value: number;
  color?: string;
}

interface SimpleChartProps {
  data: ChartData[];
  type?: 'bar' | 'line' | 'doughnut';
  height?: number;
  showLegend?: boolean;
}

export default function SimpleChart({ 
  data, 
  type = 'bar', 
  height = 200, 
  showLegend = true 
}: SimpleChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data.length) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    canvas.width = rect.width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    
    canvas.style.width = rect.width + 'px';
    canvas.style.height = height + 'px';

    // Clear canvas
    ctx.clearRect(0, 0, rect.width, height);

    const maxValue = Math.max(...data.map(d => d.value));
    const colors = [
      '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#06B6D4'
    ];

    if (type === 'bar') {
      const barWidth = rect.width / data.length * 0.8;
      const barSpacing = rect.width / data.length * 0.2;
      
      data.forEach((item, index) => {
        const barHeight = (item.value / maxValue) * (height - 40);
        const x = index * (barWidth + barSpacing) + barSpacing / 2;
        const y = height - barHeight - 20;
        
        ctx.fillStyle = item.color || colors[index % colors.length];
        ctx.fillRect(x, y, barWidth, barHeight);
        
        // Label
        ctx.fillStyle = '#374151';
        ctx.font = '12px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(item.label, x + barWidth / 2, height - 5);
        
        // Value
        ctx.fillText(item.value.toString(), x + barWidth / 2, y - 5);
      });
    } else if (type === 'line') {
      const pointSpacing = rect.width / (data.length - 1);
      
      ctx.strokeStyle = colors[0];
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      data.forEach((item, index) => {
        const x = index * pointSpacing;
        const y = height - 20 - (item.value / maxValue) * (height - 40);
        
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      
      ctx.stroke();
      
      // Points
      data.forEach((item, index) => {
        const x = index * pointSpacing;
        const y = height - 20 - (item.value / maxValue) * (height - 40);
        
        ctx.fillStyle = colors[0];
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fill();
        
        // Label
        ctx.fillStyle = '#374151';
        ctx.font = '12px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(item.label, x, height - 5);
      });
    } else if (type === 'doughnut') {
      const centerX = rect.width / 2;
      const centerY = height / 2;
      const radius = Math.min(rect.width, height) / 2 - 20;
      const innerRadius = radius * 0.6;
      
      let currentAngle = 0;
      const total = data.reduce((sum, item) => sum + item.value, 0);
      
      data.forEach((item, index) => {
        const sliceAngle = (item.value / total) * 2 * Math.PI;
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
        ctx.arc(centerX, centerY, innerRadius, currentAngle + sliceAngle, currentAngle, true);
        ctx.closePath();
        
        ctx.fillStyle = item.color || colors[index % colors.length];
        ctx.fill();
        
        currentAngle += sliceAngle;
      });
    }
  }, [data, type, height]);

  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <div className="text-center">
          <div className="text-4xl mb-2">📊</div>
          <p>No hay datos para mostrar</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <canvas
        ref={canvasRef}
        className="w-full"
        style={{ height: `${height}px` }}
      />
      {showLegend && type === 'doughnut' && (
        <div className="mt-4 flex flex-wrap gap-2 justify-center">
          {data.map((item, index) => (
            <div key={index} className="flex items-center space-x-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color || `#${Math.floor(Math.random()*16777215).toString(16)}` }}
              />
              <span className="text-sm text-gray-600">{item.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
