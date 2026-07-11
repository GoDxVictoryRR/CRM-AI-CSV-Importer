'use client';

import React, { useState } from 'react';
import { FixedSizeList as List } from 'react-window';
import { CheckCircle2, XCircle, RefreshCw, Play, Download, Zap, Database, AlertTriangle, FileSpreadsheet } from 'lucide-react';
import { ImportResponse, SkippedRecord } from '@/types/api';
import { CrmRecord } from '@/types/crm';
import { downloadParsedCsv, downloadSkippedCsv } from '@/lib/csvExporter';

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

const COLUMN_WIDTH = 180;
const INDEX_WIDTH = 50;
const ROW_HEIGHT = 44;

function statusBadge(status?: string) {
  const norm = (status ?? '').toUpperCase();
  switch (norm) {
    case 'GOOD_LEAD_FOLLOW_UP':
      return 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-750';
    case 'DID_NOT_CONNECT':
      return 'bg-amber-100 dark:bg-amber-955/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-750';
    case 'BAD_LEAD':
      return 'bg-red-100 dark:bg-red-955/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-750';
    case 'SALE_DONE':
      return 'bg-blue-100 dark:bg-blue-955/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-750';
    default:
      return 'bg-slate-100 dark:bg-slate-800 text-slate-655 dark:text-slate-400 border border-slate-200 dark:border-slate-700';
  }
}

function sourceBadge(source?: string) {
  const norm = (source ?? '').toLowerCase();
  switch (norm) {
    case 'leads_on_demand':
      return 'bg-teal-55/75 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 border border-teal-150 dark:border-teal-900/60';
    case 'meridian_tower':
      return 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border border-purple-100 dark:border-purple-900/60';
    case 'eden_park':
      return 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/60';
    case 'varah_swamy':
      return 'bg-amber-50 dark:bg-amber-955/40 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-900/60';
    case 'sarjapur_plots':
      return 'bg-blue-50 dark:bg-blue-955/40 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-900/60';
    default:
      return 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-700';
  }
}

function renderCellContent(field: keyof CrmRecord, val: any) {
  const str = String(val ?? '');
  if (field === 'crm_status' && val) {
    const formatted = str.replace(/_/g, ' ');
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide ${statusBadge(str)}`}>
        {formatted}
      </span>
    );
  }
  if (field === 'data_source' && val) {
    const formatted = str.replace(/_/g, ' ');
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide capitalize ${sourceBadge(str)}`}>
        {formatted}
      </span>
    );
  }
  return str;
}

function DataTable({ headers, rows, rawFields }: { headers: string[]; rows: string[][]; rawFields?: string[] }) {
  const totalTableWidth = INDEX_WIDTH + headers.length * COLUMN_WIDTH;
  const listHeight = Math.min(420, rows.length * ROW_HEIGHT);

  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const row = rows[index];
    return (
      <div
        style={style}
        className="flex items-center divide-x divide-slate-150 dark:divide-slate-800/80 border-b border-slate-150 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
      >
        <div
          style={{ width: INDEX_WIDTH }}
          className="flex-shrink-0 px-3 py-2.5 text-slate-400 dark:text-slate-600 text-xs font-medium tabular-nums text-center select-none"
        >
          {index + 1}
        </div>
        {row.map((cell, j) => {
          const field = rawFields ? (rawFields[j] as keyof CrmRecord) : null;
          return (
            <div
              key={j}
              style={{ width: COLUMN_WIDTH }}
              className="flex-shrink-0 px-3 py-2.5 text-slate-700 dark:text-slate-350 text-sm truncate"
              title={cell}
            >
              {field ? renderCellContent(field, cell) : (cell || <span className="text-slate-300 dark:text-slate-800 text-xs italic">—</span>)}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 overflow-hidden shadow-sm">
      <div className="overflow-x-auto w-full scrollbar-thin">
        <div style={{ width: totalTableWidth }} className="flex flex-col">
          {/* Header Row */}
          <div className="flex items-center divide-x divide-slate-200 dark:divide-slate-700 bg-slate-50 dark:bg-slate-850/80 border-b border-slate-200 dark:border-slate-800 font-semibold text-slate-700 dark:text-slate-300 select-none">
            <div
              style={{ width: INDEX_WIDTH }}
              className="flex-shrink-0 px-3 py-3.5 text-center text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider"
            >
              #
            </div>
            {headers.map((h, idx) => (
              <div
                key={idx}
                style={{ width: COLUMN_WIDTH }}
                className="flex-shrink-0 px-3 py-3.5 text-left text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider whitespace-nowrap"
              >
                {h}
              </div>
            ))}
          </div>

          {/* Virtual List Body */}
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
  );
}

export default function ResultsTable({ result, onReset, onRetrySkipped }: ResultsTableProps) {
  const { parsed, skipped, totalParsed, totalSkipped, cached } = result;
  const [activeTab, setActiveTab] = useState<'parsed' | 'skipped'>(parsed.length > 0 ? 'parsed' : 'skipped');

  const activeFields = CRM_FIELD_ORDER.filter((field) => parsed.some((r) => r[field]));
  const parsedRows = parsed.map((record) => activeFields.map((field) => String(record[field] ?? '')));

  const skippedHeaders = ['Row #', 'Reason', ...Object.keys(skipped[0]?.rowRawData ?? {}).slice(0, 6)];
  const skippedRows = skipped.map((s) => [
    String(s.rowIndex + 1),
    s.reason,
    ...Object.values(s.rowRawData).slice(0, 6),
  ]);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* P1: Premium Cache hit banner */}
      {cached && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-5 py-4 shadow-sm text-emerald-800 dark:text-emerald-400">
          <div className="p-2 rounded-xl bg-emerald-555/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center animate-pulse">
            <Zap className="h-5 w-5 fill-current" />
          </div>
          <div>
            <h4 className="font-bold text-sm">Served from cache</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">An identical CSV was previously processed. Skipped AI calls entirely to protect limits.</p>
          </div>
        </div>
      )}

      {/* Modern Dashboard Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        {/* Counter: Success */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-gradient-to-b from-white to-slate-50/30 dark:from-slate-900 dark:to-slate-900/80 p-5 shadow-sm hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-800/80 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute right-0 top-0 h-24 w-24 bg-gradient-to-bl from-emerald-500/10 to-transparent rounded-bl-full opacity-50" />
          <div className="flex justify-between items-start">
            <div>
              <p className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">{totalParsed.toLocaleString()}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mt-1.5">Leads Imported</p>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 text-xs text-slate-500 flex items-center gap-1.5">
            <Database className="h-3.5 w-3.5 text-slate-450" />
            <span>Successfully mapped to CRM</span>
          </div>
        </div>

        {/* Counter: Skipped */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-gradient-to-b from-white to-slate-50/30 dark:from-slate-900 dark:to-slate-900/80 p-5 shadow-sm hover:shadow-md hover:border-red-300 dark:hover:border-red-800/80 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute right-0 top-0 h-24 w-24 bg-gradient-to-bl from-red-500/10 to-transparent rounded-bl-full opacity-50" />
          <div className="flex justify-between items-start">
            <div>
              <p className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">{totalSkipped.toLocaleString()}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mt-1.5">Rows Skipped</p>
            </div>
            <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400">
              <XCircle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 text-xs text-slate-500 flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 text-slate-455" />
            <span>Missing mandatory contact details</span>
          </div>
        </div>

        {/* Counter: Combined Total */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-gradient-to-b from-white to-slate-50/30 dark:from-slate-900 dark:to-slate-900/80 p-5 shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-blue-800/80 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute right-0 top-0 h-24 w-24 bg-gradient-to-bl from-blue-500/10 to-transparent rounded-bl-full opacity-50" />
          <div className="flex justify-between items-start">
            <div>
              <p className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">{(totalParsed + totalSkipped).toLocaleString()}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mt-1.5">Total Processed</p>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 text-xs text-slate-500">
            <span>Accuracy rate: {totalParsed + totalSkipped > 0 ? Math.round((totalParsed / (totalParsed + totalSkipped)) * 100) : 0}%</span>
          </div>
        </div>

        {/* Dynamic Reset Card */}
        <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 p-5 flex flex-col justify-between hover:border-emerald-500/40 hover:bg-emerald-50/10 dark:hover:bg-slate-900/20 transition-all duration-300 group">
          <div>
            <h4 className="font-bold text-sm text-slate-850 dark:text-white">Batch completed!</h4>
            <p className="text-xs text-slate-450 dark:text-slate-500 mt-1.5 leading-relaxed">Ready to upload another dataset?</p>
          </div>
          <button
            id="import-again-btn"
            onClick={onReset}
            className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-555 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-955 px-4 py-2.5 text-xs font-bold shadow-md shadow-emerald-600/10 hover:shadow-lg hover:shadow-emerald-600/20 transition-all active:scale-[0.98]"
          >
            <RefreshCw className="h-4 w-4" />
            Import another CSV
          </button>
        </div>
      </div>

      {/* Tab Selectors & Table Container */}
      <div className="border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/40 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-150 dark:border-slate-800 pb-5 mb-5 gap-4">
          <div className="flex gap-2 rounded-xl bg-slate-100 dark:bg-slate-955 p-1.5 w-full sm:w-auto">
            {parsed.length > 0 && (
              <button
                onClick={() => setActiveTab('parsed')}
                className={`flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-lg transition-all w-full sm:w-auto ${
                  activeTab === 'parsed'
                    ? 'bg-white dark:bg-slate-850 text-emerald-700 dark:text-white shadow-sm border border-emerald-100/60 dark:border-transparent'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
              >
                <span>Imported Leads</span>
                <span className={`px-1.5 py-0.5 text-[10px] rounded-full font-bold ${activeTab === 'parsed' ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400' : 'bg-slate-200 dark:bg-slate-800 text-slate-655'}`}>
                  {totalParsed}
                </span>
              </button>
            )}
            {skipped.length > 0 && (
              <button
                onClick={() => setActiveTab('skipped')}
                className={`flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-lg transition-all w-full sm:w-auto ${
                  activeTab === 'skipped'
                    ? 'bg-white dark:bg-slate-850 text-red-700 dark:text-white shadow-sm border border-red-100/60 dark:border-transparent'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
              >
                <span>Skipped Records</span>
                <span className={`px-1.5 py-0.5 text-[10px] rounded-full font-bold ${activeTab === 'skipped' ? 'bg-red-50 dark:bg-red-950/60 text-red-656 dark:text-red-400' : 'bg-slate-200 dark:bg-slate-800 text-slate-655'}`}>
                  {totalSkipped}
                </span>
              </button>
            )}
          </div>

          {/* Action buttons matching current tab */}
          <div>
            {activeTab === 'parsed' && parsed.length > 0 && (
              <button
                onClick={() => downloadParsedCsv(parsed)}
                className="flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-450 active:scale-[0.98] text-white px-4 py-2 text-xs font-bold shadow-md shadow-emerald-500/10 hover:shadow-emerald-500/20 transition-all w-full sm:w-auto"
              >
                <Download className="h-4 w-4" />
                Download Results CSV
              </button>
            )}
            {activeTab === 'skipped' && skipped.length > 0 && (
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={() => downloadSkippedCsv(skipped)}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-855 active:scale-[0.98] text-slate-650 dark:text-slate-350 px-4 py-2 text-xs font-bold transition-all"
                >
                  <Download className="h-4 w-4" />
                  Download Skipped CSV
                </button>
                {onRetrySkipped && (
                  <button
                    onClick={() => onRetrySkipped(skipped)}
                    className="flex items-center gap-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 active:scale-[0.98] text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-4 py-2 text-xs font-bold transition-all"
                  >
                    <Play className="h-3.5 w-3.5 fill-current" />
                    Retry Skipped
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'parsed' && parsed.length > 0 && (
          <div className="space-y-3 animate-fadeIn">
            <DataTable headers={activeFields.map((f) => FIELD_LABELS[f])} rows={parsedRows} rawFields={activeFields} />
          </div>
        )}

        {activeTab === 'skipped' && skipped.length > 0 && (
          <div className="space-y-3 animate-fadeIn">
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-450 pb-2 border-b border-slate-100 dark:border-slate-800/60">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span>Rows listed below did not contain a valid email address or phone number and were skipped.</span>
            </div>
            <DataTable headers={skippedHeaders} rows={skippedRows} />
          </div>
        )}
      </div>
    </div>
  );
}
