'use client';

import { CheckCircle2, XCircle, RefreshCw, Play } from 'lucide-react';
import { ImportResponse, SkippedRecord } from '@/types/api';
import { CrmRecord } from '@/types/crm';

interface ResultsTableProps {
  result: ImportResponse;
  onReset: () => void;
  onRetrySkipped?: (skipped: SkippedRecord[]) => void;
}

const CRM_FIELD_ORDER: (keyof CrmRecord)[] = [
  'name', 'email', 'mobile_without_country_code', 'country_code',
  'company', 'city', 'state', 'country',
  'lead_owner', 'crm_status', 'data_source',
  'crm_note', 'created_at', 'possession_time', 'description',
];

const FIELD_LABELS: Record<keyof CrmRecord, string> = {
  name: 'Name', email: 'Email', mobile_without_country_code: 'Mobile',
  country_code: 'CC', company: 'Company', city: 'City', state: 'State',
  country: 'Country', lead_owner: 'Owner', crm_status: 'Status',
  data_source: 'Source', crm_note: 'Note', created_at: 'Created At',
  possession_time: 'Possession', description: 'Description',
};

/** Scrollable data table — shared between parsed and skipped sections. Supports light and dark mode classes. */
function DataTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: string[][];
}) {
  return (
    <div className="overflow-auto max-h-96 rounded-xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-900/80 shadow-sm">
      <table className="min-w-full text-sm border-collapse">
        <thead className="sticky top-0 z-10">
          <tr className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
            <th className="px-3 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider w-10 text-left">#</th>
            {headers.map((h) => (
              <th key={h} className="px-3 py-3 text-xs font-medium text-slate-600 dark:text-slate-300 uppercase tracking-wider whitespace-nowrap text-left">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
          {rows.map((row, i) => (
            <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
              <td className="px-3 py-2.5 text-slate-400 dark:text-slate-600 text-xs tabular-nums">{i + 1}</td>
              {row.map((cell, j) => (
                <td key={j} className="px-3 py-2.5 text-slate-700 dark:text-slate-300 whitespace-nowrap max-w-[200px] truncate" title={cell}>
                  {cell || <span className="text-slate-300 dark:text-slate-700 text-xs italic">—</span>}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * F9 — Results display after AI import completes.
 * Shows parsed records table, skipped records table, and totals.
 * Reuses the scrollable table pattern from F2.
 */
export default function ResultsTable({ result, onReset, onRetrySkipped }: ResultsTableProps) {
  const { parsed, skipped, totalParsed, totalSkipped } = result;

  // Only show columns that have at least one value in parsed records
  const activeFields = CRM_FIELD_ORDER.filter((field) =>
    parsed.some((r) => r[field])
  );

  const parsedRows = parsed.map((record) =>
    activeFields.map((field) => {
      const val = record[field] ?? '';
      return String(val);
    })
  );

  const skippedHeaders = ['Row #', 'Reason', ...Object.keys(skipped[0]?.rowRawData ?? {}).slice(0, 6)];
  const skippedRows = skipped.map((s) => [
    String(s.rowIndex + 1),
    s.reason,
    ...Object.values(s.rowRawData).slice(0, 6),
  ]);

  return (
    <div className="space-y-8">
      {/* Summary strip */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-emerald-200 dark:border-emerald-700/40 bg-emerald-50 dark:bg-emerald-950/30 p-4">
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{totalParsed.toLocaleString()}</p>
          <p className="text-xs text-emerald-700 dark:text-emerald-500 mt-1 font-semibold uppercase tracking-wide">Imported</p>
        </div>
        <div className="rounded-xl border border-red-200 dark:border-red-700/40 bg-red-50 dark:bg-red-950/30 p-4">
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">{totalSkipped.toLocaleString()}</p>
          <p className="text-xs text-red-700 dark:text-red-500 mt-1 font-semibold uppercase tracking-wide">Skipped</p>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-800/50 p-4">
          <p className="text-2xl font-bold text-slate-800 dark:text-white">{(totalParsed + totalSkipped).toLocaleString()}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-semibold uppercase tracking-wide">Total rows</p>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-800/50 p-4 flex items-center justify-center">
          <button
            id="import-again-btn"
            onClick={onReset}
            className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Import another
          </button>
        </div>
      </div>

      {/* Parsed records */}
      {parsed.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-base font-semibold text-slate-800 dark:text-white">
              Successfully Parsed
              <span className="ml-2 text-sm font-normal text-slate-500 dark:text-slate-400">({totalParsed.toLocaleString()} records)</span>
            </h2>
          </div>
          <DataTable
            headers={activeFields.map((f) => FIELD_LABELS[f])}
            rows={parsedRows}
          />
        </section>
      )}

      {/* Skipped records */}
      {skipped.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              <h2 className="text-base font-semibold text-slate-800 dark:text-white">
                Skipped Records
                <span className="ml-2 text-sm font-normal text-slate-500 dark:text-slate-400">({totalSkipped.toLocaleString()} records)</span>
              </h2>
            </div>

            {/* F11 Bonus: Retry failed/skipped rows in UI */}
            {onRetrySkipped && (
              <button
                onClick={() => onRetrySkipped(skipped)}
                className="flex items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 active:scale-95 transition-all"
              >
                <Play className="h-3 w-3 fill-current" />
                Retry Failed Rows
              </button>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
            These rows were skipped due to missing email/mobile contacts, validation rules, or API key issues.
          </p>
          <DataTable headers={skippedHeaders} rows={skippedRows} />
        </section>
      )}
    </div>
  );
}
