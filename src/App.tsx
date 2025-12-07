import { useState } from 'react';
import { MapPin, Activity, Heart, Mountain } from 'lucide-react';
import { FileUpload } from './components/FileUpload';
import { ActivityStats } from './components/ActivityStats';
import { TrackMap } from './components/TrackMap';
import { TimelineChart } from './components/TimelineChart';
import { TrimControls } from './components/TrimControls';
import { useTcxEditor } from './hooks/useTcxEditor';

type ChartType = 'heart_rate' | 'altitude' | 'pace';

const chartTabs: { id: ChartType; label: string; icon: React.ReactNode }[] = [
  { id: 'heart_rate', label: 'Heart Rate', icon: <Heart className="w-4 h-4" /> },
  { id: 'altitude', label: 'Altitude', icon: <Mountain className="w-4 h-4" /> },
  { id: 'pace', label: 'Pace', icon: <Activity className="w-4 h-4" /> },
];

export default function App() {
  const {
    isLoading,
    error,
    fileName,
    stats,
    trackpoints,
    trimRange,
    originalTrackpointCount,
    loadFile,
    setTrimRange,
    applyTrim,
    resetTrim,
    exportTcx,
    clearFile,
  } = useTcxEditor();

  const [activeChart, setActiveChart] = useState<ChartType>('heart_rate');

  const hasData = stats !== null && trackpoints.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-xl">
                <MapPin className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  Track Editor
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Edit and trim your TCX activities
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Banner */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {!hasData ? (
          /* Upload Section */
          <div className="max-w-xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                Upload Your Activity
              </h2>
              <p className="text-slate-600 dark:text-slate-400">
                Load a TCX file to view, analyze, and trim your recorded activity
              </p>
            </div>
            <FileUpload
              onFileSelect={loadFile}
              isLoading={isLoading}
              currentFileName={fileName}
              onClear={clearFile}
            />
          </div>
        ) : (
          /* Main Editor Layout */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Stats & Controls */}
            <div className="space-y-6">
              {/* File Info */}
              <FileUpload
                onFileSelect={loadFile}
                isLoading={isLoading}
                currentFileName={fileName}
                onClear={clearFile}
              />

              {/* Activity Stats */}
              <div className="bg-white dark:bg-slate-800/50 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none p-6 border border-slate-100 dark:border-slate-700">
                <ActivityStats stats={stats} />
              </div>

              {/* Trim Controls */}
              <div className="bg-white dark:bg-slate-800/50 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none p-6 border border-slate-100 dark:border-slate-700">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                  Trim Activity
                </h3>
                <TrimControls
                  trackpoints={trackpoints}
                  trimRange={trimRange}
                  originalCount={originalTrackpointCount}
                  onTrimRangeChange={setTrimRange}
                  onApplyTrim={applyTrim}
                  onReset={resetTrim}
                  onExport={exportTcx}
                />
              </div>
            </div>

            {/* Right Column: Map & Chart */}
            <div className="lg:col-span-2 space-y-6">
              {/* Map */}
              <div className="bg-white dark:bg-slate-800/50 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none p-4 border border-slate-100 dark:border-slate-700">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                  Route Map
                </h3>
                <div className="h-80 lg:h-96 rounded-xl overflow-hidden">
                  <TrackMap trackpoints={trackpoints} trimRange={trimRange} />
                </div>
              </div>

              {/* Chart */}
              <div className="bg-white dark:bg-slate-800/50 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none p-4 border border-slate-100 dark:border-slate-700">
                {/* Chart Tabs */}
                <div className="flex items-center gap-2 mb-4">
                  {chartTabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveChart(tab.id)}
                      className={`
                        flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
                        ${
                          activeChart === tab.id
                            ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }
                      `}
                    >
                      {tab.icon}
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="h-64">
                  <TimelineChart
                    trackpoints={trackpoints}
                    trimRange={trimRange}
                    dataType={activeChart}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto py-6 border-t border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-slate-500 dark:text-slate-400">
            Track Editor - All processing happens locally in your browser
          </p>
        </div>
      </footer>
    </div>
  );
}
