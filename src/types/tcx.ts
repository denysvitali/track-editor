export interface JsTrackpoint {
  time: string;
  timestamp_ms: number;
  latitude: number | null;
  longitude: number | null;
  altitude_meters: number | null;
  distance_meters: number | null;
  heart_rate: number | null;
  cadence: number | null;
}

export interface JsActivityStats {
  sport: string;
  start_time: string;
  total_time_seconds: number;
  total_distance_meters: number;
  total_calories: number;
  trackpoint_count: number;
  avg_heart_rate: number | null;
  max_heart_rate: number | null;
  min_heart_rate: number | null;
  elevation_gain: number | null;
  elevation_loss: number | null;
  max_altitude: number | null;
  min_altitude: number | null;
}

export interface TrimRange {
  start: number;
  end: number;
}

export interface ActivityData {
  stats: JsActivityStats;
  trackpoints: JsTrackpoint[];
  fileName: string;
}
