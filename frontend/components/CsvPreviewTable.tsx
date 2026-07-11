'use client';

import React from 'react';
import { FixedSizeList as List } from 'react-window';
import { ParsedCSV } from '@/lib/csvParser';

interface CsvPreviewTableProps {
  data: ParsedCSV;
}

const COLUMN_WIDTH = 180;
const INDEX_WIDTH = 50;
const ROW_HEIGHT = 44;

export default function CsvPreviewTable({ data }: CsvPreviewTableProps) {
  const { headers, rows, fileName, totalRows } = data;

  const totalTableWidth = INDEX_WIDTH + headers.length * COLUMN_WIDTH;
  const listHeight = Math.min(400, rows.length * ROW_HEIGHT);

  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const row = rows[index];
    return (
      <div
        style={style}
        className="flex items-center divide-x divide-slate-100 dark:divide-slate-800/80 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
      >
        <div
          style={{ width: INDEX_WIDTH }}
          className="flex-shrink-0 px-3 py-2.5 text-slate-400 dark:text-slate-600 text-xs font-semibold tabular-nums text-center select-none"
        >
          {index + 1}
        </div>
        {headers.map((header) => (
          <div
            key={header}
            style={{ width: COLUMN_WIDTH }}
            className="flex-shrink-0 px-3 py-2.5 text-slate-700 dark:text-slate-300 text-sm truncate"
            title={row[header] || ''}
          >
            {row[header] || (
              <span className="text-slate-300 dark:text-slate-700 text-xs italic">empty</span>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="mt-2 animate-fadeIn">
      {/* Meta bar */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            Preview
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-full px-2.5 py-0.5">
              {fileName}
            </span>
          </h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 font-semibold">
            {totalRows.toLocaleString()} rows · {headers.length} columns · Virtualized viewport enabled
          </p>
        </div>
      </div>

      {/* Outer wrapper: double scroll support */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
        <div className="overflow-x-auto w-full scrollbar-thin">
          <div style={{ width: totalTableWidth }} className="flex flex-col">
            {/* Headers row */}
            <div className="flex items-center divide-x divide-slate-200 dark:divide-slate-700 bg-slate-100/90 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-300 select-none">
              <div
                style={{ width: INDEX_WIDTH }}
                className="flex-shrink-0 px-3 py-3 text-center text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider"
              >
                #
              </div>
              {headers.map((header) => (
                <div
                  key={header}
                  style={{ width: COLUMN_WIDTH }}
                  className="flex-shrink-0 px-3 py-3 text-left text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider whitespace-nowrap"
                >
                  {header}
                </div>
              ))}
            </div>

            {/* Virtualized Body */}
            <List
              height={listHeight}
              itemCount={rows.length}
              itemSize={ROW_HEIGHT}
              width={totalTableWidth}
              className="scrollbar-thin"
            >
              {Row}
            </List>
          </div>
        </div>
      </div>
    </div>
  );
}
