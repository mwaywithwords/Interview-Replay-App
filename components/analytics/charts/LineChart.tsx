'use client';

import { cn } from '@/lib/utils';

interface LineChartProps {
  data: Array<{ label: string; value: number }>;
  maxValue?: number;
  height?: number;
  className?: string;
  accent?: 'primary' | 'info' | 'success';
}

const accentColors = {
  primary: 'var(--primary)',
  info: 'var(--info)',
  success: 'var(--success)',
};

export function LineChart({
  data,
  maxValue,
  height = 160,
  className,
  accent = 'primary',
}: LineChartProps) {
  if (data.length === 0) {
    return (
      <div className={cn('flex h-40 items-center justify-center text-sm text-muted-foreground', className)}>
        No data yet
      </div>
    );
  }

  const max = maxValue ?? Math.max(...data.map((d) => d.value), 1);
  const width = 100;
  const padding = 4;
  const innerH = height - padding * 2;

  const points = data.map((d, i) => {
    const x = padding + (i / Math.max(data.length - 1, 1)) * (width - padding * 2);
    const y = padding + innerH - (d.value / max) * innerH;
    return { x, y, ...d };
  });

  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;
  const color = accentColors[accent];

  return (
    <div className={cn('w-full', className)}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full overflow-visible"
        preserveAspectRatio="none"
        role="img"
        aria-label="Line chart"
      >
        <defs>
          <linearGradient id={`line-fill-${accent}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((ratio) => (
          <line
            key={ratio}
            x1={padding}
            x2={width - padding}
            y1={padding + innerH * (1 - ratio)}
            y2={padding + innerH * (1 - ratio)}
            stroke="var(--border)"
            strokeWidth="0.3"
            strokeDasharray="1 1"
          />
        ))}
        <path d={areaPath} fill={`url(#line-fill-${accent})`} />
        <path
          d={linePath}
          fill="none"
          stroke={color}
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {points.map((p) => (
          <circle
            key={p.label}
            cx={p.x}
            cy={p.y}
            r="1.4"
            fill="var(--card)"
            stroke={color}
            strokeWidth="0.8"
          />
        ))}
      </svg>
      <div className="mt-2 flex justify-between gap-1">
        {data.map((d) => (
          <span
            key={d.label}
            className="flex-1 truncate text-center text-[10px] font-medium text-muted-foreground"
          >
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
}
