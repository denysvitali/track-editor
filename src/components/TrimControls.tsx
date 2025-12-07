import { useCallback, useMemo } from 'react';
import { Scissors, RotateCcw, Download, Play, Flag } from 'lucide-react';
import type { JsTrackpoint, TrimRange } from '../types/tcx';
import { formatDuration, formatDistance } from '../lib/format';

interface TrimControlsProps {
  trackpoints: JsTrackpoint[];
  trimRange: TrimRange;
  originalCount: number;
  onTrimRangeChange: (range: TrimRange) => void;
  onApplyTrim: () => void;
  onReset: () => void;
  onExport: () => void;
}

export function TrimControls({
  trackpoints,
  trimRange,
  originalCount,
  onTrimRangeChange,
  onApplyTrim,
  onReset,
  onExport,
}: TrimControlsProps) {
  const maxIndex = trackpoints.length - 1;

  const { startTime, endTime, trimmedDuration, trimmedDistance } = useMemo(() => {
    const startTp = trackpoints[trimRange.start];
    const endTp = trackpoints[trimRange.end];
    const firstTp = trackpoints[0];

    if (!startTp || !endTp || !firstTp) {
      return {
        startTime: 0,
        endTime: 0,
        trimmedDuration: 0,
        trimmedDistance: 0,
      };
    }

    const startTime = (startTp.timestamp_ms - firstTp.timestamp_ms) / 1000;
    const endTime = (endTp.timestamp_ms - firstTp.timestamp_ms) / 1000;
    const duration = (endTp.timestamp_ms - startTp.timestamp_ms) / 1000;
    const distance =
      (endTp.distance_meters || 0) - (startTp.distance_meters || 0);

    return {
      startTime,
      endTime,
      trimmedDuration: duration,
      trimmedDistance: distance,
    };
  }, [trackpoints, trimRange]);

  const handleStartChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newStart = parseInt(e.target.value, 10);
      if (newStart <= trimRange.end) {
        onTrimRangeChange({ ...trimRange, start: newStart });
      }
    },
    [trimRange, onTrimRangeChange]
  );

  const handleEndChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newEnd = parseInt(e.target.value, 10);
      if (newEnd >= trimRange.start) {
        onTrimRangeChange({ ...trimRange, end: newEnd });
      }
    },
    [trimRange, onTrimRangeChange]
  );

  const isTrimmed = trimRange.start > 0 || trimRange.end < maxIndex;
  const trimmedPoints = trimRange.end - trimRange.start + 1;
  const removedPoints = originalCount - trimmedPoints;

  return (
    <div className="space-y-6">
      {/* Trim Preview Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
            Trimmed Duration
          </p>
          <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {formatDuration(trimmedDuration)}
          </p>
        </div>
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
            Trimmed Distance
          </p>
          <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {formatDistance(trimmedDistance)}
          </p>
        </div>
      </div>

      {/* Start Slider */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Play className="w-4 h-4 text-green-600 dark:text-green-400" />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Start Point
            </span>
          </div>
          <span className="text-sm text-slate-500 dark:text-slate-400">
            {formatDuration(startTime)}
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={maxIndex}
          value={trimRange.start}
          onChange={handleStartChange}
          className="w-full"
          style={
            {
              '--range-progress': `${(trimRange.start / maxIndex) * 100}%`,
            } as React.CSSProperties
          }
        />
        <div className="flex justify-between text-xs text-slate-400 dark:text-slate-500">
          <span>0:00</span>
          <span>Point {trimRange.start}</span>
        </div>
      </div>

      {/* End Slider */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flag className="w-4 h-4 text-red-600 dark:text-red-400" />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              End Point
            </span>
          </div>
          <span className="text-sm text-slate-500 dark:text-slate-400">
            {formatDuration(endTime)}
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={maxIndex}
          value={trimRange.end}
          onChange={handleEndChange}
          className="w-full"
          style={
            {
              '--range-progress': `${(trimRange.end / maxIndex) * 100}%`,
            } as React.CSSProperties
          }
        />
        <div className="flex justify-between text-xs text-slate-400 dark:text-slate-500">
          <span>Point {trimRange.end}</span>
          <span>{formatDuration((trackpoints[maxIndex]?.timestamp_ms - trackpoints[0]?.timestamp_ms) / 1000)}</span>
        </div>
      </div>

      {/* Points Summary */}
      {isTrimmed && (
        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            <strong>{removedPoints}</strong> trackpoints will be removed
            ({trimmedPoints} remaining)
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col gap-3">
        <button
          onClick={onApplyTrim}
          disabled={!isTrimmed}
          className={`
            flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all
            ${
              isTrimmed
                ? 'bg-primary-600 hover:bg-primary-700 text-white shadow-lg shadow-primary-600/25'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
            }
          `}
        >
          <Scissors className="w-5 h-5" />
          Apply Trim
        </button>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onReset}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg font-medium transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>

          <button
            onClick={onExport}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>
    </div>
  );
}
