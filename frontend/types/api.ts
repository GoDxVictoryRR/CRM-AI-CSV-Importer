import { CrmRecord } from './crm';

/** A row that was skipped (no email + no mobile, or AI/processing failure). */
export interface SkippedRecord {
  rowIndex: number;
  rowRawData: Record<string, string>;
  reason: string;
}

/** The structured JSON body returned by POST /api/import. */
export interface ImportResponse {
  parsed: CrmRecord[];
  skipped: SkippedRecord[];
  totalParsed: number;
  totalSkipped: number;
}

/** Shape of error responses from the backend. */
export interface ApiError {
  message: string;
  code?: string;
}
