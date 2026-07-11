'use client';

import { useCallback, useRef, useState } from 'react';
import { UploadCloud, FileText, Download } from 'lucide-react';
import { downloadSampleTemplate } from '@/lib/csvExporter';

interface CsvUploaderProps {
  onFileSelected: (file: File) => void;
}

const MAX_SIZE_MB = 10;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

/**
 * F1 — CSV upload zone with drag-and-drop and file picker fallback.
 * Adaptive style variables to support light and dark theme toggles.
 */
export default function CsvUploader({ onFileSelected }: CsvUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validate = useCallback((file: File): string | null => {
    if (!file.name.toLowerCase().endsWith('.csv') && file.type !== 'text/csv') {
      return `"${file.name}" is not a CSV file. Please upload a .csv file.`;
    }
    if (file.size > MAX_SIZE_BYTES) {
      return `File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum size is ${MAX_SIZE_MB} MB.`;
    }
    if (file.size === 0) {
      return 'The file is empty.';
    }
    return null;
  }, []);

  const handleFile = useCallback(
    (file: File) => {
      const error = validate(file);
      if (error) {
        setInlineError(error);
        return;
      }
      setInlineError(null);
      onFileSelected(file);
    },
    [validate, onFileSelected]
  );

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback(() => setIsDragging(false), []);

  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      e.target.value = ''; // reset so same file can be re-selected
    },
    [handleFile]
  );

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      {/* Hero text */}
      <div className="mb-10 text-center">
        <h2 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight mb-3">
          Import CRM Leads from Any CSV
        </h2>
        <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto text-base">
          Upload any CSV — Facebook leads, Google Ads exports, real-estate CRM files,
          or manual sheets. AI maps the columns automatically.
        </p>
      </div>

      {/* Drop zone */}
      <div
        id="csv-drop-zone"
        role="button"
        tabIndex={0}
        aria-label="Upload CSV file"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={`
          relative w-full max-w-xl rounded-2xl border-2 border-dashed p-12 text-center
          cursor-pointer transition-all duration-200 group shadow-sm
          ${
            isDragging
              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 scale-[1.01]'
              : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/60 hover:border-emerald-500/60 hover:bg-slate-50 dark:hover:bg-slate-900'
          }
        `}
      >
        {/* Gradient glow on drag */}
        {isDragging && (
          <div className="absolute inset-0 rounded-2xl bg-emerald-500/5 pointer-events-none" />
        )}

        <div className="flex flex-col items-center gap-4">
          <div
            className={`
              w-16 h-16 rounded-xl flex items-center justify-center transition-colors
              ${isDragging ? 'bg-emerald-100 dark:bg-emerald-500/20' : 'bg-slate-100 dark:bg-slate-800 group-hover:bg-slate-200 dark:group-hover:bg-slate-700'}
            `}
          >
            <UploadCloud
              className={`h-8 w-8 transition-colors ${isDragging ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400 group-hover:text-emerald-500'}`}
            />
          </div>

          <div>
            <p className="text-base font-medium text-slate-800 dark:text-white mb-1">
              {isDragging ? 'Drop your CSV here' : 'Drag & drop your CSV here'}
            </p>
            <p className="text-sm text-slate-500">
              or{' '}
              <span className="text-emerald-600 dark:text-emerald-400 underline underline-offset-2 cursor-pointer">
                browse files
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-650">
            <FileText className="h-3.5 w-3.5" />
            <span>.csv files only · max {MAX_SIZE_MB} MB</span>
          </div>
        </div>

        <input
          ref={inputRef}
          id="csv-file-input"
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={onInputChange}
          aria-hidden="true"
        />
      </div>

      {/* Inline error */}
      {inlineError && (
        <div
          id="upload-error"
          role="alert"
          className="mt-4 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-700 dark:text-red-300 max-w-xl w-full"
        >
          <span>⚠️</span>
          <span>{inlineError}</span>
        </div>
      )}

      {/* Supported sources */}
      <div className="mt-8 flex flex-wrap justify-center gap-2 max-w-lg">
        {['Facebook Leads', 'Google Ads', 'Excel exports', 'Real Estate CRMs', 'Manual sheets'].map(
          (src) => (
            <span
              key={src}
              className="rounded-full border border-slate-200 dark:border-slate-700/60 bg-slate-100 dark:bg-slate-800/50 px-3 py-1 text-xs text-slate-500 dark:text-slate-400"
            >
              {src}
            </span>
          )
        )}
      </div>

      {/* P4: Download sample template */}
      <button
        onClick={downloadSampleTemplate}
        className="mt-5 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-500 hover:text-emerald-500 dark:hover:text-emerald-400 underline underline-offset-2 transition-colors"
      >
        <Download className="h-3.5 w-3.5" />
        Download Sample CSV Template
      </button>
    </div>
  );
}
