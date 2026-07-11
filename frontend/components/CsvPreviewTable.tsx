'use client';

import { ParsedCSV } from '@/lib/csvParser';

interface CsvPreviewTableProps {
  data: ParsedCSV;
}

const PREVIEW_ROW_LIMIT = 100;

/**
 * F2 — Raw CSV preview table.
 * Adaptive style variables to support light and dark theme toggles.
 */
export default function CsvPreviewTable({ data }: CsvPreviewTableProps) {
  const { headers, rows, fileName, totalRows } = data;
  const displayRows = rows.slice(0, PREVIEW_ROW_LIMIT);
  const truncated = totalRows > PREVIEW_ROW_LIMIT;

  return (
    <div className="mt-2">
      {/* Meta bar */}
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div>
          <h2 className="text-base font-semibold text-slate-850 dark:text-white flex items-center gap-2">
            Preview
            <span className="text-xs font-normal text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-full px-2 py-0.5">
              {fileName}
            </span>
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {totalRows.toLocaleString()} rows · {headers.length} columns
          </p>
        </div>
      </div>

      {/* Table container: double scroll — horizontal + vertical */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-700/60 overflow-hidden bg-white dark:bg-slate-900/80 shadow-sm">
        <div className="overflow-auto max-h-[420px]">
          <table className="min-w-full text-sm border-collapse">
            {/* Sticky header */}
            <thead className="sticky top-0 z-10">
              <tr className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <th className="px-3 py-3 text-left text-xs font-medium text-slate-450 dark:text-slate-500 uppercase tracking-wider w-10 select-none">
                  #
                </th>
                {headers.map((header) => (
                  <th
                    key={header}
                    className="px-3 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider whitespace-nowrap"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {displayRows.map((row, i) => (
                <tr
                  key={i}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors duration-75"
                >
                  <td className="px-3 py-2.5 text-slate-400 dark:text-slate-600 text-xs tabular-nums">
                    {i + 1}
                  </td>
                  {headers.map((header) => (
                    <td
                      key={header}
                      className="px-3 py-2.5 text-slate-700 dark:text-slate-300 whitespace-nowrap max-w-[200px] truncate"
                      title={row[header] || ''}
                    >
                      {row[header] || (
                        <span className="text-slate-300 dark:text-slate-700 text-xs italic">empty</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Truncation notice */}
        {truncated && (
          <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-700/60 text-xs text-slate-500 dark:text-slate-450">
            Showing first {PREVIEW_ROW_LIMIT.toLocaleString()} of{' '}
            {totalRows.toLocaleString()} rows — all rows will be imported.
          </div>
        )}
      </div>
    </div>
  );
}
