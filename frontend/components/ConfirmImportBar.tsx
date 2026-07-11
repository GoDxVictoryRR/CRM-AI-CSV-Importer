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
    <div className="mt-6 rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-6 py-5 flex items-center justify-between gap-4 flex-wrap shadow-md shadow-slate-100/80 dark:shadow-none">
      <div>
        <p className="text-base font-bold text-slate-850 dark:text-white">
          Ready to import{' '}
          <span className="text-emerald-600 dark:text-emerald-400 font-extrabold underline decoration-emerald-500/30 decoration-2 underline-offset-4">
            {rowCount.toLocaleString()} row{rowCount !== 1 ? 's' : ''}
          </span>
        </p>
        <p className="text-xs text-slate-450 dark:text-slate-400 mt-1 font-semibold leading-relaxed">
          AI will map your columns to GrowEasy CRM fields automatically.
        </p>
      </div>

      <button
        id="confirm-import-btn"
        onClick={onConfirm}
        disabled={isDisabled || isLoading}
        aria-label="Confirm and start AI import"
        className={`
          flex items-center gap-2.5 rounded-xl px-6 py-3 text-sm font-bold
          transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-slate-950 active:scale-[0.97]
          ${
            isDisabled || isLoading
              ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-450 hover:to-teal-450 shadow-md shadow-emerald-500/20 dark:shadow-emerald-900/40 hover:shadow-lg hover:shadow-emerald-500/30'
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
            <Sparkles className="h-4 w-4 fill-current" />
            Confirm Import
          </>
        )}
      </button>
    </div>
  );
}
