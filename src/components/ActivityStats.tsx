import {
  Activity,
  Clock,
  MapPin,
  Flame,
  Heart,
  Mountain,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import type { JsActivityStats } from '../types/tcx';
import {
  formatDuration,
  formatDistance,
  formatTime,
  formatElevation,
  formatHeartRate,
  formatPace,
} from '../lib/format';

interface ActivityStatsProps {
  stats: JsActivityStats;
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subValue?: string;
  className?: string;
}

function StatCard({ icon, label, value, subValue, className = '' }: StatCardProps) {
  return (
    <div
      className={`flex items-start gap-3 p-4 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 ${className}`}
    >
      <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
          {label}
        </p>
        <p className="text-lg font-semibold text-slate-900 dark:text-slate-100 truncate">
          {value}
        </p>
        {subValue && (
          <p className="text-xs text-slate-400 dark:text-slate-500 truncate">
            {subValue}
          </p>
        )}
      </div>
    </div>
  );
}

export function ActivityStats({ stats }: ActivityStatsProps) {
  const avgPace =
    stats.total_time_seconds > 0 && stats.total_distance_meters > 0
      ? stats.total_distance_meters / stats.total_time_seconds
      : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
          <Activity className="w-5 h-5 text-primary-600 dark:text-primary-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {stats.sport}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {formatTime(stats.start_time)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <StatCard
          icon={<Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
          label="Duration"
          value={formatDuration(stats.total_time_seconds)}
        />

        <StatCard
          icon={<MapPin className="w-5 h-5 text-green-600 dark:text-green-400" />}
          label="Distance"
          value={formatDistance(stats.total_distance_meters)}
          subValue={formatPace(avgPace)}
        />

        <StatCard
          icon={<Flame className="w-5 h-5 text-orange-600 dark:text-orange-400" />}
          label="Calories"
          value={`${stats.total_calories}`}
        />

        {stats.avg_heart_rate !== null && (
          <StatCard
            icon={<Heart className="w-5 h-5 text-red-600 dark:text-red-400" />}
            label="Avg Heart Rate"
            value={formatHeartRate(stats.avg_heart_rate)}
            subValue={`Max: ${formatHeartRate(stats.max_heart_rate)}`}
          />
        )}

        {stats.elevation_gain !== null && (
          <StatCard
            icon={<TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
            label="Elevation Gain"
            value={formatElevation(stats.elevation_gain)}
          />
        )}

        {stats.elevation_loss !== null && (
          <StatCard
            icon={<TrendingDown className="w-5 h-5 text-amber-600 dark:text-amber-400" />}
            label="Elevation Loss"
            value={formatElevation(stats.elevation_loss)}
          />
        )}

        {stats.max_altitude !== null && (
          <StatCard
            icon={<Mountain className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />}
            label="Max Altitude"
            value={formatElevation(stats.max_altitude)}
            subValue={`Min: ${formatElevation(stats.min_altitude)}`}
          />
        )}
      </div>

      <p className="text-xs text-slate-400 dark:text-slate-500 text-center">
        {stats.trackpoint_count} trackpoints
      </p>
    </div>
  );
}
