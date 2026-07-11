import { CrmRecord } from '@/types/crm';
import { SkippedRecord } from '@/types/api';

/** CRM column order as specified in the assignment. */
const CRM_COLUMN_ORDER: (keyof CrmRecord)[] = [
  'created_at',
  'name',
  'email',
  'country_code',
  'mobile_without_country_code',
  'company',
  'city',
  'state',
  'country',
  'lead_owner',
  'crm_status',
  'crm_note',
  'data_source',
  'possession_time',
  'description',
];

const CRM_COLUMN_HEADERS: Record<keyof CrmRecord, string> = {
  created_at: 'Created At',
  name: 'Name',
  email: 'Email',
  country_code: 'Country Code',
  mobile_without_country_code: 'Mobile',
  company: 'Company',
  city: 'City',
  state: 'State',
  country: 'Country',
  lead_owner: 'Lead Owner',
  crm_status: 'CRM Status',
  crm_note: 'CRM Note',
  data_source: 'Data Source',
  possession_time: 'Possession Time',
  description: 'Description',
};

/**
 * P3 — Sanitize a CSV cell value to prevent CSV injection.
 * Excel and Google Sheets treat cells starting with =, +, -, @ as formulas.
 * Prefix those with a single quote to neutralize.
 */
function sanitizeCell(value: string): string {
  if (/^[=+\-@]/.test(value)) {
    return `'${value}`;
  }
  return value;
}

/** Escape a single cell value for RFC-4180 CSV (wrap in quotes if it contains comma, quote, or newline). */
function escapeCell(raw: string): string {
  const sanitized = sanitizeCell(raw);
  if (sanitized.includes(',') || sanitized.includes('"') || sanitized.includes('\n')) {
    return `"${sanitized.replace(/"/g, '""')}"`;
  }
  return sanitized;
}

/** Convert a 2D array of strings into a CSV string. */
function rowsToCsv(headers: string[], rows: string[][]): string {
  const headerRow = headers.map(escapeCell).join(',');
  const dataRows = rows.map(row => row.map(escapeCell).join(','));
  return [headerRow, ...dataRows].join('\r\n');
}

/** Trigger a browser file download. */
function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * P3 — Download parsed CRM records as a CSV file.
 * Columns are in the exact GrowEasy CRM order from the assignment spec.
 */
export function downloadParsedCsv(records: CrmRecord[], filename = 'groweasy_import_results.csv'): void {
  const headers = CRM_COLUMN_ORDER.map(col => CRM_COLUMN_HEADERS[col]);
  const rows = records.map(record =>
    CRM_COLUMN_ORDER.map(col => String(record[col] ?? ''))
  );
  const csv = rowsToCsv(headers, rows);
  downloadFile(csv, filename, 'text/csv;charset=utf-8;');
}

/**
 * P3 — Download skipped records as a CSV file with skip reasons.
 */
export function downloadSkippedCsv(skipped: SkippedRecord[], filename = 'groweasy_skipped_rows.csv'): void {
  if (skipped.length === 0) return;
  const rawHeaders = Object.keys(skipped[0].rowRawData);
  const headers = ['Row #', 'Skip Reason', ...rawHeaders];
  const rows = skipped.map(s => [
    String(s.rowIndex + 1),
    s.reason,
    ...rawHeaders.map(h => String(s.rowRawData[h] ?? '')),
  ]);
  const csv = rowsToCsv(headers, rows);
  downloadFile(csv, filename, 'text/csv;charset=utf-8;');
}

/**
 * P4 — Generate and download a sample CSV template matching the GrowEasy CRM schema.
 */
export function downloadSampleTemplate(): void {
  const headers = CRM_COLUMN_ORDER.map(col => CRM_COLUMN_HEADERS[col]);
  const sampleRows = [
    [
      '2024-01-15', 'Ramesh Kumar', 'ramesh@example.com', '91', '9876543210',
      'GrowEasy Corp', 'Mumbai', 'Maharashtra', 'India', 'Agent A',
      'GOOD_LEAD_FOLLOW_UP', 'Interested in 2BHK', 'leads_on_demand', '6 months', 'Referred by friend'
    ],
    [
      '2024-02-10', 'Priya Sharma', 'priya@example.com', '91', '9123456789',
      'Sharma Realty', 'Delhi', 'Delhi', 'India', 'Agent B',
      'DID_NOT_CONNECT', '', 'meridian_tower', 'Immediate', 'Called twice'
    ],
  ];
  const csv = rowsToCsv(headers, sampleRows);
  downloadFile(csv, 'groweasy_sample_template.csv', 'text/csv;charset=utf-8;');
}
