import { useState, useCallback, useRef } from 'react';
import { TcxEditorWrapper } from '../lib/wasm';
import type { JsActivityStats, JsTrackpoint, TrimRange } from '../types/tcx';

interface UseTcxEditorState {
  isLoading: boolean;
  error: string | null;
  fileName: string | null;
  stats: JsActivityStats | null;
  trackpoints: JsTrackpoint[];
  trimRange: TrimRange;
  originalTrackpointCount: number;
}

interface UseTcxEditorReturn extends UseTcxEditorState {
  loadFile: (file: File) => Promise<void>;
  setTrimRange: (range: TrimRange) => void;
  applyTrim: () => void;
  resetTrim: () => void;
  exportTcx: () => void;
  clearFile: () => void;
}

export function useTcxEditor(): UseTcxEditorReturn {
  const editorRef = useRef<TcxEditorWrapper | null>(null);

  const [state, setState] = useState<UseTcxEditorState>({
    isLoading: false,
    error: null,
    fileName: null,
    stats: null,
    trackpoints: [],
    trimRange: { start: 0, end: 0 },
    originalTrackpointCount: 0,
  });

  const loadFile = useCallback(async (file: File) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const content = await file.text();
      const editor = await TcxEditorWrapper.fromContent(content);
      editorRef.current = editor;

      const stats = editor.getStats();
      const trackpoints = editor.getTrackpoints();
      const count = trackpoints.length;

      setState({
        isLoading: false,
        error: null,
        fileName: file.name,
        stats,
        trackpoints,
        trimRange: { start: 0, end: count - 1 },
        originalTrackpointCount: count,
      });
    } catch (err) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to load file',
      }));
    }
  }, []);

  const setTrimRange = useCallback((range: TrimRange) => {
    setState(prev => ({ ...prev, trimRange: range }));
  }, []);

  const applyTrim = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;

    try {
      editor.trimByIndices(state.trimRange.start, state.trimRange.end);
      const stats = editor.getStats();
      const trackpoints = editor.getTrackpoints();

      setState(prev => ({
        ...prev,
        stats,
        trackpoints,
        trimRange: { start: 0, end: trackpoints.length - 1 },
        originalTrackpointCount: trackpoints.length,
      }));
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Failed to apply trim',
      }));
    }
  }, [state.trimRange]);

  const resetTrim = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;

    try {
      editor.reset();
      const stats = editor.getStats();
      const trackpoints = editor.getTrackpoints();
      const count = trackpoints.length;

      setState(prev => ({
        ...prev,
        stats,
        trackpoints,
        trimRange: { start: 0, end: count - 1 },
        originalTrackpointCount: count,
      }));
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Failed to reset',
      }));
    }
  }, []);

  const exportTcx = useCallback(() => {
    const editor = editorRef.current;
    if (!editor || !state.fileName) return;

    try {
      const xml = editor.toXml();
      const blob = new Blob([xml], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = state.fileName.replace('.tcx', '_trimmed.tcx');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Failed to export',
      }));
    }
  }, [state.fileName]);

  const clearFile = useCallback(() => {
    editorRef.current = null;
    setState({
      isLoading: false,
      error: null,
      fileName: null,
      stats: null,
      trackpoints: [],
      trimRange: { start: 0, end: 0 },
      originalTrackpointCount: 0,
    });
  }, []);

  return {
    ...state,
    loadFile,
    setTrimRange,
    applyTrim,
    resetTrim,
    exportTcx,
    clearFile,
  };
}
