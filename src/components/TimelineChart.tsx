import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
} from 'recharts';
import type { JsTrackpoint, TrimRange } from '../types/tcx';
import { formatDuration } from '../lib/format';

interface TimelineChartProps {
  trackpoints: JsTrackpoint[];
  trimRange: TrimRange;
  dataType: 'heart_rate' | 'altitude' | 'pace';
}

interface ChartData {
  index: number;
  time: number;
  value: number | null;
  inRange: boolean;
}

export function TimelineChart({ trackpoints, trimRange, dataType }: TimelineChartProps) {
  const { data, minY, maxY, unit, color, label } = useMemo(() => {
    const startTime = trackpoints[0]?.timestamp_ms || 0;

    const chartData: ChartData[] = trackpoints.map((tp, idx) => {
      let value: number | null = null;

      switch (dataType) {
        case 'heart_rate':
          value = tp.heart_rate;
          break;
        case 'altitude':
          value = tp.altitude_meters;
          break;
        case 'pace': {
          // Calculate pace as min/km using distance and time delta
          if (idx > 0 && tp.distance_meters !== null) {
            const prevTp = trackpoints[idx - 1];
            const timeDelta = (tp.timestamp_ms - prevTp.timestamp_ms) / 1000;
            const distDelta = tp.distance_meters - (prevTp.distance_meters || 0);
            if (distDelta > 0 && timeDelta > 0) {
              // Convert to min/km
              value = (timeDelta / distDelta) * 1000 / 60;
              // Clamp unreasonable values
              if (value > 20) value = 20;
            }
          }
          break;
        }
      }

      return {
        index: idx,
        time: (tp.timestamp_ms - startTime) / 1000,
        value,
        inRange: idx >= trimRange.start && idx <= trimRange.end,
      };
    });

    const validValues = chartData
      .filter((d) => d.value !== null)
      .map((d) => d.value as number);

    const minVal = validValues.length > 0 ? Math.min(...validValues) : 0;
    const maxVal = validValues.length > 0 ? Math.max(...validValues) : 100;
    const padding = (maxVal - minVal) * 0.1 || 10;

    const configs = {
      heart_rate: { unit: 'bpm', color: '#ef4444', label: 'Heart Rate' },
      altitude: { unit: 'm', color: '#10b981', label: 'Altitude' },
      pace: { unit: 'min/km', color: '#f59e0b', label: 'Pace' },
    };

    return {
      data: chartData,
      minY: Math.max(0, minVal - padding),
      maxY: maxVal + padding,
      ...configs[dataType],
    };
  }, [trackpoints, trimRange, dataType]);

  const formatYAxis = (value: number) => {
    if (dataType === 'pace') {
      const mins = Math.floor(value);
      const secs = Math.round((value - mins) * 60);
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    return Math.round(value).toString();
  };

  const formatTooltipValue = (value: number) => {
    if (dataType === 'pace') {
      const mins = Math.floor(value);
      const secs = Math.round((value - mins) * 60);
      return `${mins}:${secs.toString().padStart(2, '0')} ${unit}`;
    }
    return `${Math.round(value)} ${unit}`;
  };

  if (data.every((d) => d.value === null)) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-50 dark:bg-slate-800/50 rounded-lg">
        <p className="text-sm text-slate-400 dark:text-slate-500">
          No {label.toLowerCase()} data available
        </p>
      </div>
    );
  }

  const trimStartTime = data[trimRange.start]?.time || 0;
  const trimEndTime = data[trimRange.end]?.time || 0;

  return (
    <div className="h-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`gradient-${dataType}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#e2e8f0"
            className="dark:opacity-20"
          />

          <XAxis
            dataKey="time"
            tickFormatter={(value) => formatDuration(value)}
            stroke="#94a3b8"
            fontSize={11}
            tickLine={false}
            axisLine={false}
          />

          <YAxis
            domain={[minY, maxY]}
            tickFormatter={formatYAxis}
            stroke="#94a3b8"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            width={45}
          />

          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            }}
            labelFormatter={(value) => `Time: ${formatDuration(value as number)}`}
            formatter={(value: number) => [formatTooltipValue(value), label]}
          />

          {/* Highlight trimmed area */}
          <ReferenceArea
            x1={trimStartTime}
            x2={trimEndTime}
            fill={color}
            fillOpacity={0.1}
          />

          {/* Trim start line */}
          <ReferenceLine
            x={trimStartTime}
            stroke="#22c55e"
            strokeWidth={2}
            strokeDasharray="4 4"
          />

          {/* Trim end line */}
          <ReferenceLine
            x={trimEndTime}
            stroke="#ef4444"
            strokeWidth={2}
            strokeDasharray="4 4"
          />

          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fill={`url(#gradient-${dataType})`}
            connectNulls
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
