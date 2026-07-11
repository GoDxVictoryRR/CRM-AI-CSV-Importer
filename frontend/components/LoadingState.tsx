'use client';

import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  /** Number of batches processed so far (optional). */
  batchesDone?: number;
  /** Total batches to process (optional). */
  totalBatches?: number;
}

/**
 * Full-section loading indicator shown while the backend AI extraction is running.
 * Adaptive style variables to support light and dark theme toggles.
 */
export default function LoadingState({ batchesDone, totalBatches }: LoadingStateProps) {
  const hasBatchInfo =
    batchesDone !== undefined && totalBatches !== undefined && totalBatches > 0;

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="relative mb-6">
        <div className="h-16 w-16 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-600/20 flex items-center justify-center">
          <Loader2 className="h-8 w-8 text-emerald-500 dark:text-emerald-400 new-animation animate-spin" />
        </div>
        <div className="absolute inset-0 h-16 w-16 rounded-full border border-emerald-500/30 animate-ping" />
      </div>
      <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">
        AI Extraction in Progress
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">
        Gemini is intelligently mapping your CSV columns to CRM fields. Large files
        may take a minute.
      </p>
      {hasBatchInfo && (
        <div className="mt-6 w-64">
          <div className="flex justify-between text-xs text-slate-500 mb-1.5 font-medium">
            <span>Batch {batchesDone} of {totalBatches}</span>
            <span>{Math.round((batchesDone! / totalBatches!) * 100)}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-emerald-100/60 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
              style={{ width: `${(batchesDone! / totalBatches!) * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
