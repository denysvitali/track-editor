import { useCallback, useState } from 'react';
import { Upload, FileText, X } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  isLoading: boolean;
  currentFileName: string | null;
  onClear: () => void;
}

export function FileUpload({
  onFileSelect,
  isLoading,
  currentFileName,
  onClear,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file && file.name.toLowerCase().endsWith('.tcx')) {
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  if (currentFileName) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-800">
        <FileText className="w-5 h-5 text-primary-600 dark:text-primary-400 shrink-0" />
        <span className="text-sm font-medium text-primary-900 dark:text-primary-100 truncate flex-1">
          {currentFileName}
        </span>
        <button
          onClick={onClear}
          className="p-1 hover:bg-primary-200 dark:hover:bg-primary-800 rounded transition-colors"
          title="Close file"
        >
          <X className="w-4 h-4 text-primary-600 dark:text-primary-400" />
        </button>
      </div>
    );
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200
        ${
          isDragging
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
            : 'border-slate-300 dark:border-slate-600 hover:border-primary-400 dark:hover:border-primary-500'
        }
        ${isLoading ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}
      `}
    >
      <input
        type="file"
        accept=".tcx"
        onChange={handleFileInput}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        disabled={isLoading}
      />

      <div className="flex flex-col items-center gap-3">
        <div
          className={`
          p-4 rounded-full transition-colors
          ${isDragging ? 'bg-primary-100 dark:bg-primary-800' : 'bg-slate-100 dark:bg-slate-800'}
        `}
        >
          <Upload
            className={`w-8 h-8 ${isDragging ? 'text-primary-600 dark:text-primary-400' : 'text-slate-400 dark:text-slate-500'}`}
          />
        </div>

        <div>
          <p className="text-lg font-medium text-slate-900 dark:text-slate-100">
            {isLoading ? 'Loading...' : 'Drop your TCX file here'}
          </p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            or click to browse
          </p>
        </div>

        <p className="text-xs text-slate-400 dark:text-slate-500">
          Supports Garmin TCX files
        </p>
      </div>
    </div>
  );
}
