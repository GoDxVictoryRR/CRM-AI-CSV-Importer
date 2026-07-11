'use client';

import { X, AlertCircle } from 'lucide-react';

interface ErrorBannerProps {
  message: string;
  onDismiss: () => void;
}

/** Dismissible error banner. Adaptive styles for light and dark theme toggles. */
export default function ErrorBanner({ message, onDismiss }: ErrorBannerProps) {
  return (
    <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-700 dark:text-red-300">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500 dark:text-red-400" />
      <span className="flex-1 font-medium">{message}</span>
      <button
        onClick={onDismiss}
        className="shrink-0 rounded p-0.5 hover:bg-red-200 dark:hover:bg-red-500/20 transition-colors"
        aria-label="Dismiss error"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
