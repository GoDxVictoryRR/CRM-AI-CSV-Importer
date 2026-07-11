'use client';

import { Sparkles, Loader2 } from 'lucide-react';

interface ConfirmImportBarProps {
  rowCount: number;
  onConfirm: () => void;
  isLoading: boolean;
  isDisabled: boolean;
}

/**
 * F3 — Sticky confirmation bar shown below the CSV preview.
 * Supports light and dark adaptive styles.
 */
export default function ConfirmImportBar({
  rowCount,
  onConfirm,
  isLoading,
  isDisabled,
}: ConfirmImportBarProps) {
  return (
    <div className="mt-4 rounded-xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-900/90 backdrop-blur-sm px-5 py-4 flex items-center justify-between gap-4 flex-wrap shadow-md">
      <div>
        <p className="text-sm font-semibold text-slate-800 dark:text-white">
          Ready to import{' '}
          <span className="text-emerald-600 dark:text-emerald-400 font-bold">
            {rowCount.toLocaleString()} row{rowCount !== 1 ? 's' : ''}
          </span>
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
          AI will map your columns to GrowEasy CRM fields automatically.
        </p>
      </div>

      <button
        id="confirm-import-btn"
        onClick={onConfirm}
        disabled={isDisabled || isLoading}
        aria-label="Confirm and start AI import"
        className={`
          flex items-center gap-2.5 rounded-lg px-5 py-2.5 text-sm font-semibold
          transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-slate-950
          ${
            isDisabled || isLoading
              ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-400 hover:to-teal-400 shadow-lg shadow-emerald-900/20 dark:shadow-emerald-900/40 hover:shadow-emerald-900/40 active:scale-95'
          }
        `}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Processing…
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            Confirm Import
          </>
        )}
      </button>
    </div>
  );
}
