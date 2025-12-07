use chrono::{DateTime, FixedOffset};
use quick_xml::de::from_str;
use quick_xml::se::to_string as to_xml_string;
use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;

// Initialize panic hook for better error messages in browser console
#[wasm_bindgen(start)]
pub fn init() {
    console_error_panic_hook::set_once();
}

// ============================================================================
// TCX Data Structures
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename = "TrainingCenterDatabase")]
pub struct TrainingCenterDatabase {
    #[serde(rename = "@xmlns", default)]
    pub xmlns: Option<String>,
    #[serde(rename = "Activities")]
    pub activities: Activities,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Activities {
    #[serde(rename = "Activity")]
    pub activity: Vec<Activity>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Activity {
    #[serde(rename = "@Sport")]
    pub sport: String,
    #[serde(rename = "Id")]
    pub id: String,
    #[serde(rename = "Lap")]
    pub laps: Vec<Lap>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Lap {
    #[serde(rename = "@StartTime")]
    pub start_time: String,
    #[serde(rename = "TotalTimeSeconds")]
    pub total_time_seconds: f64,
    #[serde(rename = "DistanceMeters")]
    pub distance_meters: f64,
    #[serde(rename = "Calories")]
    pub calories: u32,
    #[serde(rename = "Intensity")]
    pub intensity: String,
    #[serde(rename = "TriggerMethod")]
    pub trigger_method: String,
    #[serde(rename = "Track")]
    pub track: Option<Track>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Track {
    #[serde(rename = "Trackpoint", default)]
    pub trackpoints: Vec<Trackpoint>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Trackpoint {
    #[serde(rename = "Time")]
    pub time: String,
    #[serde(rename = "Position")]
    pub position: Option<Position>,
    #[serde(rename = "AltitudeMeters")]
    pub altitude_meters: Option<f64>,
    #[serde(rename = "DistanceMeters")]
    pub distance_meters: Option<f64>,
    #[serde(rename = "HeartRateBpm")]
    pub heart_rate_bpm: Option<HeartRateBpm>,
    #[serde(rename = "Cadence")]
    pub cadence: Option<u32>,
    #[serde(rename = "Extensions")]
    pub extensions: Option<Extensions>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Position {
    #[serde(rename = "LatitudeDegrees")]
    pub latitude_degrees: f64,
    #[serde(rename = "LongitudeDegrees")]
    pub longitude_degrees: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HeartRateBpm {
    #[serde(rename = "Value")]
    pub value: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Extensions {
    #[serde(rename = "$value", default)]
    pub content: Option<String>,
}

// ============================================================================
// JavaScript-friendly data structures
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
#[wasm_bindgen(getter_with_clone)]
pub struct JsTrackpoint {
    pub time: String,
    pub timestamp_ms: f64,
    pub latitude: Option<f64>,
    pub longitude: Option<f64>,
    pub altitude_meters: Option<f64>,
    pub distance_meters: Option<f64>,
    pub heart_rate: Option<u32>,
    pub cadence: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[wasm_bindgen(getter_with_clone)]
pub struct JsActivityStats {
    pub sport: String,
    pub start_time: String,
    pub total_time_seconds: f64,
    pub total_distance_meters: f64,
    pub total_calories: u32,
    pub trackpoint_count: u32,
    pub avg_heart_rate: Option<f64>,
    pub max_heart_rate: Option<u32>,
    pub min_heart_rate: Option<u32>,
    pub elevation_gain: Option<f64>,
    pub elevation_loss: Option<f64>,
    pub max_altitude: Option<f64>,
    pub min_altitude: Option<f64>,
}

// ============================================================================
// Main TCX Editor
// ============================================================================

#[wasm_bindgen]
pub struct TcxEditor {
    database: TrainingCenterDatabase,
    original_xml: String,
}

#[wasm_bindgen]
impl TcxEditor {
    /// Parse a TCX file from XML string
    #[wasm_bindgen(constructor)]
    pub fn new(xml_content: &str) -> Result<TcxEditor, JsValue> {
        let database: TrainingCenterDatabase = from_str(xml_content)
            .map_err(|e| JsValue::from_str(&format!("Failed to parse TCX: {}", e)))?;

        Ok(TcxEditor {
            database,
            original_xml: xml_content.to_string(),
        })
    }

    /// Get all trackpoints as JSON array
    #[wasm_bindgen(js_name = getTrackpoints)]
    pub fn get_trackpoints(&self) -> Result<JsValue, JsValue> {
        let trackpoints = self.collect_trackpoints();
        serde_wasm_bindgen::to_value(&trackpoints)
            .map_err(|e| JsValue::from_str(&format!("Serialization error: {}", e)))
    }

    /// Get activity statistics
    #[wasm_bindgen(js_name = getStats)]
    pub fn get_stats(&self) -> Result<JsValue, JsValue> {
        let stats = self.calculate_stats();
        serde_wasm_bindgen::to_value(&stats)
            .map_err(|e| JsValue::from_str(&format!("Serialization error: {}", e)))
    }

    /// Trim the track to a specific range of trackpoint indices (inclusive)
    #[wasm_bindgen(js_name = trimByIndices)]
    pub fn trim_by_indices(&mut self, start_idx: usize, end_idx: usize) -> Result<(), JsValue> {
        for activity in &mut self.database.activities.activity {
            for lap in &mut activity.laps {
                if let Some(ref mut track) = lap.track {
                    let len = track.trackpoints.len();
                    if start_idx >= len || end_idx >= len || start_idx > end_idx {
                        return Err(JsValue::from_str(&format!(
                            "Invalid indices: start={}, end={}, total={}",
                            start_idx, end_idx, len
                        )));
                    }
                    track.trackpoints = track.trackpoints[start_idx..=end_idx].to_vec();
                }
            }
        }
        self.recalculate_lap_stats();
        Ok(())
    }

    /// Export the (possibly modified) TCX as XML string
    #[wasm_bindgen(js_name = toXml)]
    pub fn to_xml(&self) -> Result<String, JsValue> {
        let xml = to_xml_string(&self.database)
            .map_err(|e| JsValue::from_str(&format!("Failed to serialize TCX: {}", e)))?;

        // Add XML declaration
        let full_xml = format!(
            "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>\n{}",
            xml
        );
        Ok(full_xml)
    }

    /// Get the number of trackpoints
    #[wasm_bindgen(js_name = getTrackpointCount)]
    pub fn get_trackpoint_count(&self) -> usize {
        self.database
            .activities
            .activity
            .iter()
            .flat_map(|a| &a.laps)
            .filter_map(|l| l.track.as_ref())
            .map(|t| t.trackpoints.len())
            .sum()
    }

    /// Reset to original state
    #[wasm_bindgen]
    pub fn reset(&mut self) -> Result<(), JsValue> {
        self.database = from_str(&self.original_xml)
            .map_err(|e| JsValue::from_str(&format!("Failed to parse TCX: {}", e)))?;
        Ok(())
    }
}

impl TcxEditor {
    fn collect_trackpoints(&self) -> Vec<JsTrackpoint> {
        self.database
            .activities
            .activity
            .iter()
            .flat_map(|a| &a.laps)
            .filter_map(|l| l.track.as_ref())
            .flat_map(|t| &t.trackpoints)
            .map(|tp| {
                let timestamp_ms = parse_timestamp(&tp.time)
                    .map(|dt| dt.timestamp_millis() as f64)
                    .unwrap_or(0.0);

                JsTrackpoint {
                    time: tp.time.clone(),
                    timestamp_ms,
                    latitude: tp.position.as_ref().map(|p| p.latitude_degrees),
                    longitude: tp.position.as_ref().map(|p| p.longitude_degrees),
                    altitude_meters: tp.altitude_meters,
                    distance_meters: tp.distance_meters,
                    heart_rate: tp.heart_rate_bpm.as_ref().map(|h| h.value),
                    cadence: tp.cadence,
                }
            })
            .collect()
    }

    fn calculate_stats(&self) -> JsActivityStats {
        let activity = self.database.activities.activity.first();

        let sport = activity.map(|a| a.sport.clone()).unwrap_or_default();
        let start_time = activity.map(|a| a.id.clone()).unwrap_or_default();

        let total_time_seconds: f64 = self.database.activities.activity
            .iter()
            .flat_map(|a| &a.laps)
            .map(|l| l.total_time_seconds)
            .sum();

        let total_distance_meters: f64 = self.database.activities.activity
            .iter()
            .flat_map(|a| &a.laps)
            .map(|l| l.distance_meters)
            .sum();

        let total_calories: u32 = self.database.activities.activity
            .iter()
            .flat_map(|a| &a.laps)
            .map(|l| l.calories)
            .sum();

        let trackpoints: Vec<_> = self.collect_trackpoints();
        let trackpoint_count = trackpoints.len() as u32;

        // Heart rate stats
        let heart_rates: Vec<u32> = trackpoints
            .iter()
            .filter_map(|tp| tp.heart_rate)
            .collect();

        let avg_heart_rate = if !heart_rates.is_empty() {
            Some(heart_rates.iter().map(|&h| h as f64).sum::<f64>() / heart_rates.len() as f64)
        } else {
            None
        };

        let max_heart_rate = heart_rates.iter().max().copied();
        let min_heart_rate = heart_rates.iter().min().copied();

        // Elevation stats
        let altitudes: Vec<f64> = trackpoints
            .iter()
            .filter_map(|tp| tp.altitude_meters)
            .collect();

        let (elevation_gain, elevation_loss) = if altitudes.len() > 1 {
            let mut gain = 0.0;
            let mut loss = 0.0;
            for i in 1..altitudes.len() {
                let diff = altitudes[i] - altitudes[i - 1];
                if diff > 0.0 {
                    gain += diff;
                } else {
                    loss += diff.abs();
                }
            }
            (Some(gain), Some(loss))
        } else {
            (None, None)
        };

        let max_altitude = altitudes.iter().cloned().reduce(f64::max);
        let min_altitude = altitudes.iter().cloned().reduce(f64::min);

        JsActivityStats {
            sport,
            start_time,
            total_time_seconds,
            total_distance_meters,
            total_calories,
            trackpoint_count,
            avg_heart_rate,
            max_heart_rate,
            min_heart_rate,
            elevation_gain,
            elevation_loss,
            max_altitude,
            min_altitude,
        }
    }

    fn recalculate_lap_stats(&mut self) {
        for activity in &mut self.database.activities.activity {
            for lap in &mut activity.laps {
                if let Some(ref track) = lap.track {
                    let trackpoints = &track.trackpoints;

                    if trackpoints.is_empty() {
                        lap.total_time_seconds = 0.0;
                        lap.distance_meters = 0.0;
                        continue;
                    }

                    // Update start time
                    if let Some(first) = trackpoints.first() {
                        lap.start_time = first.time.clone();
                    }

                    // Calculate total time from first to last trackpoint
                    if let (Some(first), Some(last)) = (trackpoints.first(), trackpoints.last()) {
                        if let (Some(start), Some(end)) = (
                            parse_timestamp(&first.time),
                            parse_timestamp(&last.time),
                        ) {
                            let duration = end.signed_duration_since(start);
                            lap.total_time_seconds = duration.num_milliseconds() as f64 / 1000.0;
                        }
                    }

                    // Calculate distance
                    if let (Some(first), Some(last)) = (trackpoints.first(), trackpoints.last()) {
                        let start_dist = first.distance_meters.unwrap_or(0.0);
                        let end_dist = last.distance_meters.unwrap_or(0.0);
                        lap.distance_meters = end_dist - start_dist;
                    }

                    // Recalculate calories proportionally (rough estimate)
                    // This is a simplification - real calorie calculation is complex
                }
            }

            // Update activity ID to match new start time
            if let Some(first_lap) = activity.laps.first() {
                activity.id = first_lap.start_time.clone();
            }
        }
    }
}

fn parse_timestamp(time_str: &str) -> Option<DateTime<FixedOffset>> {
    DateTime::parse_from_rfc3339(time_str).ok()
}

#[cfg(test)]
mod tests {
    use super::*;

    const SAMPLE_TCX: &str = r#"<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<TrainingCenterDatabase xmlns="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2">
    <Activities>
        <Activity Sport="Running">
            <Id>2025-12-07T08:48:35.000+01:00</Id>
            <Lap StartTime="2025-12-07T08:48:35.000+01:00">
                <TotalTimeSeconds>367.827</TotalTimeSeconds>
                <DistanceMeters>1000.0</DistanceMeters>
                <Calories>65</Calories>
                <Intensity>Active</Intensity>
                <TriggerMethod>Manual</TriggerMethod>
                <Track>
                    <Trackpoint>
                        <Time>2025-12-07T08:48:35.000+01:00</Time>
                        <Position>
                            <LatitudeDegrees>45.81882</LatitudeDegrees>
                            <LongitudeDegrees>9.0663</LongitudeDegrees>
                        </Position>
                        <AltitudeMeters>204.585</AltitudeMeters>
                        <DistanceMeters>0.0</DistanceMeters>
                        <HeartRateBpm>
                            <Value>100</Value>
                        </HeartRateBpm>
                    </Trackpoint>
                    <Trackpoint>
                        <Time>2025-12-07T08:48:38.000+01:00</Time>
                        <Position>
                            <LatitudeDegrees>45.81882</LatitudeDegrees>
                            <LongitudeDegrees>9.0663</LongitudeDegrees>
                        </Position>
                        <AltitudeMeters>204.585</AltitudeMeters>
                        <DistanceMeters>4.64</DistanceMeters>
                        <HeartRateBpm>
                            <Value>103</Value>
                        </HeartRateBpm>
                    </Trackpoint>
                </Track>
            </Lap>
        </Activity>
    </Activities>
</TrainingCenterDatabase>"#;

    #[test]
    fn test_parse_tcx() {
        let editor = TcxEditor::new(SAMPLE_TCX).unwrap();
        assert_eq!(editor.get_trackpoint_count(), 2);
    }
}
